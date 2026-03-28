import * as vscode from "vscode";

const HUE_STEP = 6;
const TICK_MS = 80;

function hsl(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const hd = h / 360, sd = s / 100, ld = l / 100;
  let r: number, g: number, b: number;
  if (sd === 0) {
    r = g = b = ld;
  } else {
    const q = ld < 0.5 ? ld * (1 + sd) : ld + sd - ld * sd;
    const p = 2 * ld - q;
    const h2r = (t: number) => {
      t = ((t % 1) + 1) % 1;
      if (t < 1 / 6) { return p + (q - p) * 6 * t; }
      if (t < 1 / 2) { return q; }
      if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
      return p;
    };
    r = h2r(hd + 1 / 3); g = h2r(hd); b = h2r(hd - 1 / 3);
  }
  return `#${[r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`;
}

export class DiscoMode {
  private static _instance: DiscoMode | undefined;
  private interval: ReturnType<typeof setInterval> | undefined;
  private hue = 0;
  private originalColors: unknown;
  private panel: vscode.WebviewPanel | undefined;
  public isActive = false;

  static getInstance(): DiscoMode {
    if (!DiscoMode._instance) { DiscoMode._instance = new DiscoMode(); }
    return DiscoMode._instance;
  }

  async toggle(statusBar: vscode.StatusBarItem): Promise<void> {
    this.isActive ? await this.stop(statusBar) : await this.start(statusBar);
  }

