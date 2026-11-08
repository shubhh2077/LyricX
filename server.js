// server.js — LyricsX backend
// Node 22, no npm dependencies

import http from 'node:http';
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const PUBLIC = path.join(__dirname, 'public');
const GSMTC_SCRIPT = path.join(__dirname, 'server', 'gsmtc.ps1');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

// ─── GSMTC ───────────────────────────────────────────────────────────────────

let _mediaCache     = { status: 'loading' };
let _mediaCacheTime = 0;
const MEDIA_TTL = 800; // ms between PS calls

function readMediaState() {
  return new Promise((resolve) => {
    const now = Date.now();
    if (now - _mediaCacheTime < MEDIA_TTL) {
      resolve(_mediaCache);
      return;
    }

    const ps = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', GSMTC_SCRIPT,
    ], { timeout: 6000 });

    let out = '';
    let err = '';
    ps.stdout.on('data', d => { out += d.toString(); });
    ps.stderr.on('data', d => { err += d.toString(); });

    ps.on('close', (code) => {
      _mediaCacheTime = Date.now();
      const raw = out.trim();
      if (!raw) {
        _mediaCache = { status: 'nothing', msg: err.slice(0, 200) };
      } else {
        try {
          _mediaCache = JSON.parse(raw);
        } catch {
          _mediaCache = { status: 'error', msg: 'Bad JSON from gsmtc.ps1' };
        }
      }
      resolve(_mediaCache);
    });

    ps.on('error', (e) => {
      _mediaCacheTime = Date.now();
      _mediaCache = { status: 'error', msg: e.message };
      resolve(_mediaCache);
    });
  });
}

// ─── LRCLIB ──────────────────────────────────────────────────────────────────

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

// Search LRCLIB when exact match fails
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
    // Pick best match
    const best = results[0];
    return {
      status:   'ok',
      synced:   best.syncedLyrics || null,
      plain:    best.plainLyrics  || null,
      trackId:  best.id           || null,
      fuzzy:    true,  // flag that we didn't get an exact match
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

function sendError(res, code, msg) {
  sendJson(res, { error: msg }, code);
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url  = new URL(req.url, `http://localhost:${PORT}`);
  const path_ = url.pathname;

  // ── API ──────────────────────────────────────────────────────────────────

  if (path_ === '/api/state') {
    const state = await readMediaState();
    sendJson(res, state);
    return;
  }

  if (path_ === '/api/lyrics') {
    const artist   = url.searchParams.get('artist')   || '';
    const title    = url.searchParams.get('title')    || '';
    const duration = url.searchParams.get('duration') || null;

    if (!artist.trim() || !title.trim()) {
      sendError(res, 400, 'artist and title are required');
      return;
    }

    let result = await fetchLyrics(artist, title, duration);

    // Fall back to search if exact lookup fails
    if (result.status === 'not_found') {
      result = await searchLyrics(artist, title);
    }

    sendJson(res, result);
    return;
  }

  // ── Static files ─────────────────────────────────────────────────────────

  let filePath = path_ === '/' ? '/index.html' : path_;
  filePath = path.join(PUBLIC, filePath);

  // Safety: prevent directory traversal
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
  console.log('  Open that URL in your browser.');
  console.log('  Press Ctrl+C to stop.\n');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is in use. Try stopping other servers, or edit PORT in server.js.\n`);
  } else {
    console.error(e);
  }
  process.exit(1);
});
