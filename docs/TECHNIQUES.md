# Techniques handbook

Everything learned building this site: the motion, design, audio and GPU techniques,
the browser pitfalls behind them, and how each one was verified. Written to be reused
on other cinematic, scroll-driven pages.

---

## 1. Scroll-driven 2.5D camera (CSS 3D, no WebGL)

**Idea.** One CSS 3D "world" holds every line of text and object at a position and
rotation in 3D. Scrolling moves a virtual camera between them; the world is
transformed by the *inverse* of the camera pose.

- Stage: `perspective: 1000px`; world: `transform-style: preserve-3d`.
- Item transform: `translate3d(x,y,z) rotateY rotateX rotateZ translate(-50%,-50%)`
  with **`transform-origin: 0 0`** on `.item`. Without that origin, rotated items
  drift off-centre.
- World transform = `scale(k)` · inverse(camera pose). Compute relative poses with
  `DOMMatrix` (see `relative()` in `lib/camera.ts`).
- Scroll position `s` is measured in screen heights. The timeline is a list of
  **travel** segments (fly between shots, eased) and **hold** segments (stay put while
  she reads), plus a small "settle" so the camera never stops dead.
- **Shot kinds give variety** so it is never "scroll down, down, down":
  - straight, floor, ceiling and rise shots;
  - yaw left or right: the line is turned sideways and the camera swings round to face it;
  - roll;
  - title: huge text;
  - zoom: seen from afar, then the camera flies *through* it;
  - marquee: one giant line the camera tracks along;
  - corner: two lines on the walls of a corner, and the camera turns between them;
  - scatter: anamorphic words, described below.
- **Anamorphic scatter.** Each word sits at its own depth `dz`, scaled by
  `s = (P - dz)/P` and offset by `cx·(s-1)`, so the words line up into a sentence only
  from the one camera position and fall apart as the camera moves.
- **Start inside an object.** The first camera pose frames a 3D turntable built from
  CSS faces. Pulling back reveals its sides, which sells the 3D.

### Things that silently flatten 3D (Chrome)
Any of these on an element *between* the world and a 3D child collapses it to 2D:
- `opacity < 1`
- `filter`, including `drop-shadow`; use `box-shadow` instead
- `mix-blend-mode`
- `will-change: opacity`
- `overflow: hidden` / `clip-path`
- an **inline** (non-transformable) wrapper; use `inline-block`

Fog and fades must go on **leaf** elements, not containers. Hide not-yet-reached items
with `visibility`, not opacity on the parent.

`offsetParent` inside 3D is unreliable: sum offsets up the chain yourself.

---

## 2. Mograph ("YouTube edit") layer — GSAP

Every line gets a **paused arrival timeline**. It plays forward when the camera lands
and is reversed at 2.2× speed when she scrolls back (`lib/mograph.ts`).

### Text entrance styles (rotate between them)
| style | how |
|---|---|
| letters | per-letter `yPercent 120 → 0`, `scale .3 → 1`, random ±45° rotation, `back.out(2.4)`, stagger .035 |
| pop | `scale 0 → 1`, `back.out(3)` |
| maskUp | `yPercent 115 → 0` inside an overflow mask, `expo.out` |
| skew | `xPercent 70`, `skewX -30 → 0`, `power4.out` |
| blur | `filter blur(10px) → 0` (soft asides only) |

### Highlights and garnish
- **Highlighter.** Wrap words in `*asterisks*` in the copy. A light-green bar
  (`scaleX 0 → 1`, `expo.inOut`) wipes behind the word, then the text turns dark.
- **Underline** draws with `scaleX`.
- **Decor pops.** Hearts, stars, sparkles, rings and squiggles are placed around the text
  at different depths (so they parallax), chosen by **mood regex** on the line's words.
  Each one spins in with `scale 0`, `rotate -140`, `back.out(3)`, and keeps a gentle CSS
  bob afterwards.
- **Confetti.** Burst out with random x/y/rotation, then fall with gravity (`power1.in`)
  and fade.
- **Character stickers** wipe up with `clip-path: inset(100% … ) → inset(-20% …)` plus
  a little overshoot.

### Full-screen transitions
These play on chapter changes and every 5th line, cycling through the kinds:
- iris: two circles open and close, offset in time;
- bars: staggered vertical bars;
- heart: a heart scales up to 70× and fills the screen;
- diagonal: a rotated band sweeps across.

- **Punch.** A small zoom kick on the whole stage, `scale 1.06 → 1` with `expo.out`,
  when a title lands, like a cut on the beat.