  private async start(statusBar: vscode.StatusBarItem): Promise<void> {
    this.isActive = true;
    const config = vscode.workspace.getConfiguration();
    // Store as-is; empty object means "was empty before disco"
    this.originalColors = config.get("workbench.colorCustomizations") ?? {};

    this.panel = vscode.window.createWebviewPanel(
      "ai-slop-disco.panel", "🪩 Disco Mode", vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    this.panel.webview.html = this.getDiscoHtml();
    this.panel.onDidDispose(() => { if (this.isActive) { this.stopSync(statusBar); } });

    statusBar.text = "🪩 DISCO";
    statusBar.color = "#ff00ff";
    statusBar.tooltip = "Click to stop";

    let tick = 0;
    this.interval = setInterval(() => {
      this.hue = (this.hue + HUE_STEP) % 360;
      const h = this.hue;
      tick++;

      // Every ~8 ticks (~640ms ≈ 128BPM beat), send beat pulse to webview
      if (tick % 8 === 0) {
        this.panel?.webview.postMessage({ type: "beat", hue: h });
      }

      const colors: Record<string, string> = {
        // Editor
        "editor.background":                hsl(h,        85, 8),
        "editor.foreground":                hsl(h + 180,  90, 88),
        "editor.lineHighlightBackground":   hsl(h,        90, 25) + "44",
        "editorLineNumber.foreground":      hsl(h + 120,  80, 55),
        "editorLineNumber.activeForeground":hsl(h + 120, 100, 80),
        "editorCursor.foreground":          hsl(h + 90,  100, 75),
        "editor.selectionBackground":       hsl(h + 60,  100, 45) + "55",
        "editor.inactiveSelectionBackground": hsl(h + 60, 80, 35) + "33",
        "editorIndentGuide.background1":    hsl(h + 180,  60, 25),

        // Sidebar
        "sideBar.background":               hsl(h + 30,   85,  7),
        "sideBar.foreground":               hsl(h + 210,  80, 82),
        "sideBarTitle.foreground":          hsl(h + 210, 100, 92),
        "sideBar.border":                   hsl(h + 30,   80, 20),
        "sideBarSectionHeader.background":  hsl(h + 30,   75, 12),

        // Activity bar
        "activityBar.background":           hsl(h + 60,   85, 10),
        "activityBar.foreground":           hsl(h + 240, 100, 88),
        "activityBar.activeBorder":         hsl(h + 300, 100, 70),
        "activityBar.border":               hsl(h + 60,   70, 18),
        "activityBarBadge.background":      hsl(h + 300, 100, 55),
        "activityBarBadge.foreground":      "#fff",

        // Status bar
        "statusBar.background":             hsl(h + 120, 100, 28),
        "statusBar.foreground":             "#ffffff",
        "statusBar.border":                 hsl(h + 120, 100, 45),
        "statusBarItem.hoverBackground":    hsl(h + 120,  90, 42),
        "statusBarItem.remoteBackground":   hsl(h + 300, 100, 40),

        // Title bar
        "titleBar.activeBackground":        hsl(h + 150,  85,  8),
        "titleBar.activeForeground":        hsl(h + 330, 100, 88),
        "titleBar.border":                  hsl(h + 150,  80, 20),

        // Tabs
        "editorGroupHeader.tabsBackground": hsl(h + 180,  80,  7),
        "editorGroupHeader.tabsBorder":     hsl(h + 180,  70, 18),
        "tab.activeBackground":             hsl(h + 240,  90, 20),
        "tab.activeForeground":             "#ffffff",
        "tab.activeBorder":                 "transparent",
        "tab.activeBorderTop":              hsl(h + 300, 100, 65),
        "tab.inactiveBackground":           hsl(h + 240,  65, 10),
        "tab.inactiveForeground":           hsl(h + 60,   70, 62),
        "tab.border":                       hsl(h + 240,  60, 15),
        "tab.hoverBackground":              hsl(h + 240,  80, 16),

        // Panel / Terminal
        "panel.background":                 hsl(h + 270,  80,  7),
        "panel.border":                     hsl(h + 270,  75, 18),
        "panelTitle.activeForeground":      hsl(h + 90,  100, 78),
        "panelTitle.activeBorder":          hsl(h + 90,  100, 65),
        "terminal.background":              hsl(h + 270,  80,  7),
        "terminal.foreground":              hsl(h + 90,   80, 85),
        "terminal.ansiGreen":               hsl(h + 120, 100, 65),
        "terminal.ansiCyan":                hsl(h + 180, 100, 65),
        "terminal.ansiMagenta":             hsl(h + 300, 100, 70),

        // Lists
        "list.activeSelectionBackground":   hsl(h + 60,   90, 22),
        "list.activeSelectionForeground":   "#ffffff",
        "list.hoverBackground":             hsl(h + 60,   70, 14),
        "list.focusBackground":             hsl(h + 60,   85, 18),
        "list.highlightForeground":         hsl(h + 300, 100, 75),

        // Inputs / Buttons
        "input.background":                 hsl(h + 210,  70, 12),
        "input.foreground":                 hsl(h + 30,   80, 90),
        "input.border":                     hsl(h + 300,  80, 45),
        "inputOption.activeBorder":         hsl(h + 300, 100, 60),
        "button.background":                hsl(h + 300,  90, 38),
        "button.foreground":                "#ffffff",
        "button.hoverBackground":           hsl(h + 300,  90, 48),
        "badge.background":                 hsl(h + 300, 100, 50),
        "badge.foreground":                 "#ffffff",

        // Scrollbar
        "scrollbarSlider.background":       hsl(h + 90,   85, 42) + "55",
        "scrollbarSlider.hoverBackground":  hsl(h + 90,   90, 55) + "88",
        "scrollbarSlider.activeBackground": hsl(h + 90,  100, 65) + "aa",

        // Misc
        "focusBorder":                      hsl(h + 300, 100, 62),
        "selection.background":             hsl(h + 60,  100, 45) + "44",
        "widget.shadow":                    hsl(h,       100, 10) + "88",
        "dropdown.background":              hsl(h + 210,  80, 10),
        "dropdown.border":                  hsl(h + 300,  80, 42),
      };

      config.update("workbench.colorCustomizations", colors, vscode.ConfigurationTarget.Global);
    }, TICK_MS);
  }

  private restoreColors(): void {
    const config = vscode.workspace.getConfiguration();
    const restoreTo = (this.originalColors && Object.keys(this.originalColors as object).length > 0)
      ? this.originalColors
      : undefined;
    // fire-and-forget is fine here — it's a settings write, not critical path
    config.update("workbench.colorCustomizations", restoreTo, vscode.ConfigurationTarget.Global);
  }

  // Called from onDidDispose (cannot await — fires sync)
  private stopSync(statusBar: vscode.StatusBarItem): void {
    this.isActive = false;
    if (this.interval) { clearInterval(this.interval); this.interval = undefined; }
    this.panel = undefined; // already disposing, don't call dispose() again
    this.restoreColors();
    statusBar.text = "🪩";
    statusBar.color = undefined;
    statusBar.tooltip = "Disco: Party Mode";
  }

  // Called from toggle (can await)
  private async stop(statusBar: vscode.StatusBarItem): Promise<void> {
    this.isActive = false;
    if (this.interval) { clearInterval(this.interval); this.interval = undefined; }
    if (this.panel) { this.panel.dispose(); this.panel = undefined; }
    this.restoreColors();
    statusBar.text = "🪩";
    statusBar.color = undefined;
    statusBar.tooltip = "Disco: Party Mode";
  }

  private getDiscoHtml(): string {
    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 100vw; height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: monospace;
    position: relative;
    background: #000;
  }

  /* ── Animated gradient background ── */
  #bg {
    position: fixed; inset: 0;
    background: linear-gradient(135deg, #0d001a, #001a0d, #1a000d, #00001a);
    background-size: 400% 400%;
    animation: bg-shift 4s ease infinite;
    z-index: 0;
  }
  @keyframes bg-shift {
    0%   { background-position: 0% 50%; filter: hue-rotate(0deg); }
    50%  { background-position: 100% 50%; filter: hue-rotate(180deg); }
    100% { background-position: 0% 50%; filter: hue-rotate(360deg); }
  }

  /* ── Radial glow layers ── */
  #glow1, #glow2 {
    position: fixed; border-radius: 50%;
    pointer-events: none; z-index: 1;
    animation: glow-pulse 1.5s ease-in-out infinite alternate;
  }
  #glow1 {
    width: 60vmax; height: 60vmax;
    top: -20%; left: -20%;
    background: radial-gradient(circle, rgba(255,0,200,0.18) 0%, transparent 70%);
    animation-duration: 2.1s;
  }
  #glow2 {
    width: 50vmax; height: 50vmax;
    bottom: -20%; right: -20%;
    background: radial-gradient(circle, rgba(0,200,255,0.18) 0%, transparent 70%);
    animation-duration: 1.7s;
    animation-direction: alternate-reverse;
  }
  @keyframes glow-pulse {
    from { opacity: 0.5; transform: scale(0.9); }
    to   { opacity: 1;   transform: scale(1.1); }
  }

  /* ── Light beams ── */
  #beams {
    position: fixed; inset: 0;
    pointer-events: none; z-index: 2;
    animation: beams-rotate 8s linear infinite;
  }
  @keyframes beams-rotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .beam {
    position: absolute;
    top: 50%; left: 50%;
    width: 3px; height: 80vmax;
    transform-origin: 0 0;
    border-radius: 3px;
    opacity: 0;
    animation: beam-pulse 1.8s ease-in-out infinite alternate;
  }
  @keyframes beam-pulse {
    0%   { opacity: 0.04; }
    100% { opacity: 0.45; }
  }

  /* ── Beat strobe flash ── */
  #strobe {
    position: fixed; inset: 0;
    background: #fff;
    opacity: 0;
    pointer-events: none;
    z-index: 100;
    transition: opacity 0.02s;
  }

  /* ── Disco ball ── */
  .scene {
    position: relative; z-index: 10;
    display: flex; flex-direction: column;
    align-items: center;
  }
  .string {
    width: 2px; height: 50px;
    background: linear-gradient(to bottom, #666, #aaa);
    margin: 0 auto;
  }
  .ball {
    width: 180px; height: 180px;
    border-radius: 50%;
    position: relative;
    animation: ball-spin 4s linear infinite;
    filter: drop-shadow(0 0 30px rgba(255,255,255,0.4));
  }
  /* Mirror tiles via repeating conic gradient */
  .ball-inner {
    width: 100%; height: 100%;
    border-radius: 50%;
    background: conic-gradient(
      hsl(0,100%,70%)   0deg,   hsl(30,100%,70%)  30deg,
      hsl(60,100%,70%)  60deg,  hsl(90,100%,70%)  90deg,
      hsl(120,100%,70%) 120deg, hsl(150,100%,70%) 150deg,
      hsl(180,100%,70%) 180deg, hsl(210,100%,70%) 210deg,
      hsl(240,100%,70%) 240deg, hsl(270,100%,70%) 270deg,
      hsl(300,100%,70%) 300deg, hsl(330,100%,70%) 330deg,
      hsl(360,100%,70%) 360deg
    );
    animation: ball-hue 2s linear infinite;
  }
  .ball-grid {
    position: absolute; inset: 0;
    border-radius: 50%;
    background-image:
      repeating-linear-gradient(0deg,   rgba(0,0,0,0.35) 0, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 14px),
      repeating-linear-gradient(90deg,  rgba(0,0,0,0.35) 0, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 14px);
  }
  .ball-shine {
    position: absolute; inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.3) 18%, transparent 55%);
  }
  @keyframes ball-spin {
    from { transform: rotate3d(0,1,0, 0deg); }
    to   { transform: rotate3d(0,1,0, 360deg); }
  }
  @keyframes ball-hue {
    from { filter: hue-rotate(0deg); }
    to   { filter: hue-rotate(360deg); }
  }

  /* ── Reflections on floor ── */
  .ball-reflection {
    width: 180px; height: 40px;
    border-radius: 50%;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%);
    margin-top: 8px;
    animation: ball-hue 2s linear infinite;
    filter: blur(4px);
  }

  /* ── Title ── */
  .title {
    font-size: 3.5rem;
    font-weight: 900;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    margin-top: 36px;
    position: relative; z-index: 10;
    background: linear-gradient(90deg, #ff0080, #ff8c00, #ffe100, #00ff80, #00cfff, #cc00ff, #ff0080);
    background-size: 300% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: title-shift 1.5s linear infinite;
    filter: drop-shadow(0 0 12px rgba(255,0,200,0.7));
  }
  @keyframes title-shift {
    from { background-position: 0% 50%; }
    to   { background-position: 300% 50%; }
  }

  .subtitle {
    margin-top: 8px; color: #444;
    font-size: 0.8rem; letter-spacing: 0.2em;
    position: relative; z-index: 10;
  }

  /* ── Track selector ── */
  #tracks {
    display: flex; flex-wrap: wrap; gap: 8px;
    justify-content: center;
    margin-top: 24px;
    position: relative; z-index: 10;
    max-width: 640px;
    padding: 0 16px;
  }
  .track-btn {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.12);
    color: #666;
    padding: 6px 14px;
    border-radius: 20px;
    cursor: pointer;
    font-family: monospace;
    font-size: 0.72rem;
    line-height: 1.4;
    text-align: center;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .track-btn:hover { color: #ccc; border-color: rgba(255,255,255,0.3); }
  .track-btn.active {
    color: #fff;
    border-color: transparent;
    background: linear-gradient(90deg,#ff0080,#cc00ff,#00cfff,#ff0080);
    background-size: 300% 100%;
    animation: title-shift 2s linear infinite;
    box-shadow: 0 0 14px rgba(255,0,200,0.5);
  }
  .track-name { font-weight: bold; letter-spacing: 0.08em; }
  .track-sub  { display: block; color: inherit; opacity: 0.6; font-size: 0.65rem; margin-top: 1px; }

  /* ── Visualizer bars ── */
  #viz {
    display: flex; align-items: flex-end;
    gap: 4px; height: 60px;
    margin-top: 28px;
    position: relative; z-index: 10;
  }
  .bar {
    width: 8px; border-radius: 4px 4px 0 0;
    transition: height 0.08s ease;
    min-height: 4px;
  }

  /* ── Grid floor ── */
  #floor {
    position: fixed; bottom: 0; left: 0; right: 0;
    height: 160px; z-index: 3;
    background:
      repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 40px),
      repeating-linear-gradient(0deg,  rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 40px);
    perspective: 300px;
    transform: rotateX(45deg);
    transform-origin: bottom center;
    animation: floor-hue 3s linear infinite;
    pointer-events: none;
  }
  @keyframes floor-hue {
    from { filter: hue-rotate(0deg); }
    to   { filter: hue-rotate(360deg); }
  }

  /* ── Floating emojis ── */
  .note {
    position: fixed;
    animation: float-up linear infinite;
    pointer-events: none; user-select: none;
    z-index: 5;
  }
  @keyframes float-up {
    from { transform: translateY(110vh) rotate(0deg); opacity: 1; }
    to   { transform: translateY(-15vh) rotate(720deg); opacity: 0; }
  }
