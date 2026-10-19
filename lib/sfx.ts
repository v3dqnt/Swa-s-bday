import { soundtrack } from "./soundtrack";
import { resolve } from "./preload";

// Synthesized sound effects (Web Audio, no files): sparkles for highlighted words,
// pops and blips for things landing, booms for big moments, whooshes, swishes and
// risers for transitions, chimes for the handwritten lines and firework bursts in
// the finale. They play through the soundtrack's master gain, so the sound on/off
// toggle and "no music" apply too.

// Note tables (Hz), around G6–A7 so they sit above the songs.
const SCALES = {
  pentatonic: [1567.98, 1760, 2093, 2349.32, 2637.02, 3135.96, 3520],
  major: [1046.5, 1318.51, 1567.98, 2093, 2637.02, 3135.96, 4186.01],
  lydian: [1174.66, 1479.98, 1760, 2217.46, 2349.32, 2959.96, 3520],
  minor9: [1396.91, 1661.22, 2093, 2349.32, 2793.83, 3322.44, 4186.01],
};
type ScaleName = keyof typeof SCALES;
type SparkleStyle = "cascade" | "arpUp" | "arpDown" | "musicBox" | "glass" | "harp";
const STYLES: SparkleStyle[] = ["cascade", "arpUp", "musicBox", "glass", "arpDown", "harp"];

const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
const jitter = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;

class Sfx {
  private bus?: GainNode;
  private echo?: DelayNode;
  private noise?: AudioBuffer;
  private last: Record<string, number> = {};
  private style = -1;
  /** Set while she scrolls backwards: lines replaying on the way back stay silent. */
  quiet = false;

  private out() {
    if (this.quiet) return null;
    return this.ready();
  }

  private ready() {
    const o = soundtrack.output();
    if (!o) return null;
    const { ctx, master } = o;
    if (!this.bus) {
      this.bus = ctx.createGain();
      this.bus.gain.value = 0.55;
      this.bus.connect(master);
      // a soft feedback echo gives the sparkles a shimmery tail
      this.echo = ctx.createDelay(1);
      this.echo.delayTime.value = 0.17;
      const fb = ctx.createGain();
      fb.gain.value = 0.32;
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 5200;
      this.echo.connect(tone).connect(fb).connect(this.echo);
      tone.connect(this.bus);
      const len = ctx.sampleRate;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return ctx;
  }

  private amb?: { gain: GainNode; level: number };
  private ambLoading = false;

  /**
   * The recorded distant fireworks (public/audio/fireworks-distant.mp3, a seamless
   * loop) as a bed under the finale. level 0..1 follows how far the night scene has
   * faded in; unlike the one-shots it keeps playing while she scrolls back.
   */
  fireworks(level: number) {
    const ctx = this.ready();
    if (!ctx) level = 0;
    if (this.amb) {
      if (Math.abs(level - this.amb.level) < 0.01) return;
      this.amb.level = level;
      this.amb.gain.gain.setTargetAtTime(level * 0.55, this.amb.gain.context.currentTime, 0.25);
      return;
    }
    if (!ctx || level <= 0 || this.ambLoading) return;
    this.ambLoading = true;
    fetch(resolve("/audio/fireworks-distant.mp3"))
      .then((r) => r.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(this.bus!);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.connect(gain);
        src.start();
        this.amb = { gain, level: -1 };
      })
      .catch(() => {
        this.ambLoading = false;
      });
  }

  /** Rate limit per kind so stacked triggers don't pile up into noise. */
  private ok(kind: string, ms: number) {
    const now = performance.now();
    if (now - (this.last[kind] ?? 0) < ms) return false;
    this.last[kind] = now;
    return true;
  }

