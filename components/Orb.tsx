"use client";
import { useEffect, useRef, useState } from "react";
import { clock, effect, frameLoop, surface } from "vgpu";
import { getGpu } from "@/lib/gpu";
import orbShader from "@/shaders/orb.wgsl";
import { scene } from "@/lib/scene";

// Fixed fullscreen WebGPU backdrop. Falls back to a CSS glow where WebGPU is unavailable.
export default function Orb() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = ref.current!;
    let cancelled = false;
    let stop: (() => void) | undefined;

    (async () => {
      try {
        const gpu = await getGpu();
        if (cancelled) return;
        const target = surface(gpu, canvas, { dpr: [1, 2] });
        const orb = effect(gpu, orbShader, {
          set: { params: { time: 0, progress: 0, mouse: [0.5, 0.5], texel: target.texelSize } },
        });
        target.onResize(() => orb.set({ params: { texel: target.texelSize } }));
        const onMove = (e: PointerEvent) =>
          orb.set({ params: { mouse: [e.clientX / innerWidth, e.clientY / innerHeight] } });
        addEventListener("pointermove", onMove);
        const time = clock(gpu);
        const loop = frameLoop(gpu, (frame) => {
          // The finale covers the screen completely; no need to draw underneath it.
          if (scene.finaleActive && scene.finale >= 1) return;
          orb.set({ params: { time: time.time, progress: scene.progress } });
          frame.pass(target, orb);
        });
        stop = () => {
          loop.stop();
          removeEventListener("pointermove", onMove);
        };
      } catch {
        if (!cancelled) setFallback(true);
      }
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return fallback ? <div className="orb-fallback" /> : <canvas ref={ref} className="backdrop" />;
}