</style>
</head>
<body>

<div id="bg"></div>
<div id="glow1"></div>
<div id="glow2"></div>
<div id="beams"></div>
<div id="strobe"></div>
<div id="floor"></div>

<div class="scene">
  <div class="string"></div>
  <div class="ball">
    <div class="ball-inner"></div>
    <div class="ball-grid"></div>
    <div class="ball-shine"></div>
  </div>
  <div class="ball-reflection"></div>
</div>

<div class="title">disco mode</div>
<div class="subtitle">// stay productive. seriously.</div>

<div id="tracks"></div>
<div id="viz"></div>

<script>
// ── Beams ──────────────────────────────────────────────
const beamsEl = document.getElementById('beams');
const NUM_BEAMS = 36;
const beamEls = [];
for (let i = 0; i < NUM_BEAMS; i++) {
  const b = document.createElement('div');
  b.className = 'beam';
  const angle = (i / NUM_BEAMS) * 360;
  b.style.transform = 'rotate(' + angle + 'deg)';
  b.style.animationDelay = (i / NUM_BEAMS * 1.8) + 's';
  b.style.animationDuration = (1.2 + (i % 5) * 0.2) + 's';
  beamsEl.appendChild(b);
  beamEls.push(b);
}
let beamHue = 0;
setInterval(() => {
  beamHue = (beamHue + 2) % 360;
  beamEls.forEach((b, i) => {
    const h = (beamHue + i * 10) % 360;
    b.style.background = 'linear-gradient(to bottom, hsla(' + h + ',100%,65%,0.9), transparent)';
  });
}, 40);

