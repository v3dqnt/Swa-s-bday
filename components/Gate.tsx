"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import KineticLine from "./KineticLine";
import { story } from "@/content/story";

export default function Gate({ onOpen }: { onOpen: () => void }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.3 })
        .from(".gate-title .piece", { yPercent: 115, rotate: 6, duration: 1.1, ease: "expo.out", stagger: 0.05 })
        .from(".gate-sub .piece", { yPercent: 115, duration: 0.9, ease: "expo.out", stagger: 0.08 }, "-=0.6")
        .from(".gate button", { opacity: 0, y: 12, duration: 0.8, ease: "power2.out" }, "-=0.4");
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={root} className="gate">
      <KineticLine className="gate-title" text={`${story.name}.`} letters />
      <KineticLine className="gate-sub" text="this is for you. no strings." />
      <button onClick={onOpen}>open.</button>
    </main>
  );
}
