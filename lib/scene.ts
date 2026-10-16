// Scroll state shared between the GSAP/Lenis driver and the vgpu render loops.
// Plain mutable object: render loops read it every frame, no React re-renders.
export const scene = {
  progress: 0, // whole-page scroll progress, 0..1
  finale: 0, // finale fade-in, 0..1
  finaleActive: false, // finale section is on screen
};
