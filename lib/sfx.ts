import { soundtrack } from "./soundtrack";

// Synthesized sound effects (Web Audio, no files): sparkles for highlighted words,
// pops for things landing, whooshes for background changes. They play through the
// soundtrack's master gain, so the sound on/off toggle and "no music" apply too.

const PENTATONIC = [1567.98, 1760, 2093, 2349.32, 2637.02, 3135.96, 3520]; // G6 to A7

class Sfx {
  private bus?: GainNode;
  private echo?: DelayNode;
  private noise?: AudioBuffer;
  private last: Record<string, number> = {};
  /** Set while she scrolls backwards: lines replaying on the way back stay silent. */
  quiet = false;

  private out() {
    if (this.quiet) return null;
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

  /** Rate limit per kind so stacked triggers don't pile up into noise. */
  private ok(kind: string, ms: number) {
    const now = performance.now();
    if (now - (this.last[kind] ?? 0) < ms) return false;
    this.last[kind] = now;
    return true;
  }

  /** A cascade of high bell-like chimes; more notes for more highlighted words. */
  sparkle(count = 3) {
    const ctx = this.out();
    if (!ctx || !this.ok("sparkle", 140)) return;
    const n = Math.min(14, 3 + count * 2);
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + i * 0.045 + Math.random() * 0.02;
      const f = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      for (const [mult, type] of [[1, "sine"], [2.01, "triangle"]] as const) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f * mult;
        o.connect(g);
        o.start(t);
        o.stop(t + 0.6);
      }
      g.connect(this.bus!);
      g.connect(this.echo!);
    }
  }

  /** A soft "bloop": quick pitch drop plus a tiny click. */
  pop(strength = 1) {
    const ctx = this.out();
    if (!ctx || !this.ok("pop", 70)) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(520 + 180 * strength, t);
    o.frequency.exponentialRampToValueAtTime(130, t + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.38 * Math.min(1.4, strength), t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(this.bus!);
    o.start(t);
    o.stop(t + 0.18);

    const click = ctx.createBufferSource();
    click.buffer = this.noise!;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2500;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.12 * strength, t);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
    click.connect(hp).connect(cg).connect(this.bus!);
    click.start(t, Math.random() * 0.5, 0.03);
  }

  /** Filtered air sweeping up and away, panning across. */
  whoosh(duration = 0.9) {
    const ctx = this.out();
    if (!ctx || !this.ok("whoosh", 380)) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise!;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(320, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + duration * 0.55);
    bp.frequency.exponentialRampToValueAtTime(700, t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + duration * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    const pan = ctx.createStereoPanner();
    const dir = Math.random() > 0.5 ? 1 : -1;
    pan.pan.setValueAtTime(-0.7 * dir, t);
    pan.pan.linearRampToValueAtTime(0.7 * dir, t + duration);
    src.connect(bp).connect(g).connect(pan).connect(this.bus!);
    src.start(t, Math.random() * 0.5);
    src.stop(t + duration + 0.05);
  }
}

export const sfx = new Sfx();