// ── Floating emojis ────────────────────────────────────
const pool = ['♪','♫','🎵','🎶','⭐','✨','💫','🌟','🎸','🎹','🎺','🎻','🥁','🪩','🕺','💃'];
function spawn() {
  const el = document.createElement('div');
  el.className = 'note';
  el.textContent = pool[Math.floor(Math.random() * pool.length)];
  el.style.left = (Math.random() * 100) + 'vw';
  const dur = 4 + Math.random() * 6;
  el.style.animationDuration = dur + 's';
  el.style.animationDelay = (Math.random() * 1) + 's';
  el.style.fontSize = (1 + Math.random() * 2) + 'rem';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), (dur + 2) * 1000);
}
for (let i = 0; i < 18; i++) spawn();
setInterval(spawn, 400);

// ── Visualizer bars ─────────────────────────────────────
const vizEl = document.getElementById('viz');
const NUM_BARS = 28;
const bars = [];
for (let i = 0; i < NUM_BARS; i++) {
  const b = document.createElement('div');
  b.className = 'bar';
  vizEl.appendChild(b);
  bars.push(b);
}
function animateBars(energy) {
  bars.forEach((b, i) => {
    const wave = Math.sin(Date.now() / 200 + i * 0.5) * 0.5 + 0.5;
    const h = (beamHue + i * 13) % 360;
    const heightPx = 6 + wave * energy * 50;
    b.style.height = heightPx + 'px';
    b.style.background = 'linear-gradient(to top, hsl(' + h + ',100%,50%), hsl(' + ((h+60)%360) + ',100%,75%))';
  });
}
setInterval(() => animateBars(0.4 + Math.random() * 0.6), 80);

// ── Beat strobe ────────────────────────────────────────
const strobe = document.getElementById('strobe');
function flashBeat() {
  strobe.style.opacity = '0.12';
  setTimeout(() => { strobe.style.opacity = '0'; }, 40);
  // Spike the visualizer
  animateBars(1.0);
}

// ── Message from extension (beat sync) ─────────────────
window.addEventListener('message', e => {
  if (e.data.type === 'beat') flashBeat();
});

// ── Web Audio engine ───────────────────────────────────
let audioCtx;

const TRACKS = [
  { name: '4 on the Floor',      sub: 'like your code quality',       bpm: 128, fn: 'disco'     },
  { name: 'Standup Speedrun',     sub: '15 min? lol sure',             bpm: 175, fn: 'speedrun'  },
  { name: 'Merge Conflict',       sub: 'this is fine 🔥',               bpm: 118, fn: 'conflict'  },
  { name: 'The Hotfix',           sub: 'pushed to prod on friday',     bpm: 148, fn: 'hotfix'    },
  { name: 'Sprint Retro Waltz',   sub: 'what went wrong (everything)', bpm: 88,  fn: 'retro'     },
  { name: 'LGTM',                 sub: "didn't actually read it",      bpm: 100, fn: 'lgtm'      },
  { name: 'Infinite Loop',        sub: 'you will never escape',        bpm: 130, fn: 'techno'    },
  { name: 'npm install',          sub: 'estimated time: ∞',            bpm: 82,  fn: 'lofi'      },
  { name: 'AI Will Replace Us',   sub: 'it already has',               bpm: 135, fn: 'synthwave' },
  { name: 'Debug Mode',           sub: 'console.log everything',       bpm: 174, fn: 'dnb'       },
  { name: 'Ship It',              sub: 'works on my machine',          bpm: 162, fn: 'shipit'    },
];

