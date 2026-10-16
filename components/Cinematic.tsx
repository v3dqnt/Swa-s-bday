"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Beat = { text: string; style?: "title" | "soft" };

// Plays text beats one at a time between letterbox bars. Tap anywhere to skip ahead.
export default function Cinematic({ beats, onDone }: { beats: Beat[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const el = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const next = useRef<() => void>(() => {});
  next.current = () => (i + 1 >= beats.length ? onDone() : setI(i + 1));

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const beat = beats[i];
    const words = beat.text.split(/\s+/).length;
    const hold = (beat.style === "title" ? 2.2 : 1.4) + words * 0.28;
    const tl = gsap.timeline({ onComplete: () => next.current() });
    if (reduced) {
      tl.set(node, { opacity: 1 }).to({}, { duration: hold }).to(node, { opacity: 0, duration: 0.4 });
    } else {
      tl.fromTo(node, { opacity: 0, y: 14, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4, ease: "power2.out" })
        .to({}, { duration: hold })
        .to(node, { opacity: 0, y: -8, filter: "blur(6px)", duration: 0.9, ease: "power1.in" });
    }
    return () => { tl.kill(); };
  }, [i, beats, reduced]);

  const beat = beats[i];
  return (
    <div className="cine" onClick={() => next.current()} role="presentation">
      <div className="bar top" />
      <p key={i} ref={el} className={`beat ${beat.style ?? ""}`}>{beat.text}</p>
      <div className="bar bottom" />
    </div>
  );
}