### Sound-on-the-way-in-only rule
Wrap timeline sound calls in `cue(fn)`, which checks `!tl.reversed()`. Also set a global
`sfx.quiet` flag from the scroll direction (±0.002 of a screen-height of dead zone), so
rewinding is silent.

---

## 3. Hand-drawn text effect (true "being written")

A clip-path wipe reads as "revealed", not "written". To get real pen-drawing:

1. **Convert the text to glyph outlines at build time.** fontTools instances the
   variable font at the right weight (`instancer.instantiateVariableFont(f, {"wght":700})`).
   HarfBuzz (`uharfbuzz`) shapes the string, giving kerning and contextual alternates.
   `SVGPathPen` + `TransformPen(1,0,0,-1,…)` flips the y axis. Output **one `<path>`
   per glyph** and lay the lines out yourself. The generator is described in
   `content/caption.ts`; the next.js-downloaded woff2 in `.next/static/media` is a
   fine source font.
2. Give every path **`pathLength="1"`**, so dash maths is size-independent:
   `stroke-dasharray: 1 1.2; stroke-dashoffset: 1.05`. The offset is a hair over 1;
   with exactly 1 a round line-cap dot shows before drawing starts.
3. Animate per glyph, **sequentially at constant pen speed**. Each glyph's duration is
   `0.18 + len/total * 3.2` s, using `getTotalLength()` only for timing, with the next
   glyph starting at 72% of this one. Animate the dashoffset `1.05 → 0`, then fade the
   fill in behind the pen (`fillOpacity 0 → 1` from 55% of the stroke). Finally soften
   the outline into the ink (`strokeOpacity → .35`).
4. Use `fromTo` everywhere, so `tl.pause(0)` rubs it all out cleanly when scrolling back.
5. For doodles such as a heart, draw **one wobbly centre-line stroke** with lopsided
   lobes that overshoots where it closes. That looks hand-drawn; a symmetric icon does not.
6. Add a glow with stacked `drop-shadow` filters on the SVG. That is fine here because
   it isn't inside the 3D world.

**Layout rule:** text must never cross faces. On phones, cap the art's height (72svh)
and the caption's height (20svh) so they cannot overlap. On wide screens, move the
caption into the empty side column, (100vw − art width)/2, and balance the other side
with a doodle.

---

## 4. GPU visuals with vgpu (WebGPU)

- `init/getGpu` shares one device, then `surface(canvas)`, `effect(gpu, wgsl, {set})`,
  `frameLoop`, `clock`. WGSL is imported via `wgslTurbopackRule()`
  (@vgpu/wgsl/next), with types declared in `wgsl-env.d.ts`.
- **uv is top-origin** (y grows downward).
- **Grainy mesh gradient + "worlds".** One shader blends 8 procedural backgrounds by a
  weight vector: abstract, city, jungle, meadow, ribbons, topo, bokeh and petals. The
  page crossfades the weights per line, tints them with the current tone, and adds a
  ripple from `landedAt` when a line arrives. This makes text and background feel like
  one image. Finish with a film-grain and vignette overlay over everything.
- **Fireworks shader.** For each burst, compute `cyc = t/period + offset`, then
  `age = fract(cyc)*period`, with a seed per cycle. Rockets rise on wavy trails, then
  burst as:
  - chrysanthemum, with trails back to the centre;
  - peony, with a pale inner layer;
  - willow, curling and falling under heavier gravity;
  - ring.

  Particles are drawn as `k/(d²+k)` glows and tone-mapped with `1 - exp(-c*1.4)`.
  The bursts light up the clouds and rim-light the ridges.
- **Scenery recipe** (all procedural):
  - **Sky:** a gradient sky; stars from a hashed grid; a diagonal Milky Way band (fbm
    dust and fine stars); a moon (disc, fbm craters, two-falloff halo).
  - **Villages:** two layers of ridges, each topped with a village. Each cell holds a
    house: a pitched roof with flared eaves (`pow(1-t,1.6)`) and lit window panes that
    flicker. **Bound every shape on all sides.** A roof with no lower bound fills
    downward into a tower.
  - **Sky lanterns** rise from the villages and shrink with distance. Each is a
    trapezoid body, brighter near the flame at its base, with a soft glow and a
    candle flicker.
- **Sync sound to shader events.** Mirror the shader's timing formula in JS and fire a
  sound when a burst's `age` crosses the rise time, panned by its x position. (It was
  later replaced by a recording, but the technique stands.)
- Skip GPU passes when the layer is covered (`finaleActive`, `finale >= 1`).

