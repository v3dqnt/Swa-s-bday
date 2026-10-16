"use client";
import { useEffect, useRef, useState } from "react";
import { clock, effect, frameLoop, surface } from "vgpu";
import backdropShader from "@/shaders/backdrop.wgsl";
import { getGpu } from "@/lib/gpu";
import { scene } from "@/lib/scene";
import type { Scene } from "@/content/story";
import { useReducedMotion } from "@/lib/useReducedMotion";

const WORLDS: Scene[] = ["abstract", "city", "jungle", "meadow", "ribbons", "topo", "bokeh", "petals"];
const ACCENT = [0.56, 0.81, 0.45, 1]; // --leaf

// Fixed full-screen WebGPU background behind the 3D world. It eases its tone and
// world weights towards the targets in `scene`, so changes crossfade smoothly.
export default function Backdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current!;
    let cancelled = false;
    let stop: (() => void) | undefined;

    (async () => {
      try {
        const gpu = await getGpu();
        if (cancelled) return;
        const target = surface(gpu, canvas, { dpr: [1, 1.25] });
        const tone = [...scene.tone];
        const weights = WORLDS.map((w) => (w === scene.world ? 1 : 0));
        const cam = [0, 0];
        let focus = 0;
        let speed = 0;
        const bg = effect(gpu, backdropShader, {
          set: {
            params: {
              time: 0,
              grain: 0.07,
              texel: target.texelSize,
              base: [...tone, 1],
              accent: ACCENT,
              weights: weights.slice(0, 4),
              weights2: weights.slice(4),
              cam: [0, 0, 0, 0],
              fx: [0, 0, 10, 0],
            },
          },
        });
        target.onResize(() => bg.set({ params: { texel: target.texelSize } }));
        const time = clock(gpu);
        const loop = frameLoop(gpu, (frame) => {
          if (scene.finaleActive && scene.finale >= 1) return; // fully covered by the finale
          const k = Math.min(1, time.deltaTime * 1.6); // ~0.6s easing
          for (let i = 0; i < 3; i++) tone[i] += (scene.tone[i] - tone[i]) * k;
          WORLDS.forEach((w, i) => (weights[i] += ((w === scene.world ? 1 : 0) - weights[i]) * k * 0.7));
          cam[0] += (scene.camYaw - cam[0]) * Math.min(1, time.deltaTime * 4);
          cam[1] += (scene.camPitch - cam[1]) * Math.min(1, time.deltaTime * 4);
          focus += (scene.focus - focus) * Math.min(1, time.deltaTime * 3);
          speed += (scene.speed - speed) * Math.min(1, time.deltaTime * 5);
          const age = reduced ? 10 : performance.now() / 1000 - scene.landedAt;
          bg.set({
            params: {
              time: reduced ? 0 : time.time,
              base: [...tone, 1],
              weights: weights.slice(0, 4),
              weights2: weights.slice(4),
              cam: [cam[0], cam[1], 0, 0],
              fx: [focus, reduced ? 0 : speed, age, 0],
            },
          });
          frame.pass(target, bg);
        });
        stop = () => loop.stop();
      } catch {
        if (!cancelled) setFallback(true);
      }
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [reduced]);

  return fallback ? <div className="backdrop-fallback" /> : <canvas ref={ref} className="backdrop" />;
}
