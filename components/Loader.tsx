"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { preloadAll } from "@/lib/preload";

// Shown before the envelope while every song, sound and picture downloads, so the
// story never pauses to load later. A heart fills up as the bytes arrive.

// A symmetric heart, spanning y 3 → 21.35 in a 24 × 24 box.
const HEART = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
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
            <rect x="0" y={21.35 - 18.35 * p} width="24" height={18.35 * p + 0.1} />
          </clipPath>
        </defs>
        <path className="outline" d={HEART} />
        <path className="fill" d={HEART} clipPath="url(#loader-fill)" />
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
