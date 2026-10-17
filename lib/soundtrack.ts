import type { Cue } from "@/content/story";
import type { Experience } from "@/content/music";

const FADE = 2.5; // seconds

type Voice = { src: string; el: HTMLAudioElement; gain: GainNode };

// Plays one record's tracks and crossfades between them as cues are reached.
// Volume runs through Web Audio gain nodes because iOS ignores <audio>.volume.
class Soundtrack {
  private ctx?: AudioContext;
  private master?: GainNode;
  private voice?: Voice;
  private record: Experience | null = null;
  muted = false;

  /** Must be called from a user gesture (tap/click) so audio is allowed to start. */
  select(record: Experience | null) {
    this.record = record;
    if (!record) return this.fadeOut();
    this.unlock();
    this.follow(["hello"]);
  }

  get active() {
    return this.record !== null;
  }

  /** Given every cue she has scrolled past (in story order), play the latest one this record has a track for. */
  follow(passed: Cue[]) {
    if (!this.record) return;
    const tracks = this.record.tracks;
    const cue = [...passed].reverse().find((c) => tracks[c]);
    const src = cue ? tracks[cue] : undefined;
    if (src && src !== this.voice?.src) this.crossfade(src);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : 1, now, 0.15);
  }

  private unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    this.ctx.resume().catch(() => {});
  }

  private crossfade(src: string) {
    const ctx = this.ctx!;
    this.fadeOut();
    const el = new Audio(src);
    el.preload = "auto";
    // A "#t=<seconds>" start offset: the browser seeks there itself; loop back to it too.
    const start = Number(src.match(/#t=(\d+(?:\.\d+)?)/)?.[1] ?? 0);
    el.loop = !start;
    if (start)
      el.addEventListener("ended", () => {
        el.currentTime = start;
        el.play().catch(() => {});
      });
    const gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(gain).connect(this.master!);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE);
    el.play().catch(() => {}); // a missing file just stays silent
    this.voice = { src, el, gain };
  }

  private fadeOut() {
    const v = this.voice;
    if (!v || !this.ctx) return;
    this.voice = undefined;
    const now = this.ctx.currentTime;
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(v.gain.gain.value, now);
    v.gain.gain.linearRampToValueAtTime(0, now + FADE);
    setTimeout(() => {
      v.el.pause();
      v.gain.disconnect();
    }, FADE * 1000 + 100);
  }
}

export const soundtrack = new Soundtrack();
