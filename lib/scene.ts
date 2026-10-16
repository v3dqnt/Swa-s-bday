// Scroll state shared between the GSAP/Lenis driver and the vgpu render loop.
// Plain mutable object: the render loop reads it every frame, no React re-renders.
export const scene = {
  finale: 0, // finale fade-in, 0..1
  finaleActive: false, // finale section is on screen
};
