"use client";
import { useEffect, useRef, useState } from "react";
import { clock, effect, frameLoop, init, surface } from "vgpu";
import orbShader from "@/shaders/orb.wgsl";

// Fullscreen WebGPU orb. Falls back to a CSS glow where WebGPU is unavailable.
export default function Orb() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = ref.current!;
    let cancelled = false;
    let stop: (() => void) | undefined;
    let dispose: (() => void) | undefined;

    (async () => {
      if (!("gpu" in navigator)) return setFallback(true);
      try {
        const gpu = await init();
        if (cancelled) return gpu.dispose();
        dispose = () => gpu.dispose();
        const target = surface(gpu, canvas, { dpr: [1, 2] });
        const orb = effect(gpu, orbShader, {
          set: { params: { time: 0, texel: target.texelSize, mouse: [0.5, 0.5] } },
        });
        target.onResize(() => orb.set({ params: { texel: target.texelSize } }));
        const onMove = (e: PointerEvent) =>
          orb.set({ params: { mouse: [e.clientX / innerWidth, 1 - e.clientY / innerHeight] } });
        addEventListener("pointermove", onMove);
        const time = clock(gpu);
        const loop = frameLoop(gpu, (frame) => {
          orb.set({ params: { time: time.time } });
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
      dispose?.();
    };
  }, []);

  return fallback ? (
    <div className="orb-fallback" />
  ) : (
    <canvas ref={ref} style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }} />
  );
}
