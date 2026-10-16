// Responsive sizing for the whole experience. Everything is designed for one of
// two reference frames (a phone in portrait, a laptop in landscape) and scaled by
// k so it fills the actual screen the same way. CSS reads --k and [data-frame].
export type Frame = { portrait: boolean; k: number };

export const REF = { portrait: { w: 390, h: 780 }, landscape: { w: 1280, h: 800 } };

export function measureFrame(): Frame {
  const portrait = innerWidth / innerHeight < 1.05;
  const ref = portrait ? REF.portrait : REF.landscape;
  const k = Math.min(innerWidth / ref.w, innerHeight / ref.h);
  const root = document.documentElement;
  root.dataset.frame = portrait ? "portrait" : "landscape";
  root.style.setProperty("--k", k.toFixed(4));
  return { portrait, k };
}