### Verifying shaders headlessly
Headless Chromium cannot screenshot WebGPU canvases. Instead, render the WGSL
offscreen with raw WebGPU (`createRenderPipeline`, `copyTextureToBuffer`, `mapAsync`),
return the pixels as **base64** (a JS array of millions of numbers is unusably slow),
and convert them with PIL.

Required flags:
`--enable-unsafe-webgpu --enable-features=Vulkan --enable-unsafe-swiftshader --use-vulkan=swiftshader --disable-vulkan-surface --use-angle=swiftshader --use-webgpu-adapter=swiftshader --ignore-gpu-blocklist`.

Without `Vulkan`, pipelines fail to compile. SwiftShader is slow, so render small sizes
in the background.

---

## 5. Skeuomorphic objects in CSS 3D

- **Turntable.** A box built from six faces (top, four brushed-silver sides, base),
  plus a raised platter, a strobe ring made with a masked `repeating-conic-gradient`,
  and vinyl grooves from `repeating-radial-gradient`. Add a static conic **sheen** over
  the spinning disc, so the record visibly turns under fixed light. The tonearm is an
  SVG that rotates onto the record when playing; there's also a knob and an LED.
- **CD crate.** Jewel cases in a 3D box. Picking one makes it hop out and spin, and its
  disc flies along an arc onto the platter (left/top with different eases, plus
  scale and rotate). Only then does it become the record.
- **Envelope gate.**
  - The envelope is extruded, with a flap whose back face clips correctly; the flap
    gets `z: 0` after it opens so it doesn't cover the card.
  - A pulsing wax-seal button opens it, with an orbit of hearts and sparkles around.
  - A card slides out reading "Happy birthday!" in script.
  - A full light-green iris ends it, and a curtain irises back open on the world.
- **Bug pattern: spinning with a CSS animation while GSAP also writes the transform.**
  If the keyframe has only `to { rotate(360deg) }`, its implicit `from` is GSAP's
  inline `translate(0px)`. The function lists don't match, so the browser falls back
  to matrix interpolation, and 0→360° is the identity matrix the whole way: it never
  moves. Fix both ways: put an explicit `from`, and spin an **inner** element that
  GSAP doesn't touch.

---

## 6. Audio design

### Music
- Web Audio `GainNode` per voice (iOS ignores `<audio>.volume`), with
  `createMediaElementSource`.
- 2.5s crossfades at story **cues**. Each record maps cues to tracks.
- Start offset written as `#t=<sec>`. Seek explicitly on `loadedmetadata` (this also
  works for blob URLs) and loop back to the offset on `ended`.
- Unlock the `AudioContext` from the first tap (the envelope seal).
- A "no music, just words" option silences effects too.

### Synthesized SFX (no files), `lib/sfx.ts`
All of these go through a bus into the master gain, so mute and no-music apply. There's
a per-kind rate limit, and a feedback-echo send (0.17s, lowpass 5.2k, 0.32 feedback) for
shimmer tails.

- **sparkle** rotates through six styles: random pentatonic cascade, arpeggio up,
  arpeggio down, music box (triangle plus a detuned octave), FM glass bell (modulator
  at 3.5×, index decaying) and harp gliss. Each call also varies the scale (pentatonic,
  major, lydian, minor 9), transposes randomly, jitters timing and detune, and sweeps the
  stereo pan. **This variety is what stops it sounding repetitive.**
- **pop:** a sine pitch drop (≈700→150Hz in 0.1s) plus a 25ms high-passed noise click.
- **blip:** a marimba-like sine plus a quiet partial at 3.93× (the mallet knock).
- **tick:** a 30ms band-passed noise click.
- **boom:** a sine sub dropping 120→38Hz, with a 2nd-harmonic triangle so it reads on
  phone speakers, plus a low-passed noise thump.
- **thud:** a short version of the boom, for things landing.
- **whoosh:** band-passed looping noise sweeping 300→2.6k→700Hz with a gain swell and a
  stereo pan sweep.
- **swish:** a short, bright, downward band sweep.
- **riser:** noise and a sawtooth climbing together.
- **shimmer:** high-passed air plus random high bell notes.
- **chime:** inharmonic bell partials (1, 2.76, 5.4, 8.93×) plus a fifth a moment later.
- **scribble:** a pen on paper; band-passed noise with randomly timed little stroke
  envelopes.
- **firework:** a muffled thump plus a crackle burst.

**Mapping.**

| when | sound |
|---|---|
| letters / pop entrance | pop |
| maskUp entrance | blip |
| skew entrance | swish |
| blur entrance | shimmer |
| highlight | sparkle |
| underline, label change, needle drop | tick |
| sticker landing | thud |
| zoom shot | boom (bigger for the "bang" line) |
| title | punch + small boom |
| heart wipe | whoosh, then boom |
| bars wipe | ticks |
| world change | whoosh / shimmer, alternating |
| record lands | thud + tick |
| seal | pop + sparkle + boom |
| card | chime |
| handwriting | chime + scribble, then sparkle |

