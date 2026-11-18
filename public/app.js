/**
 * LyricsX — app.js
 * Continuous 60fps/120fps drift-corrected rendering engine.
 * Tokens, style math and palette values ported directly from
 * LyricsX_-_Design_Reference.html.
 */

// ══════════════════════════════════════════════════════════
// 1. DESIGN TOKENS (from reference #tokens block)
// ══════════════════════════════════════════════════════════

const T = {
  fonts: {
    jakarta: "'Plus Jakarta Sans','Noto Sans SC','Noto Sans Arabic',system-ui,sans-serif",
    inter:   "Inter,'Noto Sans SC','Noto Sans Arabic',system-ui,sans-serif",
    serif:   "Fraunces,'Noto Sans SC','Noto Sans Arabic',Georgia,serif",
    mono:    "'JetBrains Mono','Noto Sans SC','Noto Sans Arabic',ui-monospace,monospace",
  },
  weight: { hero: 800, bold: 700, soft: 600, serif: 500, mono: 500 },
  lineHeight: { tight: 1.02, normal: 1.22, editorial: 1.16 },
  space: { lineGap: 0.35 },
  ease: { ui: 'cubic-bezier(.2,.8,.2,1)' },
  palettes: {
    reference: { name: 'Pink',    hero: '#d6a0cd', soft: '#c9a9bd', cream: '#f2e7a6', pill: '#2b2428', glow: '#e0509f' },
    mint:      { name: 'Mint',    hero: '#a6e0cc', soft: '#9fc4b8', cream: '#eaf5c4', pill: '#1c2623', glow: '#2fd6a0' },
    amber:     { name: 'Amber',   hero: '#f0bf88', soft: '#d2ab86', cream: '#fff0c4', pill: '#2a2119', glow: '#ff8a3d' },
    ice:       { name: 'Ice',     hero: '#a8c7f2', soft: '#9db4d4', cream: '#e8f1ff', pill: '#1b2029', glow: '#4a8bff' },
    violet:    { name: 'Violet',  hero: '#c4a8f5', soft: '#b09edd', cream: '#ede8ff', pill: '#1f1a2e', glow: '#8b5cf6' },
    rose:      { name: 'Rose',    hero: '#f4a0b5', soft: '#d99aab', cream: '#fff0f3', pill: '#2a1a1e', glow: '#fb7185' },
    ocean:     { name: 'Ocean',   hero: '#7dd3fc', soft: '#6bbae0', cream: '#e0f4ff', pill: '#0f2233', glow: '#0ea5e9' },
    forest:    { name: 'Forest',  hero: '#86efac', soft: '#75d896', cream: '#ecfdf5', pill: '#0d2016', glow: '#22c55e' },
    sunset:    { name: 'Sunset',  hero: '#fda4af', soft: '#e8939d', cream: '#fff7ed', pill: '#2c1810', glow: '#f97316' },
    mono:      { name: 'Mono',    hero: '#d4d4d4', soft: '#b0b0b0', cream: '#f5f5f5', pill: '#1a1a1a', glow: '#a0a0a0' },
  },
  bg: { scrim: { black: 0, edge: 0, album: 0.55, aurora: 0.4, particles: 0.15, stars: 0.1, grain: 0.1 }, particles: 48, stars: 160, canvasAlpha: 0.4 },
  styles: {
    kinetic:    { heroH: 0.22, heroW: 0.15, fitW: 0.88, weight: 'hero',  lh: 'tight',    font: 'jakarta', scale:[[0,1],[1,0.42],[2,0.33],[3,0.28]], op:[[0,1],[1,0.8],[1.55,0]], y:[[0,0],[1,1],[2,1.65],[3,2.1]], ySpace:1.02, stagger:0.1, pill:true,  align:'center' },
    afterglow:  { heroH: 0.2,  heroW: 0.14, fitW: 0.8,  weight: 'hero',  lh: 'tight',    font: 'jakarta', scale:[[0,1],[1,0.5],[6,0.4]], scalePast:[[0,1],[1,0.62],[2,0.5],[6,0.4]], op:[[0,1],[1,0.28],[1.6,0]], opPast:[[0,1],[1,0.62],[3,0.3],[5,0.1],[6,0]], y:[[0,0],[1,0.8],[2,1.4],[3,1.9],[6,3.2]], ySpace:1, stagger:0, pill:false, align:'left' },
    classic:    { size: 0.085, weight: 'bold',  lh: 'normal',   font: 'jakarta', width:0.84, stack:true,  scale:[[0,1],[1,0.6],[2,0.5],[3,0.45]], op:[[0,1],[1,0.42],[2,0.16],[3,0]] },
    karaoke:    { size: 0.078, weight: 'bold',  lh: 'normal',   font: 'jakarta', width:0.84, stack:true,  words:true, scale:[[0,1],[1,0.62],[2,0.5]], op:[[0,1],[1,0.4],[2,0.15],[3,0]] },
    minimal:    { size: 0.1,   weight: 'soft',  lh: 'normal',   font: 'inter',   width:0.8,  stack:false, scale:[[0,1],[1,0.94]], op:[[0,1],[0.55,0]] },
    editorial:  { size: 0.105, weight: 'serif', lh: 'editorial',font: 'serif',   width:0.84, left:true, stack:true, scale:[[0,1],[1,0.62],[2,0.55]], op:[[0,1],[1,0.2],[2,0.08],[3,0]] },
    typewriter: { size: 0.055, weight: 'mono',  lh: 'normal',   font: 'mono',    width:0.84, left:true, chars:true, stack:true, scale:[[0,1],[1,0.9],[2,0.8]], op:[[0,1],[1,0.45],[2,0.2],[3,0]] },
    poster:     { size: 0.55,  weight: 'hero',  lh: 'tight',    font: 'jakarta', fit:0.9, drift:0.06, shrink:0.25, op:[[0,1],[0.45,0]] },
    pillrail:   { size: 0.07,  weight: 'bold',  lh: 'normal',   font: 'jakarta', width:0.86, stack:true, words:true, pill:true, scale:[[0,1],[1,0.62],[2,0.5]], op:[[0,1],[1,0.4],[2,0.15],[3,0]] },
  },
  barrel: {
    step: 38,
    perspective: 1.6,
    rollFrac: 0.45,
    rollMinMs: 160,
    rollMaxMs: 420,
    fadeStart: 62,
    fadeEnd: 90,
    axisTilt: 0,
  },
  fisheye: {
    A: 0.12,
    KB: 0.45,
    Rl: 0.55,
  },
};

// ══════════════════════════════════════════════════════════
// 2. UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════

const lerp   = (a, b, t) => a + (b - a) * t;
const clamp  = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const curve  = (c, x) => {
  if (x <= c[0][0]) return c[0][1];
  for (let i = 1; i < c.length; i++) {
    if (x <= c[i][0]) {
      const a = c[i-1], b = c[i];
      return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
    }
  }
  return c[c.length-1][1];
};
const hf = (i, k) => { const x = Math.sin(i*127.1 + k*311.7)*43758.5453; return x - Math.floor(x); };

const el = (tag, cls, html, par) => {
  const e = document.createElement(tag);
  if (cls)      e.className = cls;
  if (html != null) e.innerHTML = html;
  if (par)      par.appendChild(e);
  return e;
};

