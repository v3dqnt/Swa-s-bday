"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { preloadAll } from "@/lib/preload";
import { paths } from "./Decor";

// Shown before the envelope while every song, sound and picture downloads, so the
// story never pauses to load later. A heart fills up as the bytes arrive.
export default function Loader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [slow, setSlow] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      gsap.to(root.current, { autoAlpha: 0, duration: 0.6, ease: "power2.inOut", onComplete: onDone });
    };
    preloadAll(setP).then(() => gsap.delayedCall(0.35, finish));
    // on a very slow connection, offer a way in anyway (the rest keeps loading)
    const t = setTimeout(() => setSlow(true), 25000);
    return () => clearTimeout(t);
  }, [onDone]);

  const skip = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  return (
    <div ref={root} className="loader" role="status" aria-live="polite">
      <svg className="loader-heart" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <clipPath id="loader-fill">
            <rect x="0" y={24 - 24 * p} width="24" height={24 * p} />
          </clipPath>
        </defs>
        <g className="outline">{paths.heart}</g>
        <g className="fill" clipPath="url(#loader-fill)">{paths.heart}</g>
      </svg>
      <p className="loader-text">getting everything ready for you.</p>
      <div className="loader-bar">
        <span style={{ transform: `scaleX(${p})` }} />
      </div>
      <p className="loader-pct">{Math.round(p * 100)}%</p>
      {slow && (
        <button className="loader-skip" onClick={skip}>
          start anyway
        </button>
      )}
    </div>
  );
}
