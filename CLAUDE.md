# Swara's birthday site

A scroll-driven, cinematic birthday message: Next.js 16 (App Router) on Vercel, GSAP,
Lenis, CSS-3D camera, WebGPU visuals through vgpu, and Web Audio sound.

**Read `docs/TECHNIQUES.md` before changing motion, 3D, shaders, audio or loading.** It
records every technique used here and the pitfalls behind them.

## Map
- **Content**
  - `content/story.ts`: all copy and per-line directives (layout, tone, scene, cue, cast).
  - `content/music.ts`: song experiences (CD → tracks per cue), with `#t=` start offsets.
  - `content/caption.ts`: generated glyph outlines for the hand-drawn finale caption.
- **lib**
  - `camera.ts`: shots and scroll timeline.
  - `mograph.ts`: arrivals, wipes, punch, `drawOn`.
  - `sfx.ts`: synthesized SFX and the fireworks ambience.
  - `soundtrack.ts`: music crossfades.
  - `preload.ts`: downloads everything and serves blob: URLs.
  - `frame.ts`: responsive `--k`.
- **components**
  - `Experience.tsx`: Loader → Gate (envelope) → World.
  - `World.tsx`: the 3D story.
  - `Finale.tsx`: fireworks, the couple, and the caption and heart.
- **shaders**
  - `backdrop.wgsl`: gradient worlds.
  - `finale.wgsl`: night sky, villages, lanterns, fireworks.

## Rules
- **Tone.** Warm, sincere, no asks or pressure, past tense for the relationship. Get
  the user's approval before rewriting personal copy.
- **Git.** Work on branch `claude/birthday-website-storyboard-5v5ttz`. Never put model
  names in commits or code.
- **Copyrighted media.** Don't add songs yourself; the user uploads them.
- **Verify before committing.** Run a production build, then do Playwright checks
  (screenshots, plus the audio and network instrumentation described in the handbook).
