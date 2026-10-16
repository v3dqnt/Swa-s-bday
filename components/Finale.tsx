"use client";
import { useEffect, useRef, useState } from "react";
import { clock, effect, frameLoop, init, surface } from "vgpu";
import finaleShader from "@/shaders/finale.wgsl";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Two silhouettes sharing a quiet moment. Abstract vector shapes, rim-lit warm.
function Silhouettes() {
  return (
    <svg className="duo" viewBox="0 0 200 260" aria-hidden="true">
      <g fill="#0a0510">
        <circle cx="80" cy="62" r="22" />
        <circle cx="66" cy="40" r="11" />
        <path d="M58 86 Q88 78 116 90 L134 260 L34 260 Z" />
        <circle cx="127" cy="76" r="21" />
        <path d="M102 102 Q136 92 172 104 L178 260 L96 260 Z" />
        <path d="M64 96 Q92 80 120 98" stroke="#0a0510" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M152 132 Q120 156 84 148" stroke="#0a0510" strokeWidth="13" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export default function Finale() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);
  const reduced = useReducedMotion();

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
        const target = surface(gpu, canvas, { dpr: [1, 1.5] });
        const scene = effect(gpu, finaleShader, {
          set: { params: { time: 0, reveal: 0, texel: target.texelSize } },
        });
        target.onResize(() => scene.set({ params: { texel: target.texelSize } }));
        const time = clock(gpu);
        let t0: number | null = null;
        const loop = frameLoop(gpu, (frame) => {
          t0 ??= time.time;
          const t = time.time - t0;
          const reveal = Math.min(1, t / 4);
          scene.set({ params: { time: reduced ? 3 : t + 2, reveal: reveal * reveal * (3 - 2 * reveal) } });
          frame.pass(target, scene);
        });
        stop = () => loop.stop();
      } catch {
        if (!cancelled) setFallback(true);
      }
    })();

    return () => {
      cancelled = true;
      stop?.();
      dispose?.();
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
