# Swa's Birthday Website: Storyboard (v0.1)

A single scrolling journey, about 3 minutes end to end, mobile-first (she'll likely open it on her phone). Each scene is one screen of scroll or one tap. `[ ]` marks personal content only you can supply.

## Tech direction
- **Hosting:** Vercel (static deploy, optional password or unlisted link).
- **Motion/GPU:** WebGL shaders (three.js / react-three-fiber or raw GLSL) for the hero and transitions. GSAP ScrollTrigger drives scroll choreography. Fallback to CSS for low-power phones and `prefers-reduced-motion`.
- **Stack:** Next.js + TypeScript.
- **Palette/mood:** `[ ]` TBD (suggest: warm dusk gradient, rose and gold, soft grain).

---

## Scene 0: Gate (0:00)
**Screen:** Dark screen, a single softly pulsing light/orb. Text: *"Swa, this is for you."* Button: **Open**.
**Motion:** Orb is a GPU particle/fluid shader that reacts to touch and cursor.
**Why:** The tap unlocks audio (browsers block autoplay) and builds anticipation.

## Scene 1: The Wake-up (0:05)
**Screen:** Orb blooms into a gradient sky. Big type fades in: *"Happy Birthday, [nickname]"*, with the date `[ ]`.
**Motion:** Shader gradient flow, letters reveal one by one, confetti-like particles drift upward.
**Audio:** `[song]` fades in softly.

## Scene 2: How we began (0:20)
**Screen:** Scroll-driven timeline. Three to five photo cards, each with a date and a one-line caption (how we met, first date, first trip...).
**Motion:** Photos drift in a 3D parallax stack, with a liquid-distortion hover/tap transition between them.
**Content needed:** `[5 photos + captions]`

## Scene 3: Things I love about you (1:00)
**Screen:** Floating words/phrases orbiting in 3D (*"your laugh"*, *"how you..."*). Tap one to see a short note.
**Motion:** Interactive 3D word cloud; each tap triggers a ripple shader.
**Content needed:** `[8-10 short things]`

## Scene 4: The letter (1:40)
**Screen:** A sealed envelope. Tap to open, and a handwritten-style letter types out line by line.
**Motion:** Envelope fold animation, subtle paper texture, a slow camera push-in.
**Content needed:** `[the letter, about 120-200 words]`

## Scene 5: Little game / surprise (2:20) *(optional)*
**Screen:** Make a wish: she blows on the mic (or taps) to extinguish candles on a cake, or collects floating hearts for a count-up.
**Motion:** Candle flames are a GPU flame shader; extinguishing releases smoke and fireworks.

## Scene 6: The gift reveal (2:45)
**Screen:** Fireworks, then: *"Your real gift is..."* with a button or ticket reveal `[ ]` (or a "see you at 8pm" reveal).
**Motion:** Full-screen firework particle system, then a clean fade to the reveal card.

## Scene 7: Outro (3:00)
**Screen:** Quiet closing line: *"I love you, [name]."* Replay button, plus a "save this memory" link.
**Motion:** Slow starfield, music fades out.

---

## Flow diagram
```
Gate -> Wake-up -> Timeline -> Love list -> Letter -> [Candle game] -> Gift reveal -> Outro
 tap     auto       scroll       tap/scroll    tap        mic/tap         tap          replay
```

## Open questions
1. "Vercel vgpu": do you mean Vercel hosting plus WebGL/GPU shaders (my assumption), or something else?
2. Her name/nickname, birthday date, and the tone (romantic, playful, funny)?
3. Which scenes do you want to keep, cut, or reorder? Is the candle game in?
4. Do you have photos, a song, and a gift or surprise to reveal?
5. Delivery: a link she opens at a set time, or shown in person?