### Recorded ambience
To loop a short recording seamlessly, take the clip from 1.5s to the end and
**equal-power crossfade** its last 1.5s with the clip's first 1.5s (cos/sin). The end
then flows straight back into the loop start; do it with numpy. ffmpeg's
`asplit`→`acrossfade` produced nothing here. Decode it once to an `AudioBuffer`, loop it
on a `GainNode`, and drive the level from the scene's fade (`setTargetAtTime`).

---

## 7. Preloading so nothing streams mid-story

- Before the first screen, a loader downloads **everything**: every record's songs, the
  finale song, the effects, the character art, the dynamic `import()` of the main
  scene's code, and `document.fonts.ready`.
- Read each file with `fetch` + `res.body.getReader()` for byte progress. Until a
  file's size is known, estimate a placeholder total, so the bar never jumps backwards.
- **Keep the files as Blobs and serve them via `blob:` URLs** through `resolve(path)`.
  Static hosts send `max-age=0, must-revalidate`, so the HTTP cache alone would still
  make a network round trip per file.
- Decode images up front (`img.decode()`).
- Failures fall back to the network path. After 25s, show "start anyway".
- The loader visual is a **symmetric** heart (a Material-style path) whose fill rises
  from the tip (y 21.35) to the top (y 3), not across the whole 24px box. Otherwise
  progress and fill disagree.
- Verify with a test: throttle via CDP `Network.emulateNetworkConditions`, record every
  `/audio/` and `/characters/` request after the loader finishes (must be 0), and check
  that media elements play `blob:` sources at the right `currentTime`.

---

## 8. Images and character art

- **Cutting a character sheet into stickers.** Pillow flood-fills from the edges to
  find the background, keeps the largest connected component, and erodes the edge
  slightly (`MinFilter`) to remove halos.
- **Chroma key for generated art.** Ask the image model for a flat **#FF00FF** (magenta)
  background; nothing on green-and-cream characters is magenta. Then:
  - `mag = min(R,B) - G`;
  - `alpha = 1 - smoothstep(70, 190, mag)`;
  - **despill**: subtract the spill (`mag - 25`) from R and B, scaled by
    `clamp((mag-25)/80)`.

  Fine hair and glasses survive. Save as WebP (≈290KB).
- **Prompt template for consistent re-renders:** "Recreate the attached illustration
  exactly: same characters, style, faces, outfits, pose, framing. CHANGE ONLY THE
  BACKGROUND: flat solid #FF00FF, no gradient/texture/glow/shadow/floor. Keep rim light
  on the characters but no bloom onto the background. Crisp edges, no text."
- Put cut-out characters **in front of** the live shader scene. Don't screen-blend a
  shader over a painted sky; that "looks weird".

---

## 9. Responsive "reference frame" sizing

- Design against two reference frames, portrait 390×780 and landscape 1280×800.
  Compute `k = min(W/refW, H/refH)` and set `--k` and `data-frame` on `<html>`.
  Size everything as `calc(var(--size) * var(--k))`.
- Per-frame variables go under `:root[data-frame="landscape"]`. Plain `[data-frame]`
  loses on specificity.
- Use `svh` for layout so mobile browser chrome doesn't jump things.
- Check every change at 360, 390, 820, 1366 and 1920 widths.

---

## 10. Copy and tone (for heartfelt sites)

- Warm, sincere, no asks or pressure. Past tense for a relationship that ended
  ("this is for you. no strings.").
- Draft rewrites and get approval before changing personal copy.
- Keep all copy in one file (`content/story.ts`) with inline layout, tone, scene, cue
  and cast directives, so pacing is edited with the words.

---

## 11. Workflow notes

- **Local server.** `npx next start -p 3111` under `nohup`. Stop it with
  `fuser -k 3111/tcp`, never `pkill -f`, which kills the shell. Rebuild after stopping it.
- **Playwright.** Use the global Playwright with
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Floating or animated buttons
  need `click({ force: true })`.
- **Testing audio.** Instrument `OscillatorNode.prototype.start` and
  `AudioBufferSourceNode.prototype.start` to count sounds; scrolling back must add 0.
  Instrument `HTMLMediaElement.prototype.play` to inspect `src` and `currentTime`.
- **Copyrighted media.** Don't copy it into `public/` yourself; the user uploads it.
- **Test hooks.** Remove temporary debug hooks (e.g. `window.__tl`) before committing.