  /** Output chain for one sound: gain envelope → optional pan → bus (+ echo). */
  private env(ctx: AudioContext, t: number, peak: number, decay: number, opts: { pan?: number; echo?: boolean; attack?: number } = {}) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + (opts.attack ?? 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    let tail: AudioNode = g;
    if (opts.pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan));
      g.connect(p);
      tail = p;
    }
    tail.connect(this.bus!);
    if (opts.echo) tail.connect(this.echo!);
    return g;
  }

  private osc(ctx: AudioContext, type: OscillatorType, f: number, t: number, len: number, to: AudioNode) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.connect(to);
    o.start(t);
    o.stop(t + len);
    return o;
  }

  private burst(ctx: AudioContext, t: number, len: number, to: AudioNode, loop = false) {
    const src = ctx.createBufferSource();
    src.buffer = this.noise!;
    src.loop = loop;
    src.connect(to);
    src.start(t, Math.random() * 0.5, loop ? undefined : len);
    if (loop) src.stop(t + len);
    return src;
  }

  /** One bell-ish note in one of several timbres. */
  private note(ctx: AudioContext, t: number, f: number, style: SparkleStyle, pan: number) {
    switch (style) {
      case "musicBox": {
        // plucked comb: triangle + a quiet, slightly sharp octave and a fast decay
        const g = this.env(ctx, t, 0.08, 0.9, { pan, echo: true });
        this.osc(ctx, "triangle", f / 2, t, 1, g);
        this.osc(ctx, "sine", f * 1.003, t, 0.5, g);
        break;
      }
      case "glass": {
        // FM bell: inharmonic shimmer that settles into a pure tone
        const g = this.env(ctx, t, 0.06, 1.1, { pan, echo: true });
        const car = this.osc(ctx, "sine", f, t, 1.2, g);
        const mod = ctx.createOscillator();
        mod.frequency.value = f * 3.5;
        const depth = ctx.createGain();
        depth.gain.setValueAtTime(f * 1.4, t);
        depth.gain.exponentialRampToValueAtTime(1, t + 0.6);
        mod.connect(depth).connect(car.frequency);
        mod.start(t);
        mod.stop(t + 1.2);
        break;
      }
      case "harp": {
        const g = this.env(ctx, t, 0.07, 0.7, { pan, echo: true });
        this.osc(ctx, "triangle", f / 2, t, 0.75, g);
        this.osc(ctx, "sine", f, t, 0.4, g);
        break;
      }
      default: {
        const g = this.env(ctx, t, 0.07, 0.55, { pan, echo: true });
        this.osc(ctx, "sine", f, t, 0.6, g);
        this.osc(ctx, "triangle", f * 2.01, t, 0.6, g);
      }
    }
  }

  /**
   * A twinkle of chimes; more notes for more highlighted words. Each call rotates to a
   * different style, key and scale so no two highlights sound alike.
   */
  sparkle(count = 3) {
    const ctx = this.out();
    if (!ctx || !this.ok("sparkle", 140)) return;
    this.style = (this.style + 1 + (Math.random() < 0.3 ? 1 : 0)) % STYLES.length;
    const style = STYLES[this.style];
    const scale = SCALES[pick(Object.keys(SCALES) as ScaleName[])];
    const shift = pick([1, 1, 2 ** (2 / 12), 2 ** (-3 / 12), 2 ** (5 / 12)]);
    const n = Math.min(style === "harp" ? 16 : 12, 3 + count * 2 + Math.floor(Math.random() * 3));
    const gap = style === "harp" ? 0.028 : style === "musicBox" ? 0.09 : style === "glass" ? 0.11 : 0.05;
    const panFrom = Math.random() * 1.2 - 0.6;
    const panTo = -panFrom;
    for (let i = 0; i < n; i++) {
      const k = i / Math.max(1, n - 1);
      let idx: number;
      if (style === "arpUp" || style === "harp") idx = i % scale.length;
      else if (style === "arpDown") idx = scale.length - 1 - (i % scale.length);
      else idx = Math.floor(Math.random() * scale.length);
      const octave = (style === "harp" || style === "arpUp") && i >= scale.length ? 2 : style === "arpDown" && i >= scale.length ? 0.5 : 1;
      const f = scale[idx] * shift * octave * jitter(0.003);
      const t = ctx.currentTime + i * gap * jitter(0.25);
      this.note(ctx, t, f, style, panFrom + (panTo - panFrom) * k);
    }
  }

  /** A soft "bloop": quick pitch drop plus a tiny click. */
  pop(strength = 1) {
    const ctx = this.out();
    if (!ctx || !this.ok("pop", 70)) return;
    const t = ctx.currentTime;
    const g = this.env(ctx, t, 0.38 * Math.min(1.4, strength), 0.16, { attack: 0.006, pan: (Math.random() - 0.5) * 0.4 });
    const o = this.osc(ctx, "sine", 0, t, 0.18, g);
    const start = (520 + 180 * strength) * jitter(0.15);
    o.frequency.setValueAtTime(start, t);
    o.frequency.exponentialRampToValueAtTime(start * 0.22, t + 0.1);

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2500;
    const cg = this.env(ctx, t, 0.12 * strength, 0.025, { attack: 0.001 });
    this.burst(ctx, t, 0.03, hp);
    hp.connect(cg);
  }

  /** A short wooden/marimba blip: for words popping in one after another. */
  blip(pitch = 1) {
    const ctx = this.out();
    if (!ctx || !this.ok("blip", 60)) return;
    const t = ctx.currentTime;
    const f = pick([784, 880, 988, 1175, 1319]) * pitch;
    const g = this.env(ctx, t, 0.16, 0.22, { attack: 0.002, pan: (Math.random() - 0.5) * 0.8 });
    this.osc(ctx, "sine", f, t, 0.25, g);
    const h = this.env(ctx, t, 0.05, 0.05, { attack: 0.001 });
    this.osc(ctx, "sine", f * 3.93, t, 0.06, h); // the mallet's knock
  }

  /** A tiny tick: underlines being drawn, the label changing. */
  tick() {
    const ctx = this.out();
    if (!ctx || !this.ok("tick", 50)) return;
    const t = ctx.currentTime;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3800 * jitter(0.2);
    bp.Q.value = 6;
    const g = this.env(ctx, t, 0.35, 0.03, { attack: 0.0005 });
    this.burst(ctx, t, 0.035, bp);
    bp.connect(g);
  }

  /** A small cinematic boom: sub drop with a felt thump. Bigger strength, deeper and longer. */
  boom(strength = 1) {
    const ctx = this.out();
    if (!ctx || !this.ok("boom", 220)) return;
    const t = ctx.currentTime;
    const s = Math.min(1.6, strength);
    const len = 0.6 + 0.6 * s;
    const g = this.env(ctx, t, 0.55 * s, len, { attack: 0.005 });
    const o = this.osc(ctx, "sine", 0, t, len + 0.05, g);
    o.frequency.setValueAtTime(120 * jitter(0.08), t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.35 + 0.2 * s);
    // a touch of second harmonic so it reads on phone speakers
    const g2 = this.env(ctx, t, 0.12 * s, 0.25, { attack: 0.003 });
    const o2 = this.osc(ctx, "triangle", 0, t, 0.3, g2);
    o2.frequency.setValueAtTime(240, t);
    o2.frequency.exponentialRampToValueAtTime(80, t + 0.2);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + 0.3);
    const ng = this.env(ctx, t, 0.4 * s, 0.35, { attack: 0.002 });
    this.burst(ctx, t, 0.4, lp);
    lp.connect(ng);
  }

  /** A soft landing thud: character stickers hitting the ground. */
  thud(strength = 1) {
    const ctx = this.out();
    if (!ctx || !this.ok("thud", 120)) return;
    const t = ctx.currentTime;
    const g = this.env(ctx, t, 0.4 * strength, 0.22, { attack: 0.003 });
    const o = this.osc(ctx, "sine", 0, t, 0.25, g);
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    const ng = this.env(ctx, t, 0.25 * strength, 0.08, { attack: 0.001 });
    this.burst(ctx, t, 0.1, lp);
    lp.connect(ng);
  }

  /** Bell partials with a long tail: for the handwritten lines. */
  chime(root = 1318.51) {
    const ctx = this.out();
    if (!ctx || !this.ok("chime", 400)) return;
    const t = ctx.currentTime;
    for (const [mult, amp, len] of [[1, 0.09, 2.4], [2.76, 0.04, 1.4], [5.4, 0.025, 0.8], [8.93, 0.012, 0.5]]) {
      const g = this.env(ctx, t, amp, len, { echo: true, attack: 0.003 });
      this.osc(ctx, "sine", root * mult, t, len + 0.05, g);
    }
    // a fifth above, a breath later
    const g = this.env(ctx, t + 0.12, 0.05, 1.8, { echo: true });
    this.osc(ctx, "sine", root * 1.5, t + 0.12, 1.9, g);
  }

  /** Airy glitter: high filtered noise that swells and fades, with faint bells inside. */
  shimmer(duration = 1.4) {
    const ctx = this.out();
    if (!ctx || !this.ok("shimmer", 600)) return;
    const t = ctx.currentTime;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(5000, t);
    hp.frequency.linearRampToValueAtTime(8000, t + duration);
    const g = this.env(ctx, t, 0.09, duration, { attack: duration * 0.4, echo: true });
    this.burst(ctx, t, duration, hp, true);
    hp.connect(g);
    const scale = SCALES.lydian;
    for (let i = 0; i < 6; i++) {
      const at = t + Math.random() * duration * 0.7;
      const bg = this.env(ctx, at, 0.025, 0.5, { pan: Math.random() * 1.6 - 0.8, echo: true });
      this.osc(ctx, "sine", pick(scale) * 2, at, 0.55, bg);
    }
  }

  /** Filtered air sweeping up and away, panning across. */
  whoosh(duration = 0.9) {
    const ctx = this.out();
    if (!ctx || !this.ok("whoosh", 380)) return;
    const t = ctx.currentTime;
    const d = duration * jitter(0.12);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.8 + Math.random() * 0.8;
    const lo = 260 + Math.random() * 160;
    bp.frequency.setValueAtTime(lo, t);
    bp.frequency.exponentialRampToValueAtTime(2000 + Math.random() * 1400, t + d * 0.55);
    bp.frequency.exponentialRampToValueAtTime(lo * 2, t + d);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + d * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    const pan = ctx.createStereoPanner();
    const dir = Math.random() > 0.5 ? 1 : -1;
    pan.pan.setValueAtTime(-0.7 * dir, t);
    pan.pan.linearRampToValueAtTime(0.7 * dir, t + d);
    this.burst(ctx, t, d + 0.05, bp, true);
    bp.connect(g).connect(pan).connect(this.bus!);
  }

  /** A quick, bright swish: sideways text slides. */
  swish() {
    const ctx = this.out();
    if (!ctx || !this.ok("swish", 150)) return;
    const t = ctx.currentTime;
    const d = 0.22;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 2;
    bp.frequency.setValueAtTime(5500, t);
    bp.frequency.exponentialRampToValueAtTime(1500, t + d);
    const g = this.env(ctx, t, 0.22, d, { attack: 0.03, pan: Math.random() > 0.5 ? 0.5 : -0.5 });
    this.burst(ctx, t, d, bp);
    bp.connect(g);
  }

  /** Tension build: noise and a tone climbing together. */
  riser(duration = 1.2) {
    const ctx = this.out();
    if (!ctx || !this.ok("riser", 900)) return;
    const t = ctx.currentTime;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(6000, t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + duration * 0.95);
    g.gain.linearRampToValueAtTime(0, t + duration + 0.04);
    this.burst(ctx, t, duration + 0.05, bp, true);
    bp.connect(g).connect(this.bus!);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.0001, t);
    tg.gain.exponentialRampToValueAtTime(0.05, t + duration * 0.95);
    tg.gain.linearRampToValueAtTime(0, t + duration + 0.04);
    tg.connect(this.bus!);
    const o = this.osc(ctx, "sawtooth", 0, t, duration + 0.05, tg);
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(880, t + duration);
  }

  /** A pen scratching across paper: grainy noise with a jittery stroke rhythm. */
  scribble(duration = 3) {
    const ctx = this.out();
    if (!ctx || !this.ok("scribble", 1000)) return;
    const t = ctx.currentTime;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    // each little stroke swells and lifts off, at an uneven handwriting pace
    let at = t;
    while (at < t + duration) {
      const len = 0.08 + Math.random() * 0.22;
      g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, at + len * 0.3);
      g.gain.linearRampToValueAtTime(0.004, at + len);
      bp.frequency.setValueAtTime(2400 + Math.random() * 1800, at);
      at += len + Math.random() * 0.06;
    }
    g.gain.linearRampToValueAtTime(0.0001, at + 0.05);
    this.burst(ctx, t, at - t + 0.1, bp, true);
    bp.connect(g).connect(this.bus!);
  }

  /** A firework far off: muffled thump, then a sizzle of crackles. `pan` is -1..1. */
  firework(pan = 0, size = 1, crackle = false) {
    const ctx = this.out();
    if (!ctx || !this.ok("firework", 160)) return;
    const t = ctx.currentTime;
    const g = this.env(ctx, t, 0.26 * size, 0.7, { pan: pan * 0.8, attack: 0.004 });
    const o = this.osc(ctx, "sine", 0, t, 0.75, g);
    o.frequency.setValueAtTime(95 * jitter(0.15), t);
    o.frequency.exponentialRampToValueAtTime(34, t + 0.4);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    const ng = this.env(ctx, t, 0.22 * size, 0.3, { pan: pan * 0.8, attack: 0.002 });
    this.burst(ctx, t, 0.32, lp);
    lp.connect(ng);
    if (!crackle) return;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3000;
    hp.connect(this.env(ctx, t + 0.15, 1, 1.4, { pan: pan * 0.8, attack: 0.001 }));
    for (let i = 0; i < 26; i++) {
      const at = t + 0.15 + Math.random() ** 1.6 * 1.2;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.05 + Math.random() * 0.06, at);
      cg.gain.exponentialRampToValueAtTime(0.0001, at + 0.012);
      cg.connect(hp);
      this.burst(ctx, at, 0.014, cg);
    }
  }
}

export const sfx = new Sfx();
