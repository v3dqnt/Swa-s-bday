"use client";
import { useEffect, useRef, useState } from "react";
import { clock, effect, frameLoop, surface } from "vgpu";
import { getGpu } from "@/lib/gpu";
import finaleShader from "@/shaders/finale.wgsl";
import { scene } from "@/lib/scene";
import { useReducedMotion } from "@/lib/useReducedMotion";

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
          set: { params: { time: 0, reveal: 0, texel: target.texelSize, opts: [0, 0, 0, 0] } },
        });
        target.onResize(() => night.set({ params: { texel: target.texelSize } }));
        const time = clock(gpu);
        const loop = frameLoop(gpu, (frame) => {
          if (!scene.finaleActive) return;
          const r = scene.finale;
          // Phones: the illustration fills the screen and the bursts overlay its sky.
          // Wide screens: the full night sky sits behind the illustration panel.
          const overlay = document.documentElement.dataset.frame !== "landscape" ? 1 : 0;
          night.set({ params: { time: reduced ? 3 : time.time, reveal: r * r * (3 - 2 * r), opts: [overlay, 0, 0, 0] } });
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
      <div className="finale-art-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="finale-art" src="/characters/finale.jpg" alt="The two of us holding hands under the fireworks" draggable={false} />
      </div>
      <p className="finale-caption script-text" aria-label="Happy birthday, Swara.">
        <span className="cap-line">Happy birthday,</span>
        <span className="cap-line">Swara.</span>
      </p>
    </div>
  );
}
