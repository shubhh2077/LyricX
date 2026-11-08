# gsmtc.ps1 - Windows GSMTC reader
# Returns JSON with current media state including thumbnail as base64

param()
$ErrorActionPreference = 'Stop'

try {
    # Load WinRT Runtime assembly containing System.WindowsRuntimeSystemExtensions
    $null = [System.Reflection.Assembly]::LoadWithPartialName('System.Runtime.WindowsRuntime')

    # Register Windows Media Control WinRT type
    $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime]

    $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() |
        Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and ($_.GetParameters().Count -eq 1) } |
        Select-Object -First 1

    if ($null -eq $asTaskGeneric) {
        '{"status":"error","msg":"AsTask method not found"}' | Write-Output
        exit 0
    }

    function Await {
        param($Op, [Type]$T)
        $method = $asTaskGeneric.MakeGenericMethod($T)
        $task   = $method.Invoke($null, @($Op))
        $task.GetAwaiter().GetResult()
    }

    # Request session manager
    $manager = Await `
        ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) `
        ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

    $session = $manager.GetCurrentSession()

    if ($null -eq $session) {
        '{"status":"nothing"}' | Write-Output
        exit 0
    }

    # Media properties
    $props = Await `
        ($session.TryGetMediaPropertiesAsync()) `
        ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])

    # Playback info
    $pb       = $session.GetPlaybackInfo()
    $timeline = $session.GetTimelineProperties()

    $pbStr = try { $pb.PlaybackStatus.ToString() } catch { 'Unknown' }
    $status = switch ($pbStr) {
        'Playing' { 'playing' }
        'Paused'  { 'paused'  }
        default   { 'stopped' }
    }

    $posMs = [long]$timeline.Position.TotalMilliseconds
    $durMs = [long]$timeline.EndTime.TotalMilliseconds

    # Try to get album art thumbnail
    $thumbB64 = $null
    $thumbMime = 'image/jpeg'

    if ($null -ne $props.Thumbnail) {
        try {
            $null = [Windows.Storage.Streams.DataReader, Windows.Storage, ContentType=WindowsRuntime]
            $stream = Await ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
            $thumbMime = if ($stream.ContentType) { $stream.ContentType } else { 'image/jpeg' }
            $size = [uint32]$stream.Size

            if ($size -gt 0 -and $size -lt 2097152) {  # max 2 MB
                $reader = [Windows.Storage.Streams.DataReader]::new($stream)
                $null = Await ($reader.LoadAsync($size)) ([uint32])
                $bytes = [byte[]]::new($size)
                $reader.ReadBytes($bytes)
                $thumbB64 = [Convert]::ToBase64String($bytes)
            }
        }
        catch {
            # Thumbnail failed silently
        }
    }

    @{
        status    = $status
        title     = [string]$props.Title
        artist    = [string]$props.Artist
        album     = [string]$props.AlbumTitle
        position  = $posMs
        duration  = $durMs
        thumbnail = $thumbB64
        thumbMime = $thumbMime
        source    = [string]$session.SourceAppUserModelId
    } | ConvertTo-Json -Compress

} catch {
    $msg = ($_.Exception.Message -replace '"', "'") -replace '[\r\n]+', ' '
    "{ `"status`": `"error`", `"msg`": `"$msg`" }" | Write-Output
    exit 0
}
