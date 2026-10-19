"use client";
import { useEffect, useRef, useState } from "react";
import { clock, effect, frameLoop, surface } from "vgpu";
import { getGpu } from "@/lib/gpu";
import finaleShader from "@/shaders/finale.wgsl";
import { scene } from "@/lib/scene";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { caption, type CaptionLayout } from "@/content/caption";


// The caption as letter outlines; World draws them on with drawOn() (lib/mograph.ts).
function Handwriting({ layout, className }: { layout: CaptionLayout; className: string }) {
  return (
    <svg className={`cap-svg ${className}`} viewBox={layout.viewBox} aria-hidden="true">
      {layout.glyphs.map((g, i) => (
        <path key={i} className="cap-glyph" d={g.d} pathLength={1} />
      ))}
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
          set: { params: { time: 0, reveal: 0, texel: target.texelSize, opts: [0, 0, 0, 0] } },
        });
        target.onResize(() => night.set({ params: { texel: target.texelSize } }));
        const time = clock(gpu);
        const loop = frameLoop(gpu, (frame) => {
          if (!scene.finaleActive) return;
          const r = scene.finale;
          night.set({ params: { time: reduced ? 3 : time.time, reveal: r * r * (3 - 2 * r), opts: [0, 0, 0, 0] } });
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
        <img className="finale-art" src="/characters/finale-cutout.webp" alt="The two of us holding hands under the fireworks" draggable={false} />
      </div>
      <div className="finale-caption" role="img" aria-label="Happy birthday, Swara.">
        <Handwriting layout={caption.wide} className="cap-wide" />
        <Handwriting layout={caption.stacked} className="cap-stacked" />
      </div>
      {/* a doodled heart balancing the caption on the other side (wide screens);
          one wobbly stroke with lopsided lobes that overshoots where it closes */}
      <svg className="cap-heart" viewBox="0 0 200 190" aria-hidden="true">
        <path
          pathLength={1}
          d="M103 171C73 141 19 110 22 63C24 31 61 17 84 39C94 49 98 61 100 71C104 55 113 35 137 26C167 16 190 45 178 83C167 118 129 146 97 177C92 182 89 175 95 168"
        />
      </svg>
    </div>
  );
}
