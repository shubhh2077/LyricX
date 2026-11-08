# worker.ps1 - High-speed, low-overhead GSMTC reader for LyricsX
# Runs continuously, emits compact JSON (< 200 bytes) to stdout every 200ms
# Writes album art directly to disk (art_cache.bin) to avoid stdout pipe congestion

param()
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

try {
    $null = [System.Reflection.Assembly]::LoadWithPartialName('System.Runtime.WindowsRuntime')
    $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime]
    $null = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType=WindowsRuntime]
    $null = [Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]

    $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() |
        Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and ($_.GetParameters().Count -eq 1) } |
        Select-Object -First 1

    function Await {
        param($Op, [Type]$T)
        $method = $asTaskGeneric.MakeGenericMethod($T)
        $task   = $method.Invoke($null, @($Op))
        $task.GetAwaiter().GetResult()
    }

    $asStreamMethod = [System.IO.WindowsRuntimeStreamExtensions].GetMethod('AsStream', [Type[]]@([Windows.Storage.Streams.IRandomAccessStream]))
    $artBinPath     = [System.IO.Path]::Combine($PSScriptRoot, 'art_cache.bin')

    $mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

    $lastArtTrack = ""
    $artVersion   = 0
    $hasArt       = $false
    $thumbMime    = "image/jpeg"

    while ($true) {
        try {
            $session = $mgr.GetCurrentSession()
            if ($null -eq $session) {
                '{"status":"nothing"}' | Write-Output
                [Console]::Out.Flush()
                Start-Sleep -Milliseconds 200
                continue
            }

            $props    = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
            $pb       = $session.GetPlaybackInfo()
            $timeline = $session.GetTimelineProperties()

            $pbStr = try { $pb.PlaybackStatus.ToString() } catch { 'Unknown' }
            $status = switch ($pbStr) {
                'Playing' { 'playing' }
                'Paused'  { 'paused'  }
                default   { 'stopped' }
            }

            $title  = [string]$props.Title
            $artist = [string]$props.Artist
            $album  = [string]$props.AlbumTitle

            $now = [DateTimeOffset]::UtcNow
            $age = ($now - $timeline.LastUpdatedTime).TotalMilliseconds
            $rawPos = [long]$timeline.Position.TotalMilliseconds
            $durMs  = [long]$timeline.EndTime.TotalMilliseconds

            # Calculate accurate position
            $calcPos = if ($status -eq 'playing' -and $age -ge 0 -and $age -lt 600000) {
                [long]($rawPos + $age)
            } else {
                $rawPos
            }

            # Thumbnail extraction to disk file (avoids piping 200KB base64 over stdout)
            $curTrackKey = "$title|$artist|$album"
            if ($curTrackKey -ne $lastArtTrack) {
                $lastArtTrack = $curTrackKey
                $hasArt = $false
                if ($null -ne $props.Thumbnail) {
                    try {
                        $stream = Await ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
                        $thumbMime = if ($stream.ContentType) { $stream.ContentType } else { 'image/jpeg' }
                        $netStream = $asStreamMethod.Invoke($null, @($stream))
                        $ms = New-Object System.IO.MemoryStream
                        $netStream.CopyTo($ms)
                        $bytes = $ms.ToArray()
                        if ($bytes.Length -gt 0) {
                            [System.IO.File]::WriteAllBytes($artBinPath, $bytes)
                            $artVersion++
                            $hasArt = $true
                        }
                    } catch {}
                }
            }

            $outObj = @{
                status     = $status
                title      = $title
                artist     = $artist
                album      = $album
                position   = $calcPos
                duration   = $durMs
                hasArt     = $hasArt
                artVersion = $artVersion
                thumbMime  = $thumbMime
                source     = [string]$session.SourceAppUserModelId
                serverTime = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            }

            $outObj | ConvertTo-Json -Compress | Write-Output
            [Console]::Out.Flush()

        } catch {
            '{"status":"nothing"}' | Write-Output
            [Console]::Out.Flush()
        }

        Start-Sleep -Milliseconds 150
    }

} catch {
    $msg = ($_.Exception.Message -replace '"', "'") -replace '[\r\n]+', ' '
    "{ `"status`": `"error`", `"msg`": `"$msg`" }" | Write-Output
    [Console]::Out.Flush()
}
