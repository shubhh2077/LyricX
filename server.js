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
const ART_CACHE_FILE = path.join(__dirname, 'server', 'art_cache.bin');

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
let _workerProcess = null;
const _lyricsCache = new Map(); // in-memory lyrics cache for instant 0.1ms responses

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
    lineBuf = lines.pop(); // keep remainder

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('{')) continue;

      try {
        const data = JSON.parse(trimmed);
        data._receivedAt = Date.now();
        _mediaCache = data;
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

// ─── LRCLIB API with in-memory caching ─────────────────────────────────────

const LRCLIB_BASE = 'https://lrclib.net/api';
const LRCLIB_UA   = 'LyricsX/1.0 (https://github.com/lyricsx/lyricsx)';

async function fetchLyrics(artist, title, duration) {
  const cacheKey = `${artist.toLowerCase()}|${title.toLowerCase()}`;
  if (_lyricsCache.has(cacheKey)) {
    return _lyricsCache.get(cacheKey);
  }

  const params = new URLSearchParams({ artist_name: artist, track_name: title });
  if (duration) params.set('duration', String(Math.round(+duration / 1000)));

  try {
    const res = await fetch(`${LRCLIB_BASE}/get?${params}`, {
      headers: { 'User-Agent': LRCLIB_UA },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 404) return { status: 'not_found' };
    if (!res.ok) return { status: 'error', msg: `LRCLIB HTTP ${res.status}` };

    const data = await res.json();
    const result = {
      status:  'ok',
      synced:  data.syncedLyrics  || null,
      plain:   data.plainLyrics   || null,
      trackId: data.id            || null,
    };
    _lyricsCache.set(cacheKey, result);
    return result;
  } catch (e) {
    if (e.name === 'TimeoutError') return { status: 'timeout' };
    if (e.name === 'TypeError')    return { status: 'offline' };
    return { status: 'error', msg: e.message };
  }
}

async function searchLyrics(artist, title) {
  const cacheKey = `${artist.toLowerCase()}|${title.toLowerCase()}`;
  if (_lyricsCache.has(cacheKey)) {
    return _lyricsCache.get(cacheKey);
  }

  const cleanTitle = title.replace(/\s*[\(\[].*?[\)\]]/g, '').trim(); // strip (Speed), [Remastered], etc.
  const query = cleanTitle ? `${artist} ${cleanTitle}` : `${artist} ${title}`;
  const params = new URLSearchParams({ q: query });

  try {
    const res = await fetch(`${LRCLIB_BASE}/search?${params}`, {
      headers: { 'User-Agent': LRCLIB_UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { status: 'not_found' };
    const results = await res.json();
    if (!results || !results.length) return { status: 'not_found' };
    const best = results[0];
    const result = {
      status:   'ok',
      synced:   best.syncedLyrics || null,
      plain:    best.plainLyrics  || null,
      trackId:  best.id           || null,
      fuzzy:    true,
    };
    _lyricsCache.set(cacheKey, result);
    return result;
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

  // ── 1. API: State ─────────────────────────────────────────────────────────
  if (path_ === '/api/state') {
    let out = _mediaCache;
    if (_mediaCache.status === 'playing' && _mediaCache._receivedAt) {
      const extra = Math.max(0, Date.now() - _mediaCache._receivedAt);
      out = { ..._mediaCache, position: (_mediaCache.position || 0) + extra };
    }
    sendJson(res, out);
    return;
  }

  // ── 2. API: Album Artwork (cached binary file directly from disk) ───────────
  if (path_ === '/api/art') {
    if (!fs.existsSync(ART_CACHE_FILE)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('No artwork available');
      return;
    }

    const isDownload = url.searchParams.get('download') === '1';
    const artist = _mediaCache.artist || 'Artist';
    const title  = _mediaCache.title  || 'Cover';
    const safeName = `${artist} - ${title}`.replace(/[\\/:*?"<>|]/g, '_');
    const mime = _mediaCache.thumbMime || 'image/jpeg';
    const ext  = mime.includes('png') ? 'png' : 'jpg';

    fs.readFile(ART_CACHE_FILE, (err, buf) => {
      if (err) {
        res.writeHead(500);
        res.end('Error reading artwork');
        return;
      }
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': buf.length,
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Disposition': isDownload
          ? `attachment; filename="${encodeURIComponent(safeName)}.${ext}"`
          : `inline; filename="artwork.${ext}"`,
      });
      res.end(buf);
    });
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
    if (result.status === 'not_found' || (!result.synced && !result.plain)) {
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