function fmtTime(ms) {
  if (!isFinite(ms) || ms < 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function isRTL(text) {
  return /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);
}
function isCJK(text) {
  return /[\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/.test(text);
}

// ══════════════════════════════════════════════════════════
// 3. ICON SYSTEM
// ══════════════════════════════════════════════════════════

const ICONS = {
  eye:    `<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="currentColor"/><circle cx="12" cy="12" r="4" fill="#000"/></svg>`,
  heart:  `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/></svg>`,
  fire:   `<svg viewBox="0 0 24 24"><path d="M12 2c0 0-5 5-5 11a5 5 0 0010 0c0-6-5-11-5-11z" fill="currentColor" opacity=".8"/><path d="M12 10c0 0-2 2-2 4a2 2 0 004 0c0-2-2-4-2-4z" fill="var(--cream)"/></svg>`,
  moon:   `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/></svg>`,
  person: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="5" fill="currentColor"/><path d="M3 22c0-5 4-8 9-8s9 3 9 8z" fill="currentColor"/></svg>`,
  smile:  `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="var(--cream)"/><circle cx="8" cy="10" r="1.6" fill="#3a2a10"/><circle cx="16" cy="10" r="1.6" fill="#3a2a10"/><path d="M6 14c2 4 10 4 12 0" stroke="#3a2a10" stroke-width="2" fill="none"/></svg>`,
  drop:   `<svg viewBox="0 0 24 24"><path d="M12 2l-7 10a7 7 0 0014 0z" fill="currentColor"/></svg>`,
  music:  `<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="18" cy="16" r="3" fill="currentColor"/></svg>`,
  hourglass: `<svg viewBox="0 0 24 24"><path d="M6 2v6l4 4-4 4v6h12v-6l-4-4 4-4V2H6zm10 14.5V20H8v-3.5l4-4 4 4zM12 11.5l-4-4V4h8v3.5l-4 4z" fill="currentColor"/></svg>`,
  clock: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
};

const ICON_KEYWORDS = {
  eye:    ['see','saw','eyes','eye','look','looking','looked','vision','sight','watching','watch','stare','staring'],
  heart:  ['love','heart','loving','loved','adore','care','miss','missing','cherish','feel','feeling'],
  fire:   ['fire','burn','burning','flame','blazing','hot','passion','desire','wild'],
  moon:   ['moon','night','midnight','dark','darkness','star','stars','sky','dream','dreaming','sleep'],
  person: ['you','your','yours','yourself','we','us','our','them','they','someone','her','him'],
  smile:  ['face','smile','laugh','happy','joy','light','alive','grin','beautiful','pretty'],
  drop:   ['rain','tears','cry','crying','tear','water','ocean','sea','wave','river','flood','drown'],
  music:  ['song','music','sing','sang','singing','melody','rhythm','beat','sound','hear','heard'],
  hourglass: ['wait','waiting','slow','delay','hold','stay'],
  clock:  ['minute','minutes','time','second','seconds','hour','hours','clock','late','early'],
};

function detectIcon(word) {
  const lc = word.toLowerCase().replace(/[^a-z]/g, '');
  for (const [icon, kws] of Object.entries(ICON_KEYWORDS)) {
    if (kws.includes(lc)) return icon;
  }
  return null;
}

// ══════════════════════════════════════════════════════════
// 4. DEMO SONG
// ══════════════════════════════════════════════════════════

const DEMO_LRC = `[00:00.00] ♪
[00:04.50] The less I know the better
[00:08.80] Someone said you got a new friend
[00:13.00] Does she love you better than I can
[00:17.50] There's a river running wild
[00:21.80] That will always keep your two hearts apart
[00:26.00] ♪
[00:30.50] I'm crying for the last time
[00:34.80] You look happy on the other side
[00:39.10] Behind the camera, far away
[00:43.40] And I love you in the morning
[00:47.70] I love you in the midnight hour
[00:52.00] ♪
[00:56.50] The less I know the better
[01:00.80] The less I know the better
[01:05.10] The less I know
[01:09.40] ♪`;

const DEMO_TRACK = {
  title: 'The Less I Know The Better',
  artist: 'Tame Impala',
  album: 'Currents',
  status: 'playing',
  position: 0,
  duration: 75000,
  hasArt: false,
};

// ══════════════════════════════════════════════════════════
// 5. LRC PARSER & NATURAL VOCAL PHRASING ENGINE
// ══════════════════════════════════════════════════════════

function parseLRC(lrcText) {
  const lines = [];
  for (const raw of lrcText.split('\n')) {
    const m = raw.match(/^\[(\d{2}):(\d{2})[.:](\d{2,3})\](.*)/);
    if (!m) continue;
    const ms = (+m[1] * 60 + +m[2]) * 1000 + +m[3] * (m[3].length === 2 ? 10 : 1);
    const text = m[4].trim();
    if (text && !/^\[.+\]$/.test(text)) {
      lines.push({ time: ms, text });
    }
  }
  lines.sort((a, b) => a.time - b.time);
  return lines;
}

function buildLyrics(lrcLines, totalDuration) {
  const words = [];
  const lines = [];
  const isInstrumental = (txt) => /^[♪♫\s]+$/.test(txt);

  lrcLines.forEach((line, li) => {
    const nextLine = lrcLines[li + 1];
    let rawGap = nextLine ? (nextLine.time - line.time) : 4000;
    if (rawGap <= 0) rawGap = 3000;

    const inst = isInstrumental(line.text);
    const rtl  = isRTL(line.text);
    const cjk  = isCJK(line.text);

    const tokens = cjk
      ? Array.from(line.text.match(/.{1,2}/gu) || [line.text])
      : inst
        ? [line.text]
        : line.text.split(/\s+/).filter(Boolean);

    const nWords = tokens.length;
    if (nWords === 0) return;

    // Distribute words equally across line duration
    // For normal musical lines (<= 6.5s), words span the full line duration.
    // For long instrumental gaps (> 6.5s), vocals conclude naturally and rest.
    const phraseDur = rawGap <= 6500 ? rawGap : Math.min(rawGap - 1500, Math.max(2500, nWords * 500));
    const wordDur   = phraseDur / nWords;

    const lineIndex = lines.length;
    const lineFirst = words.length;

    lines.push({
      text: line.text,
      first: lineFirst,
      n: nWords,
      s: line.time,
      e: line.time + phraseDur,
      nextS: nextLine ? nextLine.time : (line.time + rawGap),
      rtl,
      cjk,
      inst,
    });

    let lastIcon = -99;
    tokens.forEach((tok, k) => {
      const wordStart = line.time + k * wordDur;
      const wordEnd   = wordStart + wordDur * 0.94;
      const rawIcon   = detectIcon(tok);
      const icon      = rawIcon && (k - lastIcon > 1) ? rawIcon : null;
      if (icon) lastIcon = k;

      words.push({
        t: tok,
        s: wordStart,
        e: wordEnd,
        line: lineIndex,
        k,
        rtl,
        inst,
        icon,
        side: (k % 2 === 0) ? 'l' : 'r',
      });
    });
  });

  if (!words.length) return null;

  const N = words.length;

  function pos(t) {
    let i = -1;
    for (let j = 0; j < N; j++) {
      if (words[j].s <= t) i = j;
      else break;
    }

    let p;
    if (i < 0) {
      const d0 = words[1] ? Math.max(1, words[1].s - words[0].s) : 1000;
      p = (t - words[0].s) / d0;
    } else if (i === N - 1) {
      p = i + clamp((t - words[i].s) / Math.max(1, words[i].e - words[i].s));
    } else {
      p = i + (t - words[i].s) / Math.max(1, words[i + 1].s - words[i].s);
    }

    const fi = clamp(Math.floor(p), 0, N - 1);
    const L  = words[fi].line;
    const ln = lines[L];

    // Continuous line position q derived directly from monotonic word position p.
    // Smooth, guaranteed non-reversing transition as p finishes the line.
    const endP = ln.first + ln.n;
    const transWindow = Math.min(0.6, ln.n * 0.35);
    const trans = clamp((p - (endP - transWindow)) / transWindow);
    const q = L + trans;

    return { p, q };
  }

  return { words, lines, pos, end: words[N-1].e + 800 };
}

// ══════════════════════════════════════════════════════════
// 6. CONTINUOUS DRIFT-CORRECTED CLOCK (ZERO JITTER)
// ══════════════════════════════════════════════════════════

class Clock {
  constructor() {
    this.t = 0;              // continuous local clock in ms
    this.lastFrameTime = 0;  // performance.now() of previous RAF frame
    this.isPlaying = false;
    this.duration = 0;
    this.nudgeMs = 0;
    this.leadTimeMs = 280;   // visual lead time for zero perceived audio latency
    this.rate = 1.0;         // drift compensation rate
  }

  // Advances continuously on every requestAnimationFrame frame (60-144fps)
  tick(now) {
    if (!this.lastFrameTime) this.lastFrameTime = now;
    const dt = Math.min(100, Math.max(0, now - this.lastFrameTime));
    this.lastFrameTime = now;

    if (this.isPlaying) {
      this.t += dt * this.rate;
    }
    return this.position;
  }

  // Synchronizes with incoming server position without jumping/stuttering
  sync(serverPosMs, playing, durationMs) {
    if (durationMs) this.duration = durationMs;

    if (this.isPlaying !== playing) {
      this.isPlaying = playing;
      this.t = serverPosMs;
      this.rate = 1.0;
      return;
    }

    if (!playing) {
      this.t = serverPosMs;
      this.rate = 1.0;
      return;
    }

    const target = serverPosMs;
    const diff   = target - this.t;

    // If seeked or large gap (> 600ms), snap immediately
    if (Math.abs(diff) > 600) {
      this.t = target;
      this.rate = 1.0;
      return;
    }

    // Gentle micro-adjustment of rate (±4%) to stay in perfect lockstep
    this.rate = 1.0 + clamp(diff / 1000, -0.04, 0.04);
  }

  get position() {
    return Math.max(0, this.t + this.nudgeMs + this.leadTimeMs);
  }

  get progress() {
    return this.duration ? clamp(this.position / this.duration) : 0;
  }
}

// ══════════════════════════════════════════════════════════
// 7. SETTINGS
// ══════════════════════════════════════════════════════════

const SETTINGS_KEY = 'lyricsx-settings';

const DEFAULT_SETTINGS = {
  style:     'kinetic',
  bg:        'edge',
  palette:   'reference',
  font:      'auto',
  intensity: 1.0,
  icons:     true,
  timingMs:  0,
  fisheye:   false,
  edgeGlow:  true,
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

// ══════════════════════════════════════════════════════════
// 8. TYPOGRAPHY STYLES (ALWAYS FULL MOTION)
// ══════════════════════════════════════════════════════════

function setup(stage, c) {
  stage.style.fontWeight  = T.weight[c.weight];
  stage.style.lineHeight  = T.lineHeight[c.lh];
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function makeKineticStyle() {
  const c = T.styles.kinetic;
  let st, drumEl, els = [], cells = [], W = 0, H = 0, F = 0, R = 0, fit = [], pillIndices = new Set();

  return {
    id: 'kinetic',
    name: 'Kinetic Words',
    blurb: 'Three words on a rotating 3D circular drum with optional fisheye lens.',
    font: c.font,

    mount(stage, LY, settings) {
      st = stage;
      st.innerHTML = '';
      setup(st, c);

      // Drum container with preserve-3d
      drumEl = el('div', 'kinetic-drum', null, st);

      const showIcons = settings.icons;

      // Select exactly one random word per line to receive the pill background
      pillIndices = new Set();
      LY.lines.forEach((ln, li) => {
        if (ln.n > 0) {
          const randOffset = Math.floor(hf(li + 7, 33) * ln.n);
          pillIndices.add(ln.first + randOffset);
        }
      });

      cells = [];
      els = [];

      LY.words.forEach((w) => {
        // Centering wrapper cell in 3D drum space
        const cell = el('div', 'kw-cell', null, drumEl);

        const iconHtml = (showIcons && w.icon)
          ? `<span class="ic" style="order:${w.side === 'l' ? -1 : 1}">${ICONS[w.icon] || ''}</span>`
          : '';

        // Split word into one span per letter for fisheye lens
        const chars = Array.from(w.t);
        const charSpansHtml = chars.map((ch, ci) => {
          const safeCh = ch === ' ' ? '&nbsp;' : ch;
          return `<span class="k-char" data-ci="${ci}"><b>${safeCh}</b><u>${safeCh}</u></span>`;
        }).join('');

        const e = el('div', 'kw',
          iconHtml + `<span class="tw"><i class="pill"></i>${charSpansHtml}</span>`,
          cell
        );

        if (w.rtl) e.dir = 'rtl';
        e._pill = e.querySelector('.pill');
        e._charSpans = Array.from(e.querySelectorAll('.k-char'));

        cells.push(cell);
        els.push(e);
      });
    },

    layout(w, h) {
      W = w;
      H = h;
      F = Math.min(h * c.heroH, w * c.heroW);
      st.style.fontSize = F + 'px';

      // Stage perspective = 1.6 x stage height, centered
      const P = T.barrel.perspective * h;
      st.style.perspective = P + 'px';
      st.style.perspectiveOrigin = '50% 50%';

      // S = resting vertical distance between hero word and next word
      const S = 1.02 * F;
      const stepRad = (T.barrel.step * Math.PI) / 180;
      R = S / Math.sin(stepRad);

      if (drumEl) {
        drumEl.style.transform = `translateZ(${-R}px) rotateZ(${T.barrel.axisTilt}deg)`;
      }

      // Measure fit and letter offsets once on build/resize:
      fit = els.map((e) => {
        const tw = e.querySelector('.tw');
        const twW = tw ? tw.offsetWidth : e.offsetWidth;
        const fitScale = Math.min(1, (W * c.fitW) / Math.max(1, twW));

        const lettersMeta = [];
        const charSpans = e._charSpans;
        if (charSpans && charSpans.length) {
          const halfTwW = twW / 2;
          for (let ci = 0; ci < charSpans.length; ci++) {
            const span = charSpans[ci];
            const spanLeft = span.offsetLeft;
            const spanW = span.offsetWidth;
            lettersMeta.push({
              span,
              offset: (spanLeft + spanW / 2) - halfTwW,
              halfW: Math.max(1, spanW / 2),
            });
          }
        }
        e._lettersMeta = lettersMeta;
        return fitScale;
      });
    },

    render(LY, t, settings) {
      const rawP = LY.pos(t).p;
      const N = LY.words.length;
      if (N === 0) return;

      const i = clamp(Math.floor(rawP), 0, N - 1);
      const f = rawP - i;

      // Roll timing: pure function of p, no extra state
      const curStart = LY.words[i].s;
      const nextStart = (i + 1 < N) ? LY.words[i + 1].s : (LY.words[i].e + 400);
      const interval = Math.max(1, nextStart - curStart);

      const rollMs = clamp(T.barrel.rollFrac * interval, T.barrel.rollMinMs, T.barrel.rollMaxMs);
      const share = Math.min(1, rollMs / interval);
      const f2 = clamp((f - (1 - share)) / share, 0, 1);
      const pr = i + easeInOutCubic(f2);

      const useFisheye = !!settings.fisheye;
      const Rl = T.fisheye.Rl * Math.min(W, H);
      const A = T.fisheye.A;
      const KB = T.fisheye.KB;

      LY.words.forEach((w, k) => {
        const cell = cells[k];
        const e = els[k];
        if (!cell || !e) return;

        const d = k - pr;
        const absD = Math.abs(d);

        // Outside active drum visible range
        if (absD > 2.6) {
          cell.style.display = 'none';
          return;
        }

        const angle = d * T.barrel.step; // positive = below center
        const absAngle = Math.abs(angle);

        // Skip words beyond 95 degrees (behind drum)
        if (absAngle > 95) {
          cell.style.display = 'none';
          return;
        }
        cell.style.display = '';

        // Smooth fade as |angle| goes from 62 to 90 degrees
        let angleFade = 1;
        if (absAngle > T.barrel.fadeStart) {
          angleFade = clamp(1 - (absAngle - T.barrel.fadeStart) / (T.barrel.fadeEnd - T.barrel.fadeStart));
        }

        const o = curve(d < 0 && c.opPast ? c.opPast : c.op, absD) * angleFade;
        if (o < 0.003) {
          cell.style.opacity = 0;
          return;
        }
        cell.style.opacity = o;

        // Scale: existing size curve
        const s = curve(d < 0 && c.scalePast ? c.scalePast : c.scale, absD) * (fit[k] || 1);

        // Word transform in exact order: rotateX(-angle) translateZ(R) scale(s)
        cell.style.transform = `rotateX(${-angle}deg) translateZ(${R}px) scale(${s})`;

        // Center word in wrapper
        e.style.transform = `translate(-50%, -50%)`;

        // Pill background opacity (only one word per line gets pill)
        const isPillWord = pillIndices.has(k);
        const pa = isPillWord ? clamp(1 - Math.abs(d - 1)) : 0;
        e.style.setProperty('--pa', pa.toFixed(3));
        if (e._pill) e._pill.style.opacity = pa;

        // FISHEYE LENS
        if (!useFisheye) {
          if (e._hadFisheye) {
            if (e._lettersMeta) {
              for (let m = 0; m < e._lettersMeta.length; m++) {
                e._lettersMeta[m].span.style.transform = '';
              }
            }
            e._hadFisheye = false;
          }
        } else {
          e._hadFisheye = true;
          const angleRad = (angle * Math.PI) / 180;
          const y = R * Math.sin(angleRad); // word vertical position in stage px

          if (e._lettersMeta) {
            for (let m = 0; m < e._lettersMeta.length; m++) {
              const item = e._lettersMeta[m];
              const x = item.offset;

              const r = Math.hypot(x, y) / Rl;
              const g = (1 + A) / (1 + KB * r * r);
              const tx = x * (g - 1);
              const ty = y * (g - 1);

              // Follow curve: map left and right edge points
              const halfW = item.halfW;
              const rL = Math.hypot(x - halfW, y) / Rl;
              const gL = (1 + A) / (1 + KB * rL * rL);
              const xL = (x - halfW) * gL;
              const yL = y * gL;

              const rR = Math.hypot(x + halfW, y) / Rl;
              const gR = (1 + A) / (1 + KB * rR * rR);
              const xR = (x + halfW) * gR;
              const yR = y * gR;

              const dx = xR - xL;
              const dy = yR - yL;
              const theta = Math.atan2(dy, dx) * (180 / Math.PI);

              item.span.style.transform = `translate3d(${tx}px,${ty}px,0) rotateZ(${theta}deg) scale(${g})`;
            }
          }
        }
      });
    },
  };
}

function makeAfterglowStyle() {
  const c = T.styles.afterglow;
  let st, els = [], W = 0, F = 0, fit = [];

  return {
    id: 'afterglow',
    name: 'Afterglow',
    blurb: 'Left-anchored trail: sung words linger and fade upward like smoke.',
    font: c.font,

    mount(stage, LY, settings) {
      st = stage;
      st.innerHTML = '';
      setup(st, c);
      const showIcons = settings.icons;

      els = LY.words.map((w) => {
        const iconHtml = (showIcons && w.icon)
          ? `<span class="ic" style="order:${w.side === 'l' ? -1 : 1}">${ICONS[w.icon] || ''}</span>`
          : '';
        const e = el('div', 'kw kw-afterglow',
          iconHtml + `<span class="tw"><i class="pill"></i><b>${w.t}</b><u>${w.t}</u></span>`,
          st
        );
        e.style.left = '9%';
        e.style.top = '50%';
        if (w.rtl) e.dir = 'rtl';
        e._pill = e.querySelector('.pill');
        e._a    = e.querySelector('b');
        e._b    = e.querySelector('u');
        return e;
      });
    },

    layout(w, h) {
      W = w;
      F = Math.min(h * c.heroH, w * c.heroW);
      st.style.fontSize = F + 'px';
      fit = els.map((e) => Math.min(1, (W * c.fitW) / Math.max(1, e.offsetWidth)));
    },

    render(LY, t, settings) {
      const P  = LY.pos(t).p;
      const I  = Math.min(settings.intensity, 1.3);
      LY.words.forEach((w, j) => {
        const e = els[j];
        if (!e) return;
        const d = j - P;
        const a = Math.abs(d);
        const o = curve(d < 0 && c.opPast ? c.opPast : c.op, a);
        if (o < 0.004) { e.style.opacity = 0; return; }
        const sc = (1 - (1 - curve(d < 0 && c.scalePast ? c.scalePast : c.scale, a)) * I) * (fit[j] || 1);
        const y  = Math.sign(d) * curve(c.y, a) * F * c.ySpace;
        e.style.transform = `translate3d(0,${y}px,0) translate(0,-50%) scale(${sc})`;
        e.style.opacity   = o;
        if (e._pill) e._pill.style.opacity = 0;
        if (e._a)    e._a.style.opacity    = 1;
        if (e._b)    e._b.style.opacity    = 0;
      });
    },
  };
}

function makeStackStyle(key, name, blurb) {
  const c = T.styles[key];
  let st, els = [], cy = [], bs = [];

  return {
    id: key, name, blurb, font: c.font,
    mount(stage, LY, settings) {
      st = stage;
      st.innerHTML = '';
      setup(st, c);
      els = LY.lines.map(ln => {
        const cls = 'ln' + (c.left ? ' left' : '') + (c.pill ? ' pillrail' : '');
        const e   = el('div', cls, '', st);
        if (ln.rtl) e.dir = 'rtl';
        if (ln.inst) {
          e.textContent = ln.text;
          e.style.opacity = 0.3;
        } else if (c.chars) {
          e._c = Array.from(ln.text).map(x => el('span', 'ch', x, e));
          e._c.push(el('span', 'ch', '▍', e));
        } else if (c.words) {
          e._w = [];
          for (let k = 0; k < ln.n; k++) {
            const w  = LY.words[ln.first + k];
            const sp = el('span', 'wd',
              `<i class="pl"></i><b>${w ? w.t : ''}</b><u>${w ? w.t : ''}</u>`, e);
            sp._p = sp.children[0];
            sp._a = sp.children[1];
            sp._u = sp.children[2];
            e._w.push(sp);
            if (!ln.cjk) e.appendChild(document.createTextNode(' '));
          }
        } else {
          e.textContent = ln.text;
        }
        return e;
      });
    },
    layout(w, h) {
      const F = h * c.size;
      st.style.fontSize = F + 'px';
      let prev = 0;
      cy = [];
      bs = [];
      els.forEach((e, i) => {
        e.style.width = (w * (c.left ? 0.84 : c.width)) + 'px';
        const hh = e.offsetHeight || (F * 1.3);
        bs[i] = Math.min(1, h * 0.6 / hh);
        const hs = hh * bs[i];
        cy[i] = c.stack && i ? cy[i-1] + (prev + hs) / 2 + T.space.lineGap * F : 0;
        prev = hs;
      });
    },
    render(LY, t, settings) {
      const r  = LY.pos(t);
      const P  = r.p;
      const Q  = r.q;
      const I  = Math.min(settings.intensity, 1.3);
      const i0 = clamp(Math.floor(Q), 0, Math.max(0, cy.length - 1));
      const i1 = Math.min(i0 + 1, Math.max(0, cy.length - 1));
      const cur = lerp(cy[i0] || 0, cy[i1] || 0, clamp(Q - i0));

      els.forEach((e, i) => {
        const a = Math.abs(i - Q);
        const o = curve(c.op, a);
        if (o < 0.004) { e.style.opacity = 0; return; }
        const sc = (1 - (1 - curve(c.scale, a)) * I) * (bs[i] || 1);
        e.style.opacity   = o;
        e.style.transform = `translate3d(0,${(cy[i] || 0) - cur}px,0) translate(${c.left ? '0' : '-50%'},-50%) scale(${sc})`;
        if (a > 2.5) return;
        if (e._w) {
          e._w.forEach((s, k) => {
            const j   = LY.lines[i].first + k;
            const f   = clamp(P - j);
            const em  = 1 - Math.min(1, Math.abs(P - j));
            if (c.pill) {
              s.style.transform        = `scale(${1 + 0.16 * em * I})`;
              s._p.style.opacity       = em;
              s._a.style.opacity       = 1;
              s._u.style.opacity       = em;
            } else {
              s._u.style.opacity = f;
            }
          });
        }
        if (e._c) {
          const nChars = e._c.length - 1;
          const Lc = LY.words[clamp(Math.floor(P), 0, LY.words.length - 1)]?.line ?? 0;
          const f  = i < Lc ? 1 : i > Lc ? 0
            : clamp((P - LY.lines[i].first) / Math.max(1, LY.lines[i].n));
          e._c.forEach((s, k) => {
            s.style.opacity = k < nChars
              ? clamp(f * nChars - k)
              : (f > 0 && f < 1 ? 1 : 0);
          });
        }
      });
    },
  };
}

function makePosterStyle() {
  const c = T.styles.poster;
  let st, els = [], fit = [], F = 0;
  return {
    id: 'poster', name: 'Poster', blurb: 'One giant word at a time, fitted to the stage.', font: c.font,
    mount(stage, LY) {
      st = stage;
      st.innerHTML = '';
      setup(st, c);
      els = LY.words.map(w => {
        const e = el('div', 'pw', w.t, st);
        if (w.rtl) e.dir = 'rtl';
        return e;
      });
    },
    layout(w, h) {
      F = h;
      st.style.fontSize = h * c.size + 'px';
      fit = els.map(e => Math.min(1,
        w * c.fit / Math.max(1, e.offsetWidth),
        h * c.fit / Math.max(1, e.offsetHeight),
      ));
    },
    render(LY, t, settings) {
      const P = LY.pos(t).p;
      const I = Math.min(settings.intensity, 1.3);
      LY.words.forEach((w, j) => {
        const d = j - P, a = Math.abs(d), o = curve(c.op, a), e = els[j];
        if (!e || o < 0.004) { if (e) e.style.opacity = 0; return; }
        e.style.opacity   = o;
        e.style.transform = `translate3d(0,${d * F * c.drift * I}px,0) translate(-50%,-50%) scale(${(fit[j] || 1) * (1 - c.shrink * I * Math.min(a, 1))})`;
      });
    },
  };
}

const STYLES = {
  kinetic:    makeKineticStyle(),
  afterglow:  makeAfterglowStyle(),
  classic:    makeStackStyle ('classic',   'Classic Stack',  'Active line large; neighbours shrink and fade by distance.'),
  karaoke:    makeStackStyle ('karaoke',   'Karaoke',        'Word-by-word fill driven by the same fractional position.'),
  minimal:    makeStackStyle ('minimal',   'Minimal',        'One centred line, smooth crossfade.'),
  editorial:  makeStackStyle ('editorial', 'Editorial',      'Large serif type, left-aligned, generous whitespace.'),
  typewriter: makeStackStyle ('typewriter','Typewriter',     'Characters appear one by one with a block cursor.'),
  poster:     makePosterStyle(),
  pillrail:   makeStackStyle ('pillrail',  'Pill Rail',      'Whole line as dark pills; active word swells and turns cream.'),
};

// ══════════════════════════════════════════════════════════
// 9. BACKGROUNDS
// ══════════════════════════════════════════════════════════

function canvasBg(drawFn) {
  let cv, cx;
  return {
    mount(host) {
      host.innerHTML = '';
      cv = el('canvas', '', null, host);
      cx = cv.getContext('2d');
    },
    render(t, pal, w, h) {
      if (!cv) return;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      cx.clearRect(0, 0, w, h);
      cx.globalAlpha  = T.bg.canvasAlpha;
      cx.fillStyle    = pal.glow;
      drawFn(cx, t, w, h, pal);
    },
  };
}

const BACKGROUNDS = {
  black: {
    name: 'Plain black',
    mount(host) { host.innerHTML = ''; },
    render() {},
  },
  edge: {
    name: 'Edge glow',
    mount(host) {
      host.innerHTML = '';
      this._e = el('div', 'bg-edge', null, host);
    },
    render(t, pal, w, h) {
      if (this._e) {
        this._e.style.opacity = 0.88 + 0.12 * Math.sin(t / 900);
      }
    },
  },
  album: {
    name: 'Album-art blur',
    _artUrl: null,
    mount(host) {
      host.innerHTML = '';
      this._e = el('div', 'bg-art', null, host);
      if (this._artUrl) {
        this.setArt(this._artUrl);
      }
    },
    setArt(url) {
      this._artUrl = url;
      if (this._e) {
        if (url) {
          this._e.style.backgroundImage = `url('${url}')`;
          this._e.className = 'bg-art-img';
        } else {
          this._e.style.backgroundImage = '';
          this._e.className = 'bg-art';
        }
      }
    },
    render(t, pal, w, h) {
      if (this._e) {
        // Silky continuous rotation at native display refresh rate
        const deg = (performance.now() / 160) % 360;
        this._e.style.transform = `scale(1.4) rotate(${deg.toFixed(2)}deg) translateZ(0)`;
      }
    },
  },
  aurora: {
    name: 'Soft aurora',
    mount(host) {
      host.innerHTML = '';
      this._b = [0, 1, 2].map((i) => el('div', `blob blob-${i}`, null, host));
    },
    render(t, pal, w, h) {
      if (!this._b) return;
      const tt = performance.now() / 1000;
      const cx = w * 0.5;
      const cy = h * 0.5;

      const offsets = [
        { x: cx + Math.sin(tt * 0.28) * w * 0.22, y: cy + Math.cos(tt * 0.22) * h * 0.18, sc: 1.05 + 0.18 * Math.sin(tt * 0.25) },
        { x: cx + Math.cos(tt * 0.24 + 2) * w * 0.24, y: cy + Math.sin(tt * 0.31 + 1) * h * 0.20, sc: 1.1 + 0.2 * Math.cos(tt * 0.22) },
        { x: cx + Math.sin(tt * 0.2 + 4) * w * 0.20, y: cy + Math.cos(tt * 0.26 + 3) * h * 0.19, sc: 0.98 + 0.16 * Math.sin(tt * 0.3) },
      ];

      const grads = [
        `radial-gradient(circle, color-mix(in srgb, ${pal.glow} 55%, transparent) 0%, transparent 70%)`,
        `radial-gradient(circle, color-mix(in srgb, ${pal.hero} 45%, transparent) 0%, transparent 68%)`,
        `radial-gradient(circle, color-mix(in srgb, ${pal.glow} 35%, ${pal.cream} 20%) 0%, transparent 65%)`,
      ];

      this._b.forEach((b, i) => {
        const pos = offsets[i];
        b.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${pos.sc})`;
        b.style.background = grads[i];
      });
    },
  },
  particles: canvasBg((cx, t, w, h) => {
    for (let i = 0; i < T.bg.particles; i++) {
      const x = (hf(i,1) + Math.sin(t/4000+i)*.03)*w;
      const y = (1 - ((hf(i,2) + t*(.00002+hf(i,3)*.00004)) % 1)) * h;
      cx.beginPath();
      cx.arc(x, y, 1 + hf(i,4)*2.5, 0, 7);
      cx.fill();
    }
  }),
  stars: canvasBg((cx, t, w, h) => {
    for (let i = 0; i < T.bg.stars; i++) {
      const k = (hf(i,1) + t*.00004) % 1;
      const a = hf(i,2) * 6.283;
      const r = k * Math.hypot(w, h) * .55;
      cx.globalAlpha = T.bg.canvasAlpha * (.2 + .8 * k);
      cx.fillRect(w/2+Math.cos(a)*r, h/2+Math.sin(a)*r, .5+k*1.6, .5+k*1.6);
    }
  }),
  grain: {
    name: 'Film grain',
    mount(host) {
      host.innerHTML = '';
      this._e = el('div', 'grain', null, host);
    },
    render(t, pal, w, h) {
      if (this._e) {
        const s = Math.floor(t / 90);
        this._e.style.transform = `translate3d(${hf(s,1)*80-40}px,${hf(s,2)*80-40}px,0)`;
      }
    },
  },
};
BACKGROUNDS.particles.name = 'Particles';
BACKGROUNDS.stars.name     = 'Starfield';

