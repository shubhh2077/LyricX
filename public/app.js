/**
 * LyricsX — app.js
 * Full client-side application.
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
    reference: { name: 'Reference pink', hero: '#d6a0cd', soft: '#c9a9bd', cream: '#f2e7a6', pill: '#2b2428', glow: '#e0509f' },
    mint:      { name: 'Mint',           hero: '#a6e0cc', soft: '#9fc4b8', cream: '#eaf5c4', pill: '#1c2623', glow: '#2fd6a0' },
    amber:     { name: 'Amber',          hero: '#f0bf88', soft: '#d2ab86', cream: '#fff0c4', pill: '#2a2119', glow: '#ff8a3d' },
    ice:       { name: 'Ice',            hero: '#a8c7f2', soft: '#9db4d4', cream: '#e8f1ff', pill: '#1b2029', glow: '#4a8bff' },
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
};

function detectIcon(word) {
  const lc = word.toLowerCase().replace(/[^a-z]/g, '');
  for (const [icon, kws] of Object.entries(ICON_KEYWORDS)) {
    if (kws.includes(lc)) return icon;
  }
  return null;
}

// ══════════════════════════════════════════════════════════
// 4. DEMO SONG (built-in, no network required)
// ══════════════════════════════════════════════════════════

// LRC format demo lyrics (Tame Impala style)
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
  duration: 215000,
  thumbnail: null,
};

// ══════════════════════════════════════════════════════════
// 5. LRC PARSER + LYRICS ENGINE
// ══════════════════════════════════════════════════════════

function parseLRC(lrcText) {
  const lines = [];
  for (const raw of lrcText.split('\n')) {
    const m = raw.match(/^\[(\d{2}):(\d{2})[.:](\d{2,3})\](.*)/);
    if (!m) continue;
    const ms = (+m[1] * 60 + +m[2]) * 1000 + +m[3] * (m[3].length === 2 ? 10 : 1);
    const text = m[4].trim();
    if (text) lines.push({ time: ms, text });
  }
  return lines;
}

function buildLyrics(lrcLines, totalDuration) {
  const words = [];
  const lines = [];
  const totalDur = totalDuration || (lrcLines.length ? lrcLines[lrcLines.length - 1].time + 8000 : 60000);

  // Detect instrumental (lines containing only ♪ or similar)
  const isInstrumental = (txt) => /^[♪♫\s]+$/.test(txt);

  lrcLines.forEach((line, li) => {
    const nextTime = lrcLines[li + 1]?.time ?? (line.time + 8000);
    const lineDur  = Math.max(100, nextTime - line.time);
    const inst     = isInstrumental(line.text);
    const rtl      = isRTL(line.text);
    const cjk      = isCJK(line.text);

    // Tokenize: CJK = every 1-2 chars, instrumental = single token, else spaces
    const tokens = cjk
      ? Array.from(line.text.match(/.{1,2}/gu) || [line.text])
      : inst
        ? [line.text]
        : line.text.split(/\s+/).filter(Boolean);

    const totalChars = tokens.reduce((a, t) => a + t.length + 1, 0);
    const lineFirst  = words.length;
    let   curTime    = line.time;

    lines.push({
      text: line.text, first: lineFirst, n: tokens.length,
      s: line.time, rtl, cjk, inst,
    });

    let lastIcon = -99;
    tokens.forEach((tok, k) => {
      const dur = lineDur * (tok.length + 1) / totalChars;
      const rawIcon = detectIcon(tok);
      // No back-to-back icons
      const icon = rawIcon && (k - lastIcon > 1) ? rawIcon : null;
      if (icon) lastIcon = k;
      words.push({
        t: tok, s: curTime, e: curTime + dur * 0.94,
        line: li, k, rtl, inst, icon,
        side: (k % 2 === 0) ? 'l' : 'r',
      });
      curTime += dur;
    });
  });

  if (!words.length) return null;

  const N = words.length;

  function pos(t) {
    // Find fractional word index p
    let i = -1;
    for (let j = 0; j < N; j++) {
      if (words[j].s <= t) i = j;
      else break;
    }
    let p;
    if (i < 0) {
      p = (t - words[0].s) / Math.max(1, words[1]?.s - words[0].s || 1);
    } else if (i === N - 1) {
      p = i + clamp((t - words[i].s) / Math.max(1, words[i].e - words[i].s));
    } else {
      p = i + (t - words[i].s) / Math.max(1, words[i+1].s - words[i].s);
    }
    // Fractional line index q
    const fi = clamp(Math.floor(p), 0, N - 1);
    const L  = words[fi].line;
    const ln = lines[L];
    const q  = L + clamp((p - ln.first - ln.n + 0.5) / 0.5);
    return { p, q };
  }

  return { words, lines, pos, end: words[N-1].e + 800 };
}

// ══════════════════════════════════════════════════════════
// 6. INTERNAL CLOCK (smooth interpolation between server updates)
// ══════════════════════════════════════════════════════════

class Clock {
  constructor() {
    this.serverPos  = 0;
    this.serverAt   = performance.now();
    this.isPlaying  = false;
    this.duration   = 0;
    this.nudgeMs    = 0; // user timing offset
  }

  update(posMs, playing, durationMs) {
    this.serverPos  = posMs;
    this.serverAt   = performance.now();
    this.isPlaying  = playing;
    if (durationMs) this.duration = durationMs;
  }

  get position() {
    const elapsed = this.isPlaying ? (performance.now() - this.serverAt) : 0;
    return Math.max(0, this.serverPos + elapsed + this.nudgeMs);
  }

  get progress() {
    return this.duration ? clamp(this.position / this.duration) : 0;
  }
}

// ══════════════════════════════════════════════════════════
// 7. SETTINGS (localStorage persistence)
// ══════════════════════════════════════════════════════════

const SETTINGS_KEY = 'lyricsx-settings';

const DEFAULT_SETTINGS = {
  style:     'kinetic',
  bg:        'edge',
  palette:   'reference',
  font:      'auto',
  intensity: 1.0,
  reduced:   false,
  icons:     true,
  timingMs:  0,
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
// 8. TYPOGRAPHY STYLES
// ══════════════════════════════════════════════════════════

function setup(stage, c) {
  stage.style.fontWeight  = T.weight[c.weight];
  stage.style.lineHeight  = T.lineHeight[c.lh];
}

// ── 8a. Kinetic / Afterglow (word-by-word floating) ──────

function makeKineticStyle(key, name, blurb) {
  const c = T.styles[key];
  let st, els = [], W = 0, F = 0, fit = [];

  return {
    id: key, name, blurb, font: c.font,
    mount(stage, LY, settings) {
      st = stage;
      st.innerHTML = '';
      setup(st, c);
      const showIcons = settings.icons;
      els = LY.words.map(w => {
        const iconHtml = (showIcons && w.icon)
          ? `<span class="ic" style="order:${w.side === 'l' ? -1 : 1}">${ICONS[w.icon]}</span>`
          : '';
        const e = el('div', 'kw',
          iconHtml + `<span class="tw"><i class="pill"></i><b>${w.t}</b><u>${w.t}</u></span>`,
          st
        );
        e.style.left = c.align === 'left' ? '9%' : '50%';
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
      fit = els.map(e => Math.min(1, W * c.fitW / Math.max(1, e.offsetWidth)));
    },
    render(LY, t, settings) {
      const P  = settings.reduced ? Math.floor(LY.pos(t).p) : LY.pos(t).p;
      const I  = Math.min(settings.intensity, 1.3);
      const Lf = c.align === 'left';
      LY.words.forEach((w, j) => {
        const e  = els[j];
        const d  = j - P;
        const a  = Math.abs(d);
        const o  = curve(d < 0 && c.opPast ? c.opPast : c.op, a);
        if (o < 0.004) { e.style.opacity = 0; return; }
        const sc = (1 - (1 - curve(d < 0 && c.scalePast ? c.scalePast : c.scale, a)) * I) * (fit[j] || 1);
        const y  = Math.sign(d) * curve(c.y, a) * F * c.ySpace;
        const x  = Lf ? 0 : (j % 2 ? 1 : -1) * c.stagger * W * settings.intensity * (0.75 + 0.5 * hf(j, 3));
        const pa = c.pill ? clamp(1 - Math.abs(d - 1)) : 0;
        e.style.transform = `translate3d(${x}px,${y}px,0) translate(${Lf ? '0' : '-50%'},-50%) scale(${sc})`;
        e.style.opacity   = o;
        e._pill.style.opacity = pa;
        e._a.style.opacity    = 1 - pa;
        e._b.style.opacity    = pa;
      });
    },
  };
}

// ── 8b. Stack styles (classic, karaoke, minimal, editorial, typewriter, pillrail) ──

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
          // Typewriter: individual characters
          e._c = Array.from(ln.text).map(x => el('span', 'ch', x, e));
          e._c.push(el('span', 'ch', '▍', e)); // cursor
        } else if (c.words) {
          // Karaoke / pillrail: individual word spans
          e._w = [];
          for (let k = 0; k < ln.n; k++) {
            const w  = LY.words[ln.first + k];
            const sp = el('span', 'wd',
              `<i class="pl"></i><b>${w.t}</b><u>${w.t}</u>`, e);
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
      els.forEach((e, i) => {
        e.style.width = (w * (c.left ? 0.84 : c.width)) + 'px';
        const hh = e.offsetHeight || 1;
        bs[i] = Math.min(1, h * 0.6 / hh);
        const hs = hh * bs[i];
        cy[i] = c.stack && i ? cy[i-1] + (prev + hs) / 2 + T.space.lineGap * F : 0;
        prev = hs;
      });
    },
    render(LY, t, settings) {
      const r  = LY.pos(t);
      const P  = settings.reduced ? Math.floor(r.p) : r.p;
      const Q  = settings.reduced ? Math.floor(r.q + 1e-9) : r.q;
      const I  = Math.min(settings.intensity, 1.3);
      const i0 = clamp(Math.floor(Q), 0, cy.length - 1);
      const i1 = Math.min(i0 + 1, cy.length - 1);
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
          const Lc = LY.words[clamp(Math.floor(P), 0, LY.words.length - 1)].line;
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

// ── 8c. Poster (one giant word) ──────────────────────────

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
      const P = settings.reduced ? Math.floor(LY.pos(t).p) : LY.pos(t).p;
      const I = Math.min(settings.intensity, 1.3);
      LY.words.forEach((w, j) => {
        const d = j - P, a = Math.abs(d), o = curve(c.op, a), e = els[j];
        if (o < 0.004) { e.style.opacity = 0; return; }
        e.style.opacity   = o;
        e.style.transform = `translate3d(0,${d * F * c.drift * I}px,0) translate(-50%,-50%) scale(${(fit[j] || 1) * (1 - c.shrink * I * Math.min(a, 1))})`;
      });
    },
  };
}

const STYLES = {
  kinetic:    makeKineticStyle('kinetic',   'Kinetic Words', 'Three words stacked vertically; hero word 2.4× bigger, next word on a cream pill.'),
  afterglow:  makeKineticStyle('afterglow', 'Afterglow',     'Left-anchored trail: sung words linger and fade upward like smoke.'),
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
    render(t, pal, w, h, reduced) {
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      cx.clearRect(0, 0, w, h);
      cx.globalAlpha  = T.bg.canvasAlpha;
      cx.fillStyle    = pal.glow;
      drawFn(cx, reduced ? 0 : t, w, h, pal);
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
    render(t, pal, w, h, reduced) {
      this._e.style.opacity = reduced ? 1 : 0.88 + 0.12 * Math.sin(t / 900);
    },
  },
  album: {
    name: 'Album-art blur',
    mount(host) {
      host.innerHTML = '';
      this._e = el('div', 'bg-art', null, host);
    },
    setArt(url) {
      if (url) {
        this._e.style.backgroundImage = `url('${url}')`;
        this._e.className = 'bg-art-img';
      } else {
        this._e.style.backgroundImage = '';
        this._e.className = 'bg-art';
      }
    },
    render(t, pal, w, h, reduced) {
      this._e.style.transform = `scale(1.5) rotate(${reduced ? 0 : t / 150}deg)`;
    },
  },
  aurora: {
    name: 'Soft aurora',
    mount(host) {
      host.innerHTML = '';
      this._b = [0, 1, 2].map(() => el('div', 'blob', null, host));
    },
    render(t, pal, w, h, reduced) {
      const tt = reduced ? 0 : t / 1000;
      this._b.forEach((b, i) => {
        b.style.transform = `translate3d(${Math.sin(tt*.3+i*2)*w*.25}px,${Math.cos(tt*.25+i*3)*h*.2}px,0) scale(${1+.2*Math.sin(tt*.2+i)})`;
        b.style.background = `radial-gradient(circle, color-mix(in srgb, ${pal.glow} 50%, transparent), transparent 65%)`;
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
    render(t, pal, w, h, reduced) {
      const s = reduced ? 0 : Math.floor(t / 90);
      this._e.style.transform = `translate3d(${hf(s,1)*80-40}px,${hf(s,2)*80-40}px,0)`;
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
    this._pollTimer  = null;
    this._lyricsCtrl = null;
  }

  async getState() {
    try {
      const r = await fetch('/api/state', { signal: AbortSignal.timeout(4000) });
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
// 11. APPLICATION STATE + MAIN CONTROLLER
// ══════════════════════════════════════════════════════════

class LyricsXApp {
  constructor() {
    this.settings   = loadSettings();
    this.clock      = new Clock();
    this.api        = new ApiClient();
    this.LY         = null;      // current lyrics object
    this.currentStyle = null;    // current style renderer
    this.currentBg    = null;    // current bg renderer
    this.currentTrack = null;    // last known track {title, artist, duration}
    this.artUrl       = null;    // object URL for album art
    this.lyricsState  = 'idle';  // idle | loading | ok | not_found | plain | offline | ad
    this.plainLyrics  = null;    // plain lyrics text if no synced
    this.fuzzyMatch   = false;
    this.view         = 'lyrics';
    this.isDemo       = false;
    this._frameId     = null;
    this._lastRaf     = performance.now();
    this._hideTimer   = null;
    this._controlsVisible = true;
    this._pollMs      = 800;

    this._initDOM();
    this._initEvents();
    this._applyPalette();
    this._applyFont();
    this._mountBg();
    this._mountStyle();
    this._populateSettings();
    this._startPoll();
    this._startRAF();
  }

  // ── DOM helpers ──────────────────────────────────────────

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
    this.$npArt      = document.getElementById('np-art');
    this.$npTitle    = document.getElementById('np-title');
    this.$npArtist   = document.getElementById('np-artist');
    this.$progFill   = document.getElementById('progress-fill');
    this.$timeCur    = document.getElementById('time-current');
    this.$timeTot    = document.getElementById('time-total');
    // Player screen
    this.$playerArt    = document.getElementById('player-art');
    this.$playerTitle  = document.getElementById('player-title');
    this.$playerArtist = document.getElementById('player-artist');
    this.$playerProg   = document.getElementById('player-prog-fill');
    this.$playerThumb  = document.getElementById('player-prog-thumb');
    this.$playerTimeCur = document.getElementById('player-time-cur');
    this.$playerTimeTot = document.getElementById('player-time-tot');
    this.$iconPlay  = document.getElementById('icon-play');
    this.$iconPause = document.getElementById('icon-pause');
    // Settings screen
    this.$styleTiles = document.getElementById('style-tiles');
    this.$bgTiles    = document.getElementById('bg-tiles');
    this.$palRow     = document.getElementById('palette-row');
    this.$fontTiles  = document.getElementById('font-tiles');
    this.$intensitySlider = document.getElementById('intensity-slider');
    this.$intensityVal    = document.getElementById('intensity-val');
    this.$toggleReduced   = document.getElementById('toggle-reduced');
    this.$toggleIcons     = document.getElementById('toggle-icons');
    this.$timingVal       = document.getElementById('timing-val');
    this.$manualArtist    = document.getElementById('manual-artist');
    this.$manualTitle     = document.getElementById('manual-title');
  }

  _initEvents() {
    // Screen navigation
    document.getElementById('btn-player').addEventListener('click', () => this._setView('player'));
    document.getElementById('btn-settings').addEventListener('click', () => this._setView('settings'));
    document.getElementById('btn-fullscreen').addEventListener('click', () => this._toggleFullscreen());
    document.getElementById('player-btn-lyrics').addEventListener('click', () => this._setView('lyrics'));
    document.getElementById('player-btn-settings').addEventListener('click', () => this._setView('settings'));
    document.getElementById('player-btn-fullscreen').addEventListener('click', () => this._toggleFullscreen());
    document.getElementById('player-lyrics-btn').addEventListener('click', () => this._setView('lyrics'));
    document.getElementById('settings-back').addEventListener('click', () => this._setView('lyrics'));

    // Auto-hide controls on mouse inactivity
    const lyricsScreen = document.getElementById('screen-lyrics');
    lyricsScreen.addEventListener('mousemove', () => this._showControls());
    lyricsScreen.addEventListener('click', () => this._showControls());

    // Settings controls
    this.$intensitySlider.addEventListener('input', (e) => {
      this.settings.intensity = +e.target.value;
      this.$intensityVal.textContent = this.settings.intensity.toFixed(2);
      saveSettings(this.settings);
    });
    this.$toggleReduced.addEventListener('click', () => {
      const on = this.$toggleReduced.getAttribute('aria-checked') !== 'true';
      this.settings.reduced = on;
      this.$toggleReduced.setAttribute('aria-checked', on ? 'true' : 'false');
      saveSettings(this.settings);
    });
    this.$toggleIcons.addEventListener('click', () => {
      const on = this.$toggleIcons.getAttribute('aria-checked') !== 'true';
      this.settings.icons = on;
      this.$toggleIcons.setAttribute('aria-checked', on ? 'true' : 'false');
      saveSettings(this.settings);
      // Remount style to apply icon setting
      if (this.LY) this._mountStyle();
    });
    document.getElementById('timing-minus').addEventListener('click', () => this._nudgeTiming(-500));
    document.getElementById('timing-plus').addEventListener('click', () => this._nudgeTiming(+500));
    document.getElementById('timing-reset').addEventListener('click', () => {
      this.settings.timingMs = 0;
      this.clock.nudgeMs = 0;
      this.$timingVal.textContent = '0.0 s';
      saveSettings(this.settings);
    });
    document.getElementById('manual-load').addEventListener('click', () => this._manualLoad());
    document.getElementById('demo-btn').addEventListener('click', () => this._playDemo());
    this.$statusManualBtn.addEventListener('click', () => this._setView('settings'));

    // Player controls (best-effort: GSMTC doesn't expose controls without WinRT session control)
    document.getElementById('ctl-play').addEventListener('click', () => {
      // For demo mode, toggle locally
      if (this.isDemo) {
        this.clock.isPlaying = !this.clock.isPlaying;
        this._updatePlayPauseIcon(this.clock.isPlaying);
      }
    });

    // Keyboard shortcuts
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
            this.clock.update(this.clock.position + 5000, this.clock.isPlaying, this.clock.duration);
          }
          break;
        case 'ArrowLeft':
          if (this.isDemo) {
            e.preventDefault();
            this.clock.update(Math.max(0, this.clock.position - 5000), this.clock.isPlaying, this.clock.duration);
          }
          break;
      }
    });

    // Reduced motion OS preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', () => {
      if (mq.matches) {
        this.settings.reduced = true;
        this.$toggleReduced.setAttribute('aria-checked', 'true');
        saveSettings(this.settings);
      }
    });
    if (mq.matches && !this.settings.reduced) {
      this.settings.reduced = true;
    }

    // ResizeObserver for layout
    new ResizeObserver(() => {
      if (this.currentStyle && this.$stage.clientWidth) {
        this.currentStyle.layout(this.$stage.clientWidth, this.$stage.clientHeight);
      }
    }).observe(this.$stage);

    // Font loaded → relayout
    document.fonts?.ready.then(() => {
      if (this.currentStyle && this.$stage.clientWidth) {
        this.currentStyle.layout(this.$stage.clientWidth, this.$stage.clientHeight);
      }
    });
  }

  // ── View management ──────────────────────────────────────

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

    if (view === 'lyrics') this._showControls();
  }

  // ── Controls auto-hide ───────────────────────────────────

  _showControls() {
    this.$controls.classList.remove('hidden');
    this._controlsVisible = true;
    clearTimeout(this._hideTimer);
    if (document.fullscreenElement) {
      this._hideTimer = setTimeout(() => {
        this.$controls.classList.add('hidden');
        this._controlsVisible = false;
      }, 3000);
    }
  }

  // ── Fullscreen ───────────────────────────────────────────

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  // ── Palette ──────────────────────────────────────────────

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

  // ── Font ─────────────────────────────────────────────────

  _applyFont() {
    const key = this.settings.font === 'auto'
      ? (this.currentStyle?.font || 'jakarta')
      : this.settings.font;
    this.$stage.style.setProperty('--font', T.fonts[key]);
  }

  // ── Style mounting ───────────────────────────────────────

  _mountStyle() {
    this.currentStyle = STYLES[this.settings.style] || STYLES.kinetic;
    if (this.LY) {
      this.currentStyle.mount(this.$stage, this.LY, this.settings);
      this._applyFont();
      requestAnimationFrame(() => {
        if (this.$stage.clientWidth) {
          this.currentStyle.layout(this.$stage.clientWidth, this.$stage.clientHeight);
        }
      });
    } else {
      this.$stage.innerHTML = '';
    }
  }

  // ── Background mounting ──────────────────────────────────

  _mountBg() {
    this.currentBg = BACKGROUNDS[this.settings.bg] || BACKGROUNDS.black;
    this.currentBg.mount(this.$bg);
    this.$scrim.style.setProperty('--scrim', T.bg.scrim[this.settings.bg] ?? 0);
    // If album bg and we have art, set it
    if (this.settings.bg === 'album' && this.artUrl && this.currentBg.setArt) {
      this.currentBg.setArt(this.artUrl);
    }
  }

  // ── Settings UI population ───────────────────────────────

  _populateSettings() {
    // Style tiles
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

    // BG tiles
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

    // Palette swatches
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

    // Font tiles
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
          requestAnimationFrame(() => {
            this.currentStyle.layout(this.$stage.clientWidth, this.$stage.clientHeight);
          });
        }
      });
    });

    // Sliders / toggles
    this.$intensitySlider.value       = this.settings.intensity;
    this.$intensityVal.textContent    = this.settings.intensity.toFixed(2);
    this.$toggleReduced.setAttribute('aria-checked', this.settings.reduced ? 'true' : 'false');
    this.$toggleIcons.setAttribute('aria-checked', this.settings.icons ? 'true' : 'false');
    this.$timingVal.textContent = (this.settings.timingMs / 1000).toFixed(1) + ' s';
    this.clock.nudgeMs = this.settings.timingMs || 0;
  }

  // ── Timing nudge ─────────────────────────────────────────

  _nudgeTiming(deltaMs) {
    this.settings.timingMs = (this.settings.timingMs || 0) + deltaMs;
    this.clock.nudgeMs     = this.settings.timingMs;
    this.$timingVal.textContent = (this.settings.timingMs / 1000).toFixed(1) + ' s';
    saveSettings(this.settings);
  }

  // ── Status display ───────────────────────────────────────

  _setStatus(show, icon, msg, showManual = false) {
    this.$status.hidden = !show;
    if (show) {
      this.$statusIcon.textContent = icon;
      this.$statusMsg.textContent  = msg;
      this.$statusManualBtn.hidden = !showManual;
    }
  }

  // ── Art management ───────────────────────────────────────

  _setArt(thumbnail, thumbMime) {
    // Revoke old object URL
    if (this.artUrl) URL.revokeObjectURL(this.artUrl);
    this.artUrl = null;

    if (thumbnail) {
      try {
        const bytes = Uint8Array.from(atob(thumbnail), c => c.charCodeAt(0));
        const blob  = new Blob([bytes], { type: thumbMime || 'image/jpeg' });
        this.artUrl = URL.createObjectURL(blob);
      } catch {}
    }

    // Update now-playing art
    this.$npArt.style.backgroundImage = this.artUrl ? `url('${this.artUrl}')` : '';

    // Update player art
    if (this.artUrl) {
      this.$playerArt.style.background = '';
      this.$playerArt.style.backgroundImage = `url('${this.artUrl}')`;
      this.$playerArt.style.backgroundSize  = 'cover';
      this.$playerArt.style.backgroundPosition = 'center';
    } else {
      this.$playerArt.style.backgroundImage = '';
      // Reset to decorative gradient
      this.$playerArt.style.background = '';
    }

    // Update album blur background
    if (this.settings.bg === 'album' && this.currentBg?.setArt) {
      this.currentBg.setArt(this.artUrl);
    }
  }

  // ── Polling ──────────────────────────────────────────────

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
    const { status, title, artist, album, position, duration, thumbnail, thumbMime, source } = state;

    // Detect ads (Spotify SourceAppUserModelId for ads vs music)
    const isAd = title === 'Advertisement' || (source && source.toLowerCase().includes('ad'));

    if (status === 'nothing' || status === 'stopped') {
      this._setStatus(true, '♪', 'Nothing is playing', true);
      this.clock.update(0, false, 0);
      return;
    }
    if (status === 'error') {
      this._setStatus(true, '⚠', 'Could not connect to Windows media. Is Spotify running?', true);
      return;
    }
    if (isAd) {
      this._setStatus(true, '•', 'An advertisement is playing');
      this.clock.update(position ?? 0, false, duration ?? 0);
      return;
    }

    // Update clock
    const isPlaying = status === 'playing';
    this.clock.update(position ?? 0, isPlaying, duration ?? 0);

    // Update UI
    this.$npTitle.textContent    = title   || '—';
    this.$npArtist.textContent   = artist  || '';
    this.$playerTitle.textContent  = title   || '—';
    this.$playerArtist.textContent = artist  || '';

    // Update play/pause icon
    this._updatePlayPauseIcon(isPlaying);

    // Art changed?
    if (thumbnail && thumbnail !== this._lastThumb) {
      this._lastThumb = thumbnail;
      this._setArt(thumbnail, thumbMime);
    } else if (!thumbnail && this._lastThumb) {
      this._lastThumb = null;
      this._setArt(null, null);
    }

    // Track changed?
    const trackKey = `${title}|${artist}`;
    if (trackKey !== this._trackKey) {
      this._trackKey = trackKey;
      this._loadLyrics(artist, title, duration);
    }
  }

  // ── Lyrics loading ───────────────────────────────────────

  async _loadLyrics(artist, title, duration) {
    this.LY = null;
    this.lyricsState = 'loading';
    this.isDemo = false;
    this._setStatus(true, '♪', 'Loading lyrics…');
    this.$stage.innerHTML = '';
    this.$lyricsWarn.hidden = true;

    if (!artist && !title) {
      this._setStatus(true, '♪', 'Nothing is playing', true);
      return;
    }

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
      // Detect purely instrumental
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
      // Plain lyrics — show as static Classic Stack
      this.lyricsState = 'plain';
      const lines = result.plain.split('\n').filter(l => l.trim());
      const plainLRC = lines.map((l, i) => ({ time: i * 4000, text: l }));
      this.LY = buildLyrics(plainLRC, lines.length * 4000 + 4000);
      this.lyricsState = 'plain';
      this._setStatus(false, '', '');
      this._mountStyle();
    }
  }

  // ── Manual load ──────────────────────────────────────────

  async _manualLoad() {
    const artist = this.$manualArtist.value.trim();
    const title  = this.$manualTitle.value.trim();
    if (!artist || !title) return;
    this.isDemo   = false;
    this._trackKey = `${title}|${artist}`;
    this.clock.update(0, false, 300000);
    this.$npTitle.textContent    = title;
    this.$npArtist.textContent   = artist;
    this.$playerTitle.textContent  = title;
    this.$playerArtist.textContent = artist;
    await this._loadLyrics(artist, title, null);
    this._setView('lyrics');
  }

  // ── Demo mode ────────────────────────────────────────────

  _playDemo() {
    this.isDemo    = true;
    this._trackKey = 'demo';
    const lrcLines = parseLRC(DEMO_LRC);
    this.LY = buildLyrics(lrcLines, DEMO_TRACK.duration);
    this.lyricsState = 'ok';
    this.clock.update(0, true, DEMO_TRACK.duration);
    this.$npTitle.textContent    = DEMO_TRACK.title;
    this.$npArtist.textContent   = DEMO_TRACK.artist;
    this.$playerTitle.textContent  = DEMO_TRACK.title;
    this.$playerArtist.textContent = DEMO_TRACK.artist;
    this._updatePlayPauseIcon(true);
    this._setStatus(false, '', '');
    this.$lyricsWarn.hidden = true;
    this._mountStyle();
    this._setView('lyrics');
  }

  // ── Play/pause icon ──────────────────────────────────────

  _updatePlayPauseIcon(playing) {
    this.$iconPlay.hidden  = playing;
    this.$iconPause.hidden = !playing;
  }

  // ── RAF loop ─────────────────────────────────────────────

  _startRAF() {
    const loop = (now) => {
      this._frameId = requestAnimationFrame(loop);
      this._tick(now);
    };
    this._frameId = requestAnimationFrame(loop);
  }

  _tick(now) {
    const t   = this.clock.position;
    const dur = this.clock.duration;
    const prog = dur ? clamp(t / dur) : 0;

    // Update progress bars
    this.$progFill.style.width = (prog * 100) + '%';
    this.$timeCur.textContent  = fmtTime(t);
    this.$timeTot.textContent  = fmtTime(dur);

    if (this.view === 'player') {
      const pct = prog * 100;
      this.$playerProg.style.width   = pct + '%';
      this.$playerThumb.style.left   = pct + '%';
      this.$playerTimeCur.textContent = fmtTime(t);
      this.$playerTimeTot.textContent = fmtTime(dur);
    }

    // Loop demo
    if (this.isDemo && this.LY && t > this.LY.end) {
      this.clock.update(0, true, this.clock.duration);
    }

    // Render lyrics style
    if (this.LY && this.currentStyle && this.view === 'lyrics' && this.$stage.clientWidth) {
      try {
        this.currentStyle.render(this.LY, t, this.settings);
      } catch {}
    }

    // Render background
    if (this.currentBg && this.view === 'lyrics') {
      const pal = T.palettes[this.settings.palette] || T.palettes.reference;
      try {
        this.currentBg.render(t, pal, this.$bg.clientWidth, this.$bg.clientHeight, this.settings.reduced);
      } catch {}
    }
  }
}

// ══════════════════════════════════════════════════════════
// 12. BOOT
// ══════════════════════════════════════════════════════════

// Kick off the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window._app = new LyricsXApp();
  // Show controls immediately
  window._app._showControls();
});
