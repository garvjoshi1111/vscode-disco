# Disco Mode 🪩

> **Turns VS Code into a full disco.**
> Because staring at a dark theme for 8 hours wasn't enough of a cry for help.

---

## What is this

`Disco Mode` is a VS Code extension that, upon a single keystroke, transforms your entire editor into a pulsing, rainbow-cycling, music-playing disco floor.

Every panel. Every tab. Every sidebar. All of it — cycling through the full color spectrum in real time.

There is a spinning disco ball. There are light beams. There is generated music with 11 tracks.

Your `settings.json` will never be the same. (It will, actually. Colors restore on exit. We're not animals.)

---

## Usage

```
Cmd+Shift+D  (Mac)
Ctrl+Shift+D (Windows/Linux)
```

Or open the Command Palette and run **Disco: Party Mode 🪩**.

Or click the **🪩** in your status bar.

Run it again to stop. Colors restore. Your dignity does not.

---

## The Tracks

All music is generated in real time via the Web Audio API. No files. No internet. Just math and questionable life decisions.

| Track | Vibe |
|---|---|
| **4 on the Floor** // *like your code quality* | Classic 128 BPM disco. Octave bass jumps. You've heard this at every company party. |
| **Standup Speedrun** // *15 min? lol sure* | 175 BPM. Double-time everything. For when the meeting was supposed to be an email. |
| **Merge Conflict** // *this is fine 🔥* | Tritone bass intervals. Diminished chords. Actively unsettling. Accurate. |
| **The Hotfix** // *pushed to prod on friday* | 148 BPM double kick. Low, dark, driving. You did this to yourself. |
| **Sprint Retro Waltz** // *what went wrong (everything)* | 88 BPM. 3/4 time. Minor key. A waltz for your burnout. |
| **LGTM** // *didn't actually read it* | Smooth 100 BPM chill house. Walking bass. Major 7th chords. Zero accountability. |
| **Infinite Loop** // *you will never escape* | 130 BPM minimal techno. Hypnotic Am7 arpeggio. Sub bass you can feel in your chair. |
| **npm install** // *estimated time: ∞* | 82 BPM lo-fi hip hop. Swung triplet timing. Vinyl crackle. Jazzy maj7 pads. Very chill for a loading screen that never ends. |
| **AI Will Replace Us** // *it already has* | 135 BPM synthwave. Detuned sawtooth arpeggios. Gated reverb snare. Am-F-C-G, the four chords of existential dread. |
| **Debug Mode** // *console.log everything* | 174 BPM drum & bass. Wobble bass with LFO filter sweep. Rolling 32nd-note hi-hats. Half-time drums. |
| **Ship It** // *works on my machine* | 162 BPM breakbeat. Syncopated amen-style pattern. Distorted bass. Power chords. No tests were run. |

---

## Features

- **Full UI color cycling** — editor, sidebar, tabs, activity bar, status bar, title bar, terminal, panels, inputs, buttons, scrollbars, badges — all of it, all at once
- **Spinning disco ball** with mirror tile grid and specular highlight
- **36 animated light beams** rotating in sync, cycling through spectrum
- **Beat-synchronized strobe flash** on every kick drum
- **32 equalizer bars** that animate to the music
- **Floating emoji particles** (♪ ♫ 🎵 🪩 💃 and more)
- **3D perspective floor grid** at the bottom
- **11 generated music tracks** — click to switch mid-disco, no interruption
- **Click-to-start audio** (browser autoplay policy — one click, then it goes)
- **Full color restore on exit** — your original theme comes back exactly as it was

---

## FAQ

**Q: Will this affect my productivity?**
A: It will affect your perception of productivity, which is basically the same thing.

**Q: Does it work in Cursor / vscode.dev?**
A: Cursor yes. vscode.dev — the webview panel should work, color cycling depends on whether they expose `workbench.colorCustomizations`.

**Q: My coworker saw this during a screen share.**
A: That's not a question. Also: you're welcome.

**Q: The music sounds like it was made by a computer.**
A: It was made by a computer. That's the bit.

**Q: Can I use this in a demo/talk/video?**
A: Please do. Tag us. Clip it.

---

## Known Issues

- The audio requires one click to start (browser autoplay policy). Click anywhere on the disco panel.
- At very high BPMs, some lower-end machines may experience audio scheduling delays. This is fine. This is the vibe.
- The sprint retro waltz may cause genuine sadness. This is also fine.

---

## Contributing

Found a bug — open an issue.

Want to add a track — open a PR with a `bar_yourtrackname` function, a BPM, and a name sarcastic enough to belong here. No tests required. We ship it anyway.

---

## License

MIT. Use it, fork it, ship it.

---

*Built for developers who have given up on the bit but kept going anyway.*

---

**Curse me, thank me, or send a clip of your screen share disaster:**
Twitter/X: [@garvjoshi1111](https://twitter.com/garvjoshi1111)