let currentGen = 0; // increment to kill old tick loops
let activeTrackIdx = 0;

// ── Build track buttons ─────────────────────────────────
const tracksEl = document.getElementById('tracks');
TRACKS.forEach((t, i) => {
  const btn = document.createElement('button');
  btn.className = 'track-btn' + (i === 0 ? ' active' : '');
  btn.dataset.idx = i;
  btn.innerHTML = \`<span class="track-name">\${t.name}</span><span class="track-sub">// \${t.sub}</span>\`;
  btn.addEventListener('click', () => switchTrack(i));
  tracksEl.appendChild(btn);
});

function switchTrack(idx) {
  document.querySelectorAll('.track-btn').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
  activeTrackIdx = idx;
  if (audioCtx) startTrack(idx);
}

function startAudio() {
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  catch(e) { return; }

  const master = audioCtx.createGain();
  master.gain.value = 0.7;
  master.connect(audioCtx.destination);

  // ── Shared reverb (convolver with generated IR) ────────
  const reverbNode = audioCtx.createConvolver();
  {
    const dur = 2.8, sr = audioCtx.sampleRate;
    const buf = audioCtx.createBuffer(2, Math.floor(sr * dur), sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.8);
    }
    reverbNode.buffer = buf;
  }
  const reverbSend = audioCtx.createGain(); reverbSend.gain.value = 0.22;
  reverbNode.connect(reverbSend); reverbSend.connect(master);
  const rv = (node) => node.connect(reverbNode);

  // ── Primitives ──────────────────────────────────────
  function kick(t, freq=150, decay=0.45, vol=1.0) {
    const osc = audioCtx.createOscillator();
    const g   = audioCtx.createGain();
    osc.connect(g); g.connect(master);
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(0.001, t + decay);
    g.gain.setValueAtTime(1.0, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    osc.start(t); osc.stop(t + decay + 0.05);
  }

  function snare(t, vol=0.7, withReverb=false) {
    const len = Math.floor(audioCtx.sampleRate * 0.14);
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource(); src.buffer = buf;
    const f = audioCtx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1800; f.Q.value=0.8;
    const g = audioCtx.createGain();
    src.connect(f); f.connect(g); g.connect(master);
    if (withReverb) rv(g);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    src.start(t); src.stop(t + 0.18);
    const o = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
    o.frequency.value = 220; o.connect(g2); g2.connect(master);
    g2.gain.setValueAtTime(vol * 0.45, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.start(t); o.stop(t + 0.12);
  }

  function clap(t, vol=0.65) {
    for (let i = 0; i < 3; i++) {
      const dt = t + i * 0.011;
      const len = Math.floor(audioCtx.sampleRate * 0.08);
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let j = 0; j < len; j++) d[j] = Math.random() * 2 - 1;
      const src = audioCtx.createBufferSource(); src.buffer = buf;
      const f = audioCtx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1200; f.Q.value=0.7;
      const g = audioCtx.createGain();
      src.connect(f); f.connect(g); g.connect(master); rv(g);
      g.gain.setValueAtTime(vol, dt); g.gain.exponentialRampToValueAtTime(0.001, dt + 0.08);
      src.start(dt); src.stop(dt + 0.1);
    }
  }

  // Sub sine + filtered sawtooth = thick punchy bass
  function fatBass(t, freq, dur, vol=0.6) {
    const sub = audioCtx.createOscillator(); sub.type='sine'; sub.frequency.value=freq;
    const subG = audioCtx.createGain();
    sub.connect(subG); subG.connect(master);
    subG.gain.setValueAtTime(0,t); subG.gain.linearRampToValueAtTime(vol,t+0.006);
    subG.gain.exponentialRampToValueAtTime(vol*0.5,t+dur*0.5); subG.gain.exponentialRampToValueAtTime(0.001,t+dur);
    sub.start(t); sub.stop(t+dur+0.05);
    const saw = audioCtx.createOscillator(); saw.type='sawtooth'; saw.frequency.value=freq;
    const filt = audioCtx.createBiquadFilter(); filt.type='lowpass'; filt.Q.value=5;
    filt.frequency.setValueAtTime(1600,t); filt.frequency.exponentialRampToValueAtTime(280,t+dur*0.4);
    const sawG = audioCtx.createGain();
    saw.connect(filt); filt.connect(sawG); sawG.connect(master);
    sawG.gain.setValueAtTime(0,t); sawG.gain.linearRampToValueAtTime(vol*0.4,t+0.008);
    sawG.gain.exponentialRampToValueAtTime(0.001,t+dur*0.5);
    saw.start(t); saw.stop(t+dur+0.05);
  }

  // Detuned sawtooth pair — lush synth lead / arp
  function synth(t, freq, dur, vol=0.13, withReverb=true) {
    const o1 = audioCtx.createOscillator(); o1.type='sawtooth'; o1.frequency.value=freq;
    const o2 = audioCtx.createOscillator(); o2.type='sawtooth'; o2.frequency.value=freq*1.009;
    const filt = audioCtx.createBiquadFilter(); filt.type='lowpass'; filt.Q.value=3;
    filt.frequency.setValueAtTime(5000,t); filt.frequency.exponentialRampToValueAtTime(700,t+dur*0.3);
    const env = audioCtx.createGain();
    env.gain.setValueAtTime(0,t); env.gain.linearRampToValueAtTime(vol,t+0.007);
    env.gain.exponentialRampToValueAtTime(vol*0.6,t+dur*0.2); env.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o1.connect(filt); o2.connect(filt); filt.connect(env); env.connect(master);
    if (withReverb) rv(env);
    o1.start(t); o2.start(t); o1.stop(t+dur+0.05); o2.stop(t+dur+0.05);
  }

  // Sine-based pad with slow attack + reverb
  function pad(t, freqs, dur, vol=0.06) {
    freqs.forEach(freq => {
      const o = audioCtx.createOscillator(); o.type='sine'; o.frequency.value=freq;
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0,t); env.gain.linearRampToValueAtTime(vol,t+0.08);
      env.gain.setValueAtTime(vol,t+dur-0.12); env.gain.linearRampToValueAtTime(0,t+dur);
      o.connect(env); env.connect(master); rv(env);
      o.start(t); o.stop(t+dur+0.05);
    });
  }

  // Sawtooth + LFO on filter = wobble bass
  function wobbleBass(t, freq, dur, lfoHz=6) {
    const osc = audioCtx.createOscillator(); osc.type='sawtooth'; osc.frequency.value=freq;
    const filt = audioCtx.createBiquadFilter(); filt.type='lowpass'; filt.Q.value=10; filt.frequency.value=200;
    const lfo = audioCtx.createOscillator(); lfo.type='sine'; lfo.frequency.value=lfoHz;
    const lfoG = audioCtx.createGain(); lfoG.gain.value=900;
    lfo.connect(lfoG); lfoG.connect(filt.frequency);
    const env = audioCtx.createGain();
    env.gain.setValueAtTime(0.65,t); env.gain.exponentialRampToValueAtTime(0.001,t+dur);
    osc.connect(filt); filt.connect(env); env.connect(master);
    lfo.start(t); osc.start(t); lfo.stop(t+dur+0.05); osc.stop(t+dur+0.05);
  }

  // Sparse vinyl pops + low hiss
  function crackle(t, dur) {
    const sr=audioCtx.sampleRate, len=Math.floor(sr*dur);
    const popBuf=audioCtx.createBuffer(1,len,sr); const pd=popBuf.getChannelData(0);
    for(let i=0;i<len;i++) pd[i]=Math.random()<0.0015?(Math.random()*2-1):0;
    const pop=audioCtx.createBufferSource(); pop.buffer=popBuf;
    const popG=audioCtx.createGain(); popG.gain.value=0.18;
    pop.connect(popG); popG.connect(master); pop.start(t); pop.stop(t+dur+0.01);
    const hissBuf=audioCtx.createBuffer(1,len,sr); const hd=hissBuf.getChannelData(0);
    for(let i=0;i<len;i++) hd[i]=Math.random()*2-1;
    const hiss=audioCtx.createBufferSource(); hiss.buffer=hissBuf;
    const hf=audioCtx.createBiquadFilter(); hf.type='bandpass'; hf.frequency.value=3500; hf.Q.value=0.4;
    const hg=audioCtx.createGain(); hg.gain.value=0.01;
    hiss.connect(hf); hf.connect(hg); hg.connect(master); hiss.start(t); hiss.stop(t+dur+0.01);
  }

  function hihat(t, open=false, vol=0.18) {
    const secs = open ? 0.22 : 0.04;
    const len  = Math.floor(audioCtx.sampleRate * secs);
    const buf  = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d    = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource(); src.buffer = buf;
    const f = audioCtx.createBiquadFilter(); f.type='highpass'; f.frequency.value=10000;
    const g = audioCtx.createGain();
    src.connect(f); f.connect(g); g.connect(master);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + secs);
    src.start(t); src.stop(t + secs + 0.01);
  }

  function bass(t, freq, dur, vol=0.55) {
    const osc = audioCtx.createOscillator(); osc.type='sawtooth'; osc.frequency.value=freq;
    const f = audioCtx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=520; f.Q.value=4;
    const g = audioCtx.createGain();
    osc.connect(f); f.connect(g); g.connect(master);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  function chord(t, root, ratios, dur, vol=0.07) {
    ratios.forEach(r => {
      const osc = audioCtx.createOscillator(); osc.type='square'; osc.frequency.value=root*r;
      const f = audioCtx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1400;
      const g = audioCtx.createGain();
      osc.connect(f); f.connect(g); g.connect(master);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  }

  // ── Track schedulers ──────────────────────────────────
  const MAJOR  = [1, 1.25, 1.5];
  const MINOR  = [1, 1.2, 1.5];
  const DIM    = [1, 1.189, 1.414];  // diminished (spooky)
  const MAJ7   = [1, 1.25, 1.5, 1.875]; // major 7th (jazzy)

  const bassRoots  = [110, 146.8, 110, 130.8]; // A D A C

  function bar_disco(t, bi, B) {
    const root = bassRoots[bi%4];
    for (let i=0;i<4;i++) kick(t+i*B);
    snare(t+B); snare(t+3*B);
    for (let i=0;i<4;i++) { hihat(t+i*B,false); hihat(t+i*B+B*.5,true); }
    bass(t,        root,    B*.45);
    bass(t+B,      root*2,  B*.2);
    bass(t+B*1.5,  root,    B*.45);
    bass(t+B*2,    root*1.5,B*.45);
    bass(t+B*3,    root*2,  B*.2);
    bass(t+B*3.5,  root,    B*.4);
    chord(t+B*2.5, root*2, MAJOR, B*.4);
    if(bi%2===1) chord(t+B*.5, root*1.5, MAJOR, B*.3);
  }

  function bar_speedrun(t, bi, B) {
    // Double-time everything — frantic
    for (let i=0;i<8;i++) kick(t+i*B*.5, 140, 0.2);
    for (let i=0;i<8;i++) snare(t+i*B*.5+B*.25, 0.4);
    for (let i=0;i<16;i++) hihat(t+i*B*.25, false, 0.12);
    const r = 82.4; // E2
    for (let i=0;i<8;i++) bass(t+i*B*.5, r*(i%2===0?1:2), B*.35, 0.6);
  }

  function bar_conflict(t, bi, B) {
    // Syncopated kick, tritone bass, diminished chords = unsettling
    kick(t);  kick(t+B*.75);  kick(t+B*2.5);  kick(t+B*3.25);
    snare(t+B*1.5); snare(t+B*3.5);
    for (let i=0;i<8;i++) hihat(t+i*B*.5, i%3===0, 0.15);
    const r = 110;
    bass(t,       r,         B*.4);
    bass(t+B*.5,  r*1.414,   B*.3); // tritone — sounds WRONG
    bass(t+B,     r*1.189,   B*.4);
    bass(t+B*2,   r,         B*.4);
    bass(t+B*2.5, r*1.414,   B*.3);
    bass(t+B*3,   r*.841,    B*.7); // drop lower
    chord(t+B,    r*2, DIM, B*.3, 0.09);
    chord(t+B*3,  r*2, DIM, B*.3, 0.09);
  }

  function bar_hotfix(t, bi, B) {
    // Hard driving, industrial, minor
    kick(t); kick(t+B*.25); kick(t+B*2); kick(t+B*2.25); // double kick
    snare(t+B); snare(t+B*3);
    for(let i=0;i<8;i++) hihat(t+i*B*.5,false,0.2);
    const r = 65.4; // C2 — dark & low
    for(let i=0;i<4;i++) bass(t+i*B, r, B*.8, 0.7);
    bass(t+B*1.5, r*.75, B*.4, 0.8); // drop to G1
    chord(t+B*.5,  r*4, MINOR, B*.25, 0.1);
    chord(t+B*2.5, r*4, MINOR, B*.25, 0.1);
    chord(t+B*3.5, r*4, MINOR, B*.15, 0.12);
  }

  function bar_retro(t, bi, B) {
    // 3/4 waltz — boom chick chick, melancholic minor
    // B here = one beat in a 3-beat bar
    kick(t);
    hihat(t+B,   false, 0.18); snare(t+B, 0.4);
    hihat(t+B*2, false, 0.18);
    const r = 110; // A2
    bass(t,      r,         B*.8);
    bass(t+B,    r*1.5,     B*.4);
    bass(t+B*2,  r*1.2,     B*.4);
    if(bi%2===1) chord(t+B, r*2, MINOR, B*1.8, 0.08);
  }

  function bar_lgtm(t, bi, B) {
    // Half-time chill house, major 7th chords
    kick(t); kick(t+B*2);
    snare(t+B*2);
    for(let i=0;i<8;i++) hihat(t+i*B*.5, i%4===2, 0.14);
    // Walking bass: D E F# G
    const walk = [73.4, 82.4, 92.5, 98];
    walk.forEach((f,i) => bass(t+i*B, f, B*.85, 0.45));
    chord(t,     walk[0]*2, MAJ7, B*1.8, 0.07);
    chord(t+B*2, walk[2]*2, MAJ7, B*1.8, 0.07);
  }

  // ── NEW TRACKS ─────────────────────────────────────────

  function bar_techno(t, bi, B) {
    for(let i=0;i<4;i++) kick(t+i*B,55,0.55,1.1);
    clap(t+B); clap(t+B*3);
    for(let i=0;i<16;i++) hihat(t+i*B*.25,false,i%4===0?0.2:0.09);
    for(let i=0;i<4;i++) fatBass(t+i*B,55,B*.92,0.55);
    const arp=[220,261.6,329.6,392,329.6,261.6];
    for(let i=0;i<16;i++) synth(t+i*B*.25,arp[i%arp.length]*(bi%4===3?1.5:1),B*.21,0.09,true);
  }

  function bar_lofi(t, bi, B) {
    const sw=B*(2/3);
    kick(t,80,0.5,0.9); kick(t+B*2+sw*.5,80,0.4,0.65);
    snare(t+B,0.65,true); snare(t+B*3,0.65,true);
    for(let i=0;i<4;i++) { hihat(t+i*B,false,0.16); hihat(t+i*B+sw,i%2===0,0.1); }
    crackle(t,B*4);
    const chords=[[261.6,329.6,392,493.9],[220,261.6,329.6,392],[174.6,220,261.6,329.6],[196,246.9,293.7,349.2]];
    const ci=bi%4;
    pad(t,chords[ci],B*1.9,0.055); pad(t+B*2,chords[(ci+1)%4],B*1.9,0.055);
    const bn=[[65.4,73.4],[73.4,82.4],[55,65.4],[61.7,73.4]][ci];
    bass(t,bn[0],B*.88,0.32); bass(t+B,bn[1],B*.45,0.22);
    bass(t+B*2,bn[0],B*.88,0.32); bass(t+B*3,bn[1]*1.122,B*.45,0.22);
  }

  function bar_synthwave(t, bi, B) {
    for(let i=0;i<4;i++) kick(t+i*B,180,0.35,1.0);
    snare(t+B,0.85,true); snare(t+B*3,0.85,true);
    for(let i=0;i<16;i++) hihat(t+i*B*.25,i%8===4,i%4===0?0.2:0.1);
    const chordArps=[
      [220,261.6,329.6,440],   // Am
      [174.6,220,261.6,349.2], // F
      [261.6,329.6,392,523.3], // C
      [196,246.9,293.7,392],   // G
    ];
    for(let beat=0;beat<4;beat++) {
      const notes=chordArps[beat];
      for(let n=0;n<4;n++) synth(t+beat*B+n*B*.25,notes[n],B*.22,0.15,true);
      fatBass(t+beat*B,notes[0]*.5,B*.92,0.62);
      pad(t+beat*B,notes.slice(0,3),B*.97,0.045);
    }
  }

  function bar_dnb(t, bi, B) {
    kick(t,70,0.4,1.0); kick(t+B*.75,70,0.35,0.7);
    kick(t+B*2,70,0.4,1.0); kick(t+B*3,70,0.35,0.8);
    snare(t+B*1.5,0.85); snare(t+B*3.5,0.85);
    for(let i=0;i<32;i++) hihat(t+i*B*.125,i%16===8,i%8===0?0.22:i%4===0?0.13:0.06);
    wobbleBass(t,55,B*1.5,8); wobbleBass(t+B*1.5,82.4,B*.5,14);
    wobbleBass(t+B*2,55,B*1.5,8); wobbleBass(t+B*3.5,41.2,B*.5,18);
  }

  function bar_shipit(t, bi, B) {
    kick(t); kick(t+B*.5); kick(t+B*2.25); kick(t+B*3.5);
    snare(t+B); snare(t+B*2.75); snare(t+B*3.75,0.45);
    for(let i=0;i<16;i++) hihat(t+i*B*.25,i%8===3||i%8===6,0.18);
    const r=65.4;
    for(let i=0;i<4;i++) bass(t+i*B,i===2?r*1.5:r,B*.82,0.82);
    chord(t+B,r*4,[1,1.5],B*.14,0.16); chord(t+B*3,r*4,[1,1.5],B*.14,0.16);
  }

  const schedulers = {
    disco:bar_disco, speedrun:bar_speedrun, conflict:bar_conflict, hotfix:bar_hotfix,
    retro:bar_retro, lgtm:bar_lgtm, techno:bar_techno, lofi:bar_lofi,
    synthwave:bar_synthwave, dnb:bar_dnb, shipit:bar_shipit
  };
  const beatsPerBar = {
    disco:4, speedrun:4, conflict:4, hotfix:4, retro:3, lgtm:4,
    techno:4, lofi:4, synthwave:4, dnb:4, shipit:4
  };

  function startTrack(idx) {
    currentGen++;
    const gen = currentGen;
    const track = TRACKS[idx];
    const BPM   = track.bpm;
    const B     = 60 / BPM;
    const bpb   = beatsPerBar[track.fn];
    let nextBar  = audioCtx.currentTime + 0.05;
    let barIndex = 0;
    const fn = schedulers[track.fn];

    function tick() {
      if (gen !== currentGen) return;
      while (nextBar < audioCtx.currentTime + 0.6) {
        fn(nextBar, barIndex++, B);
        nextBar += B * bpb;
      }
      setTimeout(tick, 60);
    }
    tick();
  }

  window.startTrack = startTrack;
  startTrack(activeTrackIdx);
}

// ── Click-to-start overlay ─────────────────────────────
const overlay = document.createElement('div');
overlay.style.cssText = \`
  position: fixed; inset: 0; z-index: 999;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(6px);
  cursor: pointer;
\`;
overlay.innerHTML = \`
  <div style="font-size:4rem; margin-bottom:16px; animation: pulse-icon 1s ease-in-out infinite alternate;">🎵</div>
  <div style="
    font-family: monospace; font-size: 1.1rem; letter-spacing: 0.2em;
    background: linear-gradient(90deg,#ff0080,#ff8c00,#ffe100,#00ff80,#00cfff,#cc00ff,#ff0080);
    background-size: 300% 100%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: title-shift 1.5s linear infinite;
  ">CLICK TO START MUSIC</div>
  <div style="margin-top:10px; color:#555; font-size:0.75rem; font-family:monospace; letter-spacing:0.15em;">// browser requires a gesture</div>
\`;
document.body.appendChild(overlay);

overlay.addEventListener('click', () => {
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.4s';
  setTimeout(() => overlay.remove(), 400);
  startAudio();
  // enable track switching after audio starts
  document.querySelectorAll('.track-btn').forEach((b,i) => {
    b.addEventListener('click', () => {
      if (window.startTrack) window.startTrack(i);
    });
  });
}, { once: true });
</script>
</body>
</html>`;
  }
}
