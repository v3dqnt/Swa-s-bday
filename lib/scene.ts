import type { Scene } from "@/content/story";

// Shared state between the scroll/camera loop and the vgpu render loops.
// Plain mutable object: render loops read it every frame, no React re-renders.
export const scene = {
  finale: 0, // finale fade-in, 0..1
  finaleActive: false, // finale section is on screen
  // background targets (the background eases towards these)
  tone: [0.067, 0.141, 0.035] as [number, number, number],
  world: "abstract" as Scene,
  camYaw: 0,
  camPitch: 0,
};