// ══════════════════════════════════════════════════════════
// 10. API CLIENT
// ══════════════════════════════════════════════════════════

class ApiClient {
  constructor() {
    this._lyricsCtrl = null;
  }

  async getState() {
    try {
      const r = await fetch('/api/state', { signal: AbortSignal.timeout(2000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch {
      return { status: 'error', msg: 'Cannot reach server' };
    }
  }

  async getLyrics(artist, title, duration) {
    if (this._lyricsCtrl) this._lyricsCtrl.abort();
    this._lyricsCtrl = new AbortController();
    try {
      const params = new URLSearchParams({ artist, title });
      if (duration) params.set('duration', String(Math.round(duration)));
      const r = await fetch(`/api/lyrics?${params}`, {
        signal: this._lyricsCtrl.signal,
      });
      if (!r.ok) return { status: 'error' };
      return await r.json();
    } catch (e) {
      if (e.name === 'AbortError') return { status: 'aborted' };
      return { status: 'offline' };
    }
  }
}

// ══════════════════════════════════════════════════════════
// 11. APPLICATION CONTROLLER
// ══════════════════════════════════════════════════════════

class LyricsXApp {
  constructor() {
    this.settings   = loadSettings();
    this.clock      = new Clock();
    this.api        = new ApiClient();
    this.LY         = null;
    this.currentStyle = null;
    this.currentBg    = null;
    this.artVersion   = -1;
    this.artUrl       = null;
    this.lyricsState  = 'idle';
    this.view         = 'lyrics';
    this.isDemo       = false;
    this._frameId     = null;
    this._pollTimer   = null;
    this._hideTimer   = null;
    this._pollMs      = 100;
    this._nothingCount = 0;

    this._initDOM();
    this._initEvents();
    this._applyPalette();
    this._applyFont();
    this._applyEdgeGlow();
    this._mountBg();
    this._mountStyle();
    this._populateSettings();
    this._startPoll();
    this._startRAF();
  }

  _initDOM() {
    this.$bg         = document.getElementById('bg');
    this.$scrim      = document.getElementById('scrim');
    this.$stage      = document.getElementById('stage');
    this.$controls   = document.getElementById('controls');
    this.$status     = document.getElementById('status-overlay');
    this.$statusMsg  = document.getElementById('status-msg');
    this.$statusIcon = document.getElementById('status-icon');
    this.$statusManualBtn = document.getElementById('status-manual-btn');
    this.$lyricsWarn = document.getElementById('lyrics-warn');

    // Artwork images
    this.$npArtLink   = document.getElementById('np-art-link');
    this.$npArt       = document.getElementById('np-art');
    this.$npArtImg    = document.getElementById('np-art-img');
    this.$npTitle     = document.getElementById('np-title');
    this.$npArtist    = document.getElementById('np-artist');
    this.$progFill    = document.getElementById('progress-fill');
    this.$timeCur     = document.getElementById('time-current');
    this.$timeTot     = document.getElementById('time-total');

    // Player screen
    this.$playerArt    = document.getElementById('player-art');
    this.$playerArtImg = document.getElementById('player-art-img');
    this.$playerTitle  = document.getElementById('player-title');
    this.$playerArtist = document.getElementById('player-artist');
    this.$playerProg   = document.getElementById('player-prog-fill');
    this.$playerThumb  = document.getElementById('player-prog-thumb');
    this.$playerTimeCur = document.getElementById('player-time-cur');
    this.$playerTimeTot = document.getElementById('player-time-tot');
    this.$playerDownloadBtn = document.getElementById('player-download-art');
    this.$iconPlay   = document.getElementById('icon-play');
    this.$iconPause  = document.getElementById('icon-pause');

    // Settings screen
    this.$styleTiles = document.getElementById('style-tiles');
    this.$bgTiles    = document.getElementById('bg-tiles');
    this.$palRow     = document.getElementById('palette-row');
    this.$fontTiles  = document.getElementById('font-tiles');
    this.$intensitySlider = document.getElementById('intensity-slider');
    this.$intensityVal    = document.getElementById('intensity-val');
    this.$toggleIcons     = document.getElementById('toggle-icons');
    this.$toggleEdgeGlow  = document.getElementById('toggle-edge-glow');
    this.$toggleFisheye   = document.getElementById('toggle-fisheye');
    this.$timingVal       = document.getElementById('timing-val');
    this.$manualArtist    = document.getElementById('manual-artist');
    this.$manualTitle     = document.getElementById('manual-title');
    // Edge glow overlay
    this.$edgeGlowOverlay = document.getElementById('edge-glow-overlay');
  }

  _initEvents() {
    document.getElementById('btn-player').addEventListener('click', () => this._setView('player'));
    document.getElementById('btn-settings').addEventListener('click', () => this._setView('settings'));
    document.getElementById('btn-fullscreen').addEventListener('click', () => this._toggleFullscreen());
    document.getElementById('player-btn-lyrics').addEventListener('click', () => this._setView('lyrics'));
    document.getElementById('player-btn-settings').addEventListener('click', () => this._setView('settings'));
    document.getElementById('player-btn-fullscreen').addEventListener('click', () => this._toggleFullscreen());
    document.getElementById('player-lyrics-btn').addEventListener('click', () => this._setView('lyrics'));
    document.getElementById('settings-back').addEventListener('click', () => this._setView('lyrics'));

    const lyricsScreen = document.getElementById('screen-lyrics');
    lyricsScreen.addEventListener('mousemove', () => this._showControls());
    lyricsScreen.addEventListener('click', () => this._showControls());

    this.$intensitySlider.addEventListener('input', (e) => {
      this.settings.intensity = +e.target.value;
      this.$intensityVal.textContent = this.settings.intensity.toFixed(2);
      saveSettings(this.settings);
    });
    this.$toggleIcons.addEventListener('click', () => {
      const on = this.$toggleIcons.getAttribute('aria-checked') !== 'true';
      this.settings.icons = on;
      this.$toggleIcons.setAttribute('aria-checked', on ? 'true' : 'false');
      saveSettings(this.settings);
      if (this.LY) this._mountStyle();
    });
    this.$toggleEdgeGlow.addEventListener('click', () => {
      const on = this.$toggleEdgeGlow.getAttribute('aria-checked') !== 'true';
      this.settings.edgeGlow = on;
      this.$toggleEdgeGlow.setAttribute('aria-checked', on ? 'true' : 'false');
      saveSettings(this.settings);
      this._applyEdgeGlow();
    });
    this.$toggleFisheye.addEventListener('click', () => {
      if (this.settings.style !== 'kinetic') return;
      const on = this.$toggleFisheye.getAttribute('aria-checked') !== 'true';
      this.settings.fisheye = on;
      this.$toggleFisheye.setAttribute('aria-checked', on ? 'true' : 'false');
      saveSettings(this.settings);
    });
    document.getElementById('timing-minus').addEventListener('click', () => this._nudgeTiming(-250));
    document.getElementById('timing-plus').addEventListener('click', () => this._nudgeTiming(+250));
    document.getElementById('timing-reset').addEventListener('click', () => {
      this.settings.timingMs = 0;
      this.clock.nudgeMs = 0;
      this.$timingVal.textContent = '0.0 s';
      saveSettings(this.settings);
    });
    document.getElementById('manual-load').addEventListener('click', () => this._manualLoad());
    document.getElementById('demo-btn').addEventListener('click', () => this._playDemo());
    this.$statusManualBtn.addEventListener('click', () => this._setView('settings'));

    document.getElementById('ctl-play').addEventListener('click', () => {
      if (this.isDemo) {
        this.clock.isPlaying = !this.clock.isPlaying;
        this._updatePlayPauseIcon(this.clock.isPlaying);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key) {
        case 'f': case 'F': this._toggleFullscreen(); break;
        case 'p': case 'P': this._setView('player'); break;
        case 's': case 'S': this._setView('settings'); break;
        case 'l': case 'L': this._setView('lyrics'); break;
        case 'Escape':
          if (this.view !== 'lyrics') this._setView('lyrics');
          else if (document.fullscreenElement) document.exitFullscreen();
          break;
        case ' ':
          if (this.isDemo) {
            e.preventDefault();
            this.clock.isPlaying = !this.clock.isPlaying;
            this._updatePlayPauseIcon(this.clock.isPlaying);
          }
          break;
        case 'ArrowRight':
          if (this.isDemo) {
            e.preventDefault();
            this.clock.sync(this.clock.t + 5000, this.clock.isPlaying, this.clock.duration);
          }
          break;
        case 'ArrowLeft':
          if (this.isDemo) {
            e.preventDefault();
            this.clock.sync(Math.max(0, this.clock.t - 5000), this.clock.isPlaying, this.clock.duration);
          }
          break;
      }
    });

    new ResizeObserver(() => {
      if (this.currentStyle && this.$stage.clientWidth) {
        this.currentStyle.layout(this.$stage.clientWidth, this.$stage.clientHeight);
      }
    }).observe(this.$stage);

    document.fonts?.ready.then(() => {
      if (this.currentStyle && this.$stage.clientWidth) {
        this.currentStyle.layout(this.$stage.clientWidth, this.$stage.clientHeight);
      }
    });
  }

  _setView(view) {
    this.view = view;
    document.getElementById('screen-lyrics').classList.toggle('active', view === 'lyrics');
    document.getElementById('screen-player').classList.toggle('active', view === 'player');
    document.getElementById('screen-settings').classList.toggle('active', view === 'settings');

    ['screen-lyrics', 'screen-player', 'screen-settings'].forEach(id => {
      const s = document.getElementById(id);
      const isActive = s.classList.contains('active');
      s.hidden = !isActive;
      if (isActive) s.classList.add('screen-enter');
    });
    setTimeout(() => {
      document.querySelectorAll('.screen-enter').forEach(s => s.classList.remove('screen-enter'));
    }, 300);

    if (view === 'lyrics') {
      this._showControls();
      if (this.currentStyle && this.$stage.clientWidth) {
        this.currentStyle.layout(this.$stage.clientWidth, this.$stage.clientHeight);
      }
    }
  }

  _showControls() {
    this.$controls.classList.remove('hidden');
    clearTimeout(this._hideTimer);
    if (document.fullscreenElement) {
      this._hideTimer = setTimeout(() => {
        this.$controls.classList.add('hidden');
      }, 3000);
    }
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  _applyPalette() {
    const pal = T.palettes[this.settings.palette] || T.palettes.reference;
    const root = document.documentElement.style;
    root.setProperty('--hero',  pal.hero);
    root.setProperty('--soft',  pal.soft);
    root.setProperty('--cream', pal.cream);
    root.setProperty('--pill',  pal.pill);
    root.setProperty('--glow',  pal.glow);
    this.$scrim.style.setProperty('--scrim', T.bg.scrim[this.settings.bg] ?? 0);
  }

  _applyFont() {
    const key = this.settings.font === 'auto'
      ? (this.currentStyle?.font || 'jakarta')
      : this.settings.font;
    this.$stage.style.setProperty('--font', T.fonts[key]);
  }

  _applyEdgeGlow() {
    if (!this.$edgeGlowOverlay) return;
    const on = this.settings.edgeGlow !== false;
    this.$edgeGlowOverlay.classList.toggle('hidden-overlay', !on);
  }

  _mountStyle() {
    this.currentStyle = STYLES[this.settings.style] || STYLES.kinetic;
    if (this.settings.style !== 'kinetic') {
      this.$stage.style.perspective = '';
      this.$stage.style.perspectiveOrigin = '';
    }
    if (this.LY) {
      this.currentStyle.mount(this.$stage, this.LY, this.settings);
      this._applyFont();
      if (this.$stage.clientWidth) {
        this.currentStyle.layout(this.$stage.clientWidth, this.$stage.clientHeight);
      }
    } else {
      this.$stage.innerHTML = '';
    }
    this._syncFisheyeToggleState();
  }

  _mountBg() {
    this.currentBg = BACKGROUNDS[this.settings.bg] || BACKGROUNDS.black;
    this.currentBg.mount(this.$bg);
    this.$scrim.style.setProperty('--scrim', T.bg.scrim[this.settings.bg] ?? 0);
    if (this.settings.bg === 'album' && this.artUrl && this.currentBg.setArt) {
      this.currentBg.setArt(this.artUrl);
    }
  }

  _populateSettings() {
    this.$styleTiles.innerHTML = '';
    Object.values(STYLES).forEach(s => {
      const btn = el('button', 'tile' + (this.settings.style === s.id ? ' active' : ''),
        `<b>${s.name}</b><small>${s.blurb}</small>`,
        this.$styleTiles);
      btn.addEventListener('click', () => {
        this.settings.style = s.id;
        saveSettings(this.settings);
        this._populateSettings();
        this._mountStyle();
      });
    });

    this.$bgTiles.innerHTML = '';
    Object.entries(BACKGROUNDS).forEach(([key, bg]) => {
      const btn = el('button', 'tile' + (this.settings.bg === key ? ' active' : ''),
        `<b>${bg.name}</b>`,
        this.$bgTiles);
      btn.addEventListener('click', () => {
        this.settings.bg = key;
        saveSettings(this.settings);
        this._populateSettings();
        this._mountBg();
        this._applyPalette();
      });
    });

    this.$palRow.innerHTML = '';
    Object.entries(T.palettes).forEach(([key, pal]) => {
      const btn = el('button', 'palette-swatch' + (this.settings.palette === key ? ' active' : ''),
        '', this.$palRow);
      btn.title = pal.name;
      btn.style.background = `linear-gradient(135deg, ${pal.hero} 50%, ${pal.glow} 50%)`;
      btn.addEventListener('click', () => {
        this.settings.palette = key;
        saveSettings(this.settings);
        this._populateSettings();
        this._applyPalette();
      });
    });

    this.$fontTiles.innerHTML = '';
    const fonts = {
      auto:    { label: 'Auto', desc: 'Per style' },
      jakarta: { label: 'Plus Jakarta Sans', desc: 'Sans-serif' },
      inter:   { label: 'Inter',             desc: 'Sans-serif' },
      serif:   { label: 'Fraunces',          desc: 'Serif' },
      mono:    { label: 'JetBrains Mono',    desc: 'Monospace' },
    };
    Object.entries(fonts).forEach(([key, f]) => {
      const btn = el('button', 'tile' + (this.settings.font === key ? ' active' : ''),
        `<b>${f.label}</b><small>${f.desc}</small>`,
        this.$fontTiles);
      btn.addEventListener('click', () => {
        this.settings.font = key;
        saveSettings(this.settings);
        this._populateSettings();
        this._applyFont();
        if (this.currentStyle && this.$stage.clientWidth) {
          this.currentStyle.layout(this.$stage.clientWidth, this.$stage.clientHeight);
        }
      });
    });

    this.$intensitySlider.value    = this.settings.intensity;
    this.$intensityVal.textContent = this.settings.intensity.toFixed(2);
    this.$toggleIcons.setAttribute('aria-checked', this.settings.icons ? 'true' : 'false');
    if (this.$toggleEdgeGlow)  this.$toggleEdgeGlow.setAttribute('aria-checked',  (this.settings.edgeGlow  !== false) ? 'true' : 'false');
    if (this.$toggleFisheye)   this.$toggleFisheye.setAttribute('aria-checked',   this.settings.fisheye   ? 'true' : 'false');
    this.$timingVal.textContent    = (this.settings.timingMs / 1000).toFixed(1) + ' s';
    this.clock.nudgeMs             = this.settings.timingMs || 0;
    this._applyEdgeGlow();
    this._syncFisheyeToggleState();
  }

  _syncFisheyeToggleState() {
    const isKinetic = this.settings.style === 'kinetic';
    const row = document.getElementById('toggle-row-fisheye');
    const desc = document.getElementById('toggle-fisheye-desc');
    if (this.$toggleFisheye) {
      this.$toggleFisheye.disabled = !isKinetic;
      this.$toggleFisheye.setAttribute('aria-checked', (isKinetic && this.settings.fisheye) ? 'true' : 'false');
    }
    if (row) row.classList.toggle('disabled', !isKinetic);
    if (desc) desc.textContent = isKinetic
      ? 'Spherical lens bulge on Kinetic Words'
      : 'Only available for Kinetic Words';
  }

  _nudgeTiming(deltaMs) {
    this.settings.timingMs = (this.settings.timingMs || 0) + deltaMs;
    this.clock.nudgeMs     = this.settings.timingMs;
    this.$timingVal.textContent = (this.settings.timingMs / 1000).toFixed(1) + ' s';
    saveSettings(this.settings);
  }

  _setStatus(show, icon, msg, showManual = false) {
    this.$status.hidden = !show;
    if (show) {
      this.$statusIcon.textContent = icon;
      this.$statusMsg.textContent  = msg;
      this.$statusManualBtn.hidden = !showManual;
    }
  }

  _updateArt(hasArt, version) {
    if (hasArt) {
      if (this.artVersion !== version) {
        this.artVersion = version;
        this.artUrl = `/api/art?v=${version}`;

        if (this.$playerArtImg) {
          this.$playerArtImg.src = this.artUrl;
          this.$playerArtImg.hidden = false;
        }
        if (this.$playerArt) {
          this.$playerArt.style.backgroundImage = `url('${this.artUrl}')`;
        }

        if (this.$npArtImg) {
          this.$npArtImg.src = this.artUrl;
          this.$npArtImg.hidden = false;
        }
        if (this.$npArt) {
          this.$npArt.style.backgroundImage = `url('${this.artUrl}')`;
        }

        if (this.$npArtLink) this.$npArtLink.href = `/api/art?v=${version}&download=1`;
        if (this.$playerDownloadBtn) {
          this.$playerDownloadBtn.href = `/api/art?v=${version}&download=1`;
          this.$playerDownloadBtn.hidden = false;
        }

        BACKGROUNDS.album.setArt(this.artUrl);
      }
    } else {
      if (this.artUrl) {
        this.artVersion = -1;
        this.artUrl = null;
        if (this.$playerArtImg) {
          this.$playerArtImg.hidden = true;
          this.$playerArtImg.src = '';
        }
        if (this.$playerArt) {
          this.$playerArt.style.backgroundImage = '';
        }
        if (this.$npArtImg) {
          this.$npArtImg.hidden = true;
          this.$npArtImg.src = '';
        }
        if (this.$npArt) {
          this.$npArt.style.backgroundImage = '';
        }
        if (this.$playerDownloadBtn) this.$playerDownloadBtn.hidden = true;
        BACKGROUNDS.album.setArt(null);
      }
    }
  }

  _startPoll() {
    this._poll();
  }

  async _poll() {
    if (!this.isDemo) {
      const state = await this.api.getState();
      this._handleState(state);
    }
    this._pollTimer = setTimeout(() => this._poll(), this._pollMs);
  }

  _handleState(state) {
    const { status, title, artist, album, position, duration, hasArt, artVersion, source } = state;

    if (status === 'nothing' || status === 'stopped') {
      this._nothingCount = (this._nothingCount || 0) + 1;
      if (this._nothingCount >= 4) {
        this._setStatus(true, '♪', 'Nothing is playing', true);
        this.clock.sync(0, false, 0);
      }
      return;
    }
    this._nothingCount = 0;

    const isAd = title === 'Advertisement' || (source && source.toLowerCase().includes('ad'));
    if (isAd) {
      this._setStatus(true, '•', 'An advertisement is playing');
      this.clock.sync(position ?? 0, false, duration ?? 0);
      return;
    }

    const isPlaying = status === 'playing';
    this.clock.sync(position ?? 0, isPlaying, duration ?? 0);

    this.$npTitle.textContent      = title  || '—';
    this.$npArtist.textContent     = artist || '';
    this.$playerTitle.textContent  = title  || '—';
    this.$playerArtist.textContent = artist || '';

    this._updatePlayPauseIcon(isPlaying);
    this._updateArt(hasArt, artVersion);

    const trackKey = `${title}|${artist}`;
    if (trackKey !== this._trackKey && title) {
      this._trackKey = trackKey;
      this._loadLyrics(artist, title, duration);
    }
  }

  async _loadLyrics(artist, title, duration) {
    this.isDemo = false;
    this.lyricsState = 'loading';

    const result = await this.api.getLyrics(artist, title, duration);
    if (result.status === 'aborted') return;

    if (result.status === 'offline') {
      this.lyricsState = 'offline';
      this._setStatus(true, '⚠', 'No internet connection. Lyrics unavailable.', true);
      return;
    }

    if (result.status === 'timeout') {
      this.lyricsState = 'offline';
      this._setStatus(true, '⚠', 'Lyrics server timed out. Check your connection.', true);
      return;
    }

    if (result.status === 'not_found' || (!result.synced && !result.plain)) {
      this.lyricsState = 'not_found';
      this._setStatus(true, '—', 'No lyrics found for this track.', true);
      return;
    }

    this.fuzzyMatch = result.fuzzy ?? false;
    this.$lyricsWarn.hidden = !this.fuzzyMatch;

    if (result.synced) {
      const lrcLines = parseLRC(result.synced);
      if (!lrcLines.length) {
        this._setStatus(true, '—', 'No lyrics found for this track.', true);
        return;
      }
      const allInst = lrcLines.every(l => /^[♪♫\s]+$/.test(l.text));
      if (allInst) {
        this.lyricsState = 'instrumental';
        this._setStatus(true, '♫', 'Instrumental track');
        return;
      }
      this.LY = buildLyrics(lrcLines, duration);
      this.lyricsState = 'ok';
      this._setStatus(false, '', '');
      this._mountStyle();
    } else {
      this.lyricsState = 'plain';
      const lines = result.plain.split('\n').filter(l => l.trim());
      const plainLRC = lines.map((l, i) => ({ time: i * 4000, text: l }));
      this.LY = buildLyrics(plainLRC, lines.length * 4000 + 4000);
      this._setStatus(false, '', '');
      this._mountStyle();
    }
  }

  async _manualLoad() {
    const artist = this.$manualArtist.value.trim();
    const title  = this.$manualTitle.value.trim();
    if (!artist || !title) return;
    this.isDemo   = false;
    this._trackKey = `${title}|${artist}`;
    this.clock.sync(0, false, 300000);
    this.$npTitle.textContent      = title;
    this.$npArtist.textContent     = artist;
    this.$playerTitle.textContent  = title;
    this.$playerArtist.textContent = artist;
    await this._loadLyrics(artist, title, null);
    this._setView('lyrics');
  }

  _playDemo() {
    this.isDemo    = true;
    this._trackKey = 'demo';
    const lrcLines = parseLRC(DEMO_LRC);
    this.LY = buildLyrics(lrcLines, DEMO_TRACK.duration);
    this.lyricsState = 'ok';
    this.clock.sync(0, true, DEMO_TRACK.duration);
    this.$npTitle.textContent      = DEMO_TRACK.title;
    this.$npArtist.textContent     = DEMO_TRACK.artist;
    this.$playerTitle.textContent  = DEMO_TRACK.title;
    this.$playerArtist.textContent = DEMO_TRACK.artist;
    this._updatePlayPauseIcon(true);
    this._updateArt(false, 0);
    this._setStatus(false, '', '');
    this.$lyricsWarn.hidden = true;
    this._mountStyle();
    this._setView('lyrics');
  }

  _updatePlayPauseIcon(playing) {
    this.$iconPlay.hidden  = playing;
    this.$iconPause.hidden = !playing;
  }

  _startRAF() {
    const loop = (now) => {
      this._frameId = requestAnimationFrame(loop);
      this._tick(now);
    };
    this._frameId = requestAnimationFrame(loop);
  }

  _tick(now) {
    // Smooth frame-accurate progression
    const t    = this.clock.tick(now);
    const dur  = this.clock.duration;
    const prog = dur ? clamp(t / dur) : 0;

    this.$progFill.style.width = (prog * 100) + '%';
    this.$timeCur.textContent  = fmtTime(t);
    this.$timeTot.textContent  = fmtTime(dur);

    if (this.view === 'player') {
      const pct = prog * 100;
      this.$playerProg.style.width     = pct + '%';
      this.$playerThumb.style.left     = pct + '%';
      this.$playerTimeCur.textContent  = fmtTime(t);
      this.$playerTimeTot.textContent  = fmtTime(dur);
    }

    if (this.isDemo && this.LY && t > this.LY.end) {
      this.clock.sync(0, true, this.clock.duration);
    }

    if (this.LY && this.currentStyle && this.view === 'lyrics' && this.$stage.clientWidth) {
      try {
        this.currentStyle.render(this.LY, t, this.settings);
      } catch {}
    }

    if (this.currentBg && this.view === 'lyrics') {
      const pal = T.palettes[this.settings.palette] || T.palettes.reference;
      try {
        this.currentBg.render(t, pal, this.$bg.clientWidth, this.$bg.clientHeight);
      } catch {}
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window._app = new LyricsXApp();
  window._app._showControls();
});
