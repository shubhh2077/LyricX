// server.js — LyricsX backend
// Node 22 native, zero external dependencies

import http from 'node:http';
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const PUBLIC = path.join(__dirname, 'public');
const WORKER_SCRIPT = path.join(__dirname, 'server', 'worker.ps1');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

// ─── Persistent Background Worker ──────────────────────────────────────────

let _mediaCache = { status: 'loading' };
let _currentArt = {
  buffer: null,
  mime: 'image/jpeg',
  version: 0,
};
let _workerProcess = null;
let _lastTrackKey = '';

function startWorker() {
  if (_workerProcess) {
    try { _workerProcess.kill(); } catch {}
  }

  _workerProcess = spawn('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', WORKER_SCRIPT,
  ]);

  let lineBuf = '';

  _workerProcess.stdout.on('data', (chunk) => {
    lineBuf += chunk.toString('utf8');
    const lines = lineBuf.split('\n');
    lineBuf = lines.pop(); // keep incomplete tail

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('{')) continue;

      try {
        const data = JSON.parse(trimmed);

        // If a new thumbnail base64 string arrived, extract buffer & advance version
        if (data.thumbnail) {
          try {
            _currentArt.buffer = Buffer.from(data.thumbnail, 'base64');
            _currentArt.mime   = data.thumbMime || 'image/jpeg';
            _currentArt.version++;
          } catch {}
          delete data.thumbnail;
        }

        const trackKey = `${data.title || ''}|${data.artist || ''}`;
        if (trackKey !== _lastTrackKey) {
          _lastTrackKey = trackKey;
        }

        data.hasArt     = !!_currentArt.buffer;
        data.artVersion = _currentArt.version;
        _mediaCache     = data;
      } catch {}
    }
  });

  _workerProcess.stderr.on('data', () => {});

  _workerProcess.on('exit', () => {
    _workerProcess = null;
    setTimeout(startWorker, 1000);
  });

  _workerProcess.on('error', () => {
    _workerProcess = null;
    setTimeout(startWorker, 2000);
  });
}

// Start worker immediately
startWorker();

process.on('exit', () => {
  if (_workerProcess) {
    try { _workerProcess.kill(); } catch {}
  }
});
process.on('SIGINT', () => {
  if (_workerProcess) {
    try { _workerProcess.kill(); } catch {}
  }
  process.exit(0);
});

// ─── LRCLIB API ─────────────────────────────────────────────────────────────

const LRCLIB_BASE = 'https://lrclib.net/api';
const LRCLIB_UA   = 'LyricsX/1.0 (https://github.com/lyricsx/lyricsx)';

async function fetchLyrics(artist, title, duration) {
  const params = new URLSearchParams({ artist_name: artist, track_name: title });
  if (duration) params.set('duration', String(Math.round(+duration / 1000)));

  try {
    const res = await fetch(`${LRCLIB_BASE}/get?${params}`, {
      headers: { 'User-Agent': LRCLIB_UA },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 404) return { status: 'not_found' };
    if (!res.ok) return { status: 'error', msg: `LRCLIB HTTP ${res.status}` };

    const data = await res.json();
    return {
      status:  'ok',
      synced:  data.syncedLyrics  || null,
      plain:   data.plainLyrics   || null,
      trackId: data.id            || null,
    };
  } catch (e) {
    if (e.name === 'TimeoutError') return { status: 'timeout' };
    if (e.name === 'TypeError')    return { status: 'offline' };
    return { status: 'error', msg: e.message };
  }
}

async function searchLyrics(artist, title) {
  const params = new URLSearchParams({ q: `${artist} ${title}` });
  try {
    const res = await fetch(`${LRCLIB_BASE}/search?${params}`, {
      headers: { 'User-Agent': LRCLIB_UA },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { status: 'not_found' };
    const results = await res.json();
    if (!results.length) return { status: 'not_found' };
    const best = results[0];
    return {
      status:   'ok',
      synced:   best.syncedLyrics || null,
      plain:    best.plainLyrics  || null,
      trackId:  best.id           || null,
      fuzzy:    true,
    };
  } catch {
    return { status: 'not_found' };
  }
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────

function sendJson(res, data, code = 200) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url   = new URL(req.url, `http://localhost:${PORT}`);
  const path_ = url.pathname;

  // ── 1. API: State (real-time from memory, < 0.5ms) ─────────────────────────
  if (path_ === '/api/state') {
    sendJson(res, _mediaCache);
    return;
  }

  // ── 2. API: Album Artwork (cached binary image or download) ─────────────────
  if (path_ === '/api/art') {
    if (!_currentArt.buffer) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('No album artwork available');
      return;
    }

    const isDownload = url.searchParams.get('download') === '1';
    const artist = _mediaCache.artist || 'Artist';
    const title  = _mediaCache.title  || 'Cover';
    const safeName = `${artist} - ${title}`.replace(/[\\/:*?"<>|]/g, '_');
    const ext = _currentArt.mime === 'image/png' ? 'png' : 'jpg';

    res.writeHead(200, {
      'Content-Type': _currentArt.mime,
      'Content-Length': _currentArt.buffer.length,
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': isDownload
        ? `attachment; filename="${encodeURIComponent(safeName)}.${ext}"`
        : `inline; filename="artwork.${ext}"`,
    });
    res.end(_currentArt.buffer);
    return;
  }

  // ── 3. API: Lyrics ─────────────────────────────────────────────────────────
  if (path_ === '/api/lyrics') {
    const artist   = url.searchParams.get('artist')   || '';
    const title    = url.searchParams.get('title')    || '';
    const duration = url.searchParams.get('duration') || null;

    if (!artist.trim() || !title.trim()) {
      sendJson(res, { error: 'artist and title are required' }, 400);
      return;
    }

    let result = await fetchLyrics(artist, title, duration);
    if (result.status === 'not_found') {
      result = await searchLyrics(artist, title);
    }

    sendJson(res, result);
    return;
  }

  // ── 4. Static files ────────────────────────────────────────────────────────
  let filePath = path_ === '/' ? '/index.html' : path_;
  filePath = path.join(PUBLIC, filePath);

  if (!filePath.startsWith(PUBLIC + path.sep) && filePath !== PUBLIC) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  LyricsX  →  http://localhost:${PORT}\n`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is in use. Try stopping other servers, or edit PORT in server.js.\n`);
  } else {
    console.error(e);
  }
  process.exit(1);
});
