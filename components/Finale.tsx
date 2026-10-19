"use client";
import { useEffect, useRef, useState } from "react";
import { clock, effect, frameLoop, surface } from "vgpu";
import { getGpu } from "@/lib/gpu";
import finaleShader from "@/shaders/finale.wgsl";
import { scene } from "@/lib/scene";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { sfx } from "@/lib/sfx";

// Mirrors the burst schedule in finale.wgsl so each explosion on screen gets a
// distant boom (panned to where it is), and the trailing kinds a crackle.
const RISE = 0.9;
const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};
function burstSounds(prev: number[], t: number) {
  for (let b = 0; b < 10; b++) {
    const period = 3.6 + b * 0.33;
    const cyc = t / period + b * 0.37;
    const age = (cyc - Math.floor(cyc)) * period;
    if (prev[b] < RISE && age >= RISE) {
      const seed = b * 17.3 + Math.floor(cyc) * 9.1;
      let kind = Math.floor(hash(seed + 7) * 5);
      if (kind === 4) kind = 1;
      sfx.firework((hash(seed) - 0.5) * 2, kind === 3 ? 0.5 : 0.75 + 0.25 * hash(seed + 5), kind === 0 || kind === 2);
    }
    prev[b] = age;
  }
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
          set: { params: { time: 0, reveal: 0, texel: target.texelSize, opts: [0, 0, 0, 0] } },
        });
        target.onResize(() => night.set({ params: { texel: target.texelSize } }));
        const time = clock(gpu);
        const ages = new Array(10).fill(RISE);
        const loop = frameLoop(gpu, (frame) => {
          if (!scene.finaleActive) return;
          const r = scene.finale;
          if (!reduced && r > 0.5) burstSounds(ages, time.time);
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
