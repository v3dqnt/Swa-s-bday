"use client";
import { useEffect, useRef, useState } from "react";
import { clock, effect, frameLoop, surface } from "vgpu";
import { getGpu } from "@/lib/gpu";
import finaleShader from "@/shaders/finale.wgsl";
import { scene } from "@/lib/scene";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Two silhouettes sharing a quiet moment. Abstract vector shapes, rim-lit in beige.
function Silhouettes() {
  return (
    <svg className="duo" viewBox="0 0 200 260" aria-hidden="true">
      <g fill="#03100a">
        <circle cx="80" cy="62" r="22" />
        <circle cx="66" cy="40" r="11" />
        <path d="M58 86 Q88 78 116 90 L134 260 L34 260 Z" />
        <circle cx="127" cy="76" r="21" />
        <path d="M102 102 Q136 92 172 104 L178 260 L96 260 Z" />
        <path d="M64 96 Q92 80 120 98" stroke="#03100a" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M152 132 Q120 156 84 148" stroke="#03100a" strokeWidth="13" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
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
      <Silhouettes />
      <p className="finale-caption">Happy birthday, Swara.</p>
    </div>
  );
}
