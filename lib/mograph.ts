import gsap from "gsap";
import type { Shot } from "./camera";
import { sfx } from "./sfx";

// Motion-graphics layer: the little edit-style animations that play (in real time,
// not scrubbed) when the camera arrives at a line, and full-screen mask wipes.

export type TextFx = "letters" | "pop" | "maskUp" | "skew" | "blur" | "none";

const CYCLE: TextFx[] = ["pop", "maskUp", "skew"];

export function fxFor(shot: Shot, i: number): TextFx {
  if (shot.kind === "scatter") return "none"; // its words carry their own depth effect
  if (shot.beat.style === "title") return "letters";
  if (shot.beat.style === "soft") return "blur";
  if (shot.kind === "marquee") return "maskUp";
  if (shot.kind === "zoom") return "pop";
  return CYCLE[i % CYCLE.length];
}

const r = gsap.utils.random;

/** A paused timeline: text entrance, highlighter swipes, underline, garnish pop, confetti. */
export function arrival(item: HTMLElement, fx: TextFx): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  const pieces = item.querySelectorAll<HTMLElement>(".beat .piece");
  // Sounds only on the way in, never while rewinding when she scrolls back.
  const cue = (fn: () => void) => () => {
    if (!tl.reversed()) fn();
  };
  if (fx !== "none") tl.call(cue(() => sfx.pop(fx === "letters" ? 0.9 : 0.6)), undefined, 0.02);

  switch (fx) {
    case "letters":
      tl.fromTo(
        pieces,
        { yPercent: 120, scale: 0.3, rotate: () => r(-45, 45), opacity: 0 },
        { yPercent: 0, scale: 1, rotate: 0, opacity: 1, duration: 0.75, ease: "back.out(2.4)", stagger: 0.035 }
      );
      break;
    case "pop":
      tl.fromTo(pieces, { scale: 0, opacity: 0, yPercent: 40 }, { scale: 1, opacity: 1, yPercent: 0, duration: 0.55, ease: "back.out(3)", stagger: 0.045 });
      break;
    case "maskUp":
      tl.fromTo(pieces, { yPercent: 115 }, { yPercent: 0, duration: 0.75, ease: "expo.out", stagger: 0.05 });
      break;
    case "skew":
      tl.fromTo(pieces, { xPercent: 70, skewX: -30, opacity: 0 }, { xPercent: 0, skewX: 0, opacity: 1, duration: 0.65, ease: "power4.out", stagger: 0.04 });
      break;
    case "blur":
      tl.fromTo(pieces, { opacity: 0, filter: "blur(10px)", y: 12 }, { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.9, ease: "power2.out", stagger: 0.06 });
      break;
  }

  // Highlighter: a light-green bar wipes in behind key words, which turn dark.
  const bars = item.querySelectorAll(".hl-bg");
  if (bars.length) {
    tl.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "expo.inOut", stagger: 0.12 }, ">-0.25");
    tl.call(cue(() => sfx.sparkle(bars.length)), undefined, "<0.15");
    tl.fromTo(item.querySelectorAll(".hl .piece"), { color: "#f2eed6" }, { color: "#112409", duration: 0.2, stagger: 0.12 }, "<0.2");
  }

  const underline = item.querySelector(".underline");
  if (underline) tl.fromTo(underline, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "expo.out" }, "<0.1");

  // Character sticker wipes up from the bottom with a little overshoot.
  const cast = item.querySelector(".cast-in");
  if (cast)
    tl.fromTo(
      cast,
      { clipPath: "inset(100% -20% -20% -20%)", y: 60, scale: 0.92 },
      { clipPath: "inset(-20% -20% -20% -20%)", y: 0, scale: 1, duration: 0.9, ease: "back.out(1.6)" },
      0.05
    ).call(cue(() => sfx.pop(0.8)), undefined, 0.25);

  const pops = item.querySelectorAll(".pop");
  if (pops.length) tl.fromTo(pops, { scale: 0, rotate: -140 }, { scale: 1, rotate: 0, duration: 0.7, ease: "back.out(3)", stagger: 0.07 }, 0.15);

  const confetti = item.querySelectorAll(".confetti");
  if (confetti.length) {
    tl.fromTo(
      confetti,
      { x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 },
      { x: () => r(-280, 280), y: () => r(-240, 40), rotate: () => r(-540, 540), scale: 1, duration: 0.9, ease: "power3.out" },
      0.1
    ).to(confetti, { y: "+=260", rotate: "+=180", opacity: 0, duration: 1.4, ease: "power1.in" }, ">-0.25");
    tl.call(cue(() => sfx.sparkle(4)), undefined, 0.12);
  }
  return tl;
}

// ── Full-screen mask transitions ──────────────────────────────────────

export type WipeKind = "iris" | "bars" | "heart" | "diagonal";
export const WIPES: WipeKind[] = ["iris", "bars", "heart", "diagonal"];

let running: gsap.core.Timeline | null = null;

export function playWipe(kind: WipeKind) {
  running?.progress(1).kill();
  sfx.whoosh(1.0);
  const tl = gsap.timeline();
  const closed = "circle(0% at 50% 50%)";
  const open = "circle(80% at 50% 50%)";
  switch (kind) {
    case "iris":
      tl.set([".wipe-iris", ".wipe-iris2"], { clipPath: closed, autoAlpha: 1 })
        .to(".wipe-iris", { clipPath: open, duration: 0.4, ease: "power3.in" })
        .to(".wipe-iris2", { clipPath: open, duration: 0.32, ease: "power3.in" }, "-=0.2")
        .to([".wipe-iris2", ".wipe-iris"], { clipPath: closed, duration: 0.5, ease: "power3.out", stagger: 0.08 })
        .set([".wipe-iris", ".wipe-iris2"], { autoAlpha: 0 });
      break;
    case "bars":
      tl.set(".wipe-bar", { yPercent: -101, autoAlpha: 1 })
        .to(".wipe-bar", { yPercent: 0, duration: 0.35, ease: "power3.in", stagger: 0.05 })
        .to(".wipe-bar", { yPercent: 101, duration: 0.45, ease: "power3.out", stagger: 0.05 })
        .set(".wipe-bar", { autoAlpha: 0 });
      break;
    case "heart":
      tl.set(".wipe-heart", { scale: 0, rotate: -30, autoAlpha: 1 })
        .to(".wipe-heart", { scale: 70, rotate: 0, duration: 0.6, ease: "power3.in" })
        .to(".wipe-heart", { autoAlpha: 0, duration: 0.35, ease: "power1.out" });
      break;
    case "diagonal":
      tl.set(".wipe-diag", { rotate: -24, xPercent: -110, autoAlpha: 1 })
        .to(".wipe-diag", { xPercent: 0, duration: 0.4, ease: "power3.in" })
        .to(".wipe-diag", { xPercent: 110, duration: 0.5, ease: "power3.out" })
        .set(".wipe-diag", { autoAlpha: 0 });
      break;
  }
  running = tl;
}

/** A small zoom kick on the whole frame, like a cut on the beat. */
export const punch = () => {
  sfx.pop(1.3);
  return gsap.fromTo(".stage", { scale: 1.06 }, { scale: 1, duration: 0.55, ease: "expo.out", overwrite: true });
};
