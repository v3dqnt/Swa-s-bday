"use client";
import { useEffect, useRef, useState } from "react";
import { clock, effect, frameLoop, surface } from "vgpu";
import { getGpu } from "@/lib/gpu";
import finaleShader from "@/shaders/finale.wgsl";
import { scene } from "@/lib/scene";
import { useReducedMotion } from "@/lib/useReducedMotion";
import KineticLine from "./KineticLine";

// The two of them in an embrace against the fireworks (from the character sheet).
function Couple() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="duo" src="/characters/embrace.png" alt="" draggable={false} />;
}

// Festival-night scene. Fade-in is driven by scroll (scene.finale); fireworks run on time.
export default function Finale() {
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
        const target = surface(gpu, canvas, { dpr: [1, 1.5] });
        const night = effect(gpu, finaleShader, {
          set: { params: { time: 0, reveal: 0, texel: target.texelSize } },
        });
        target.onResize(() => night.set({ params: { texel: target.texelSize } }));
        const time = clock(gpu);
        const loop = frameLoop(gpu, (frame) => {
          if (!scene.finaleActive) return;
          const r = scene.finale;
          night.set({ params: { time: reduced ? 3 : time.time, reveal: r * r * (3 - 2 * r) } });
          frame.pass(target, night);
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

  return (
    <div className="finale">
      {fallback ? <div className="finale-fallback" /> : <canvas ref={ref} className="finale-canvas" />}
      <Couple />
      <KineticLine className="finale-caption" text="happy birthday, swara." />
    </div>
  );
}
