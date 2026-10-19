"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import KineticLine from "./KineticLine";
import { paths, type Shape } from "./Decor";
import { story } from "@/content/story";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { soundtrack } from "@/lib/soundtrack";
import { sfx } from "@/lib/sfx";

const ORBIT: Shape[] = ["heart", "sparkle", "star", "heart", "sparkle", "dot", "heart", "ring"];
const BAND = "happy birthday ✦ swara ✦ ";

function Band({ className, reverse }: { className: string; reverse?: boolean }) {
  return (
    <div className={`band ${className}`} aria-hidden="true">
      <div className={`band-track ${reverse ? "rev" : ""}`}>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i}>{BAND}</span>
        ))}
      </div>
    </div>
  );
}

// The first screen: her name, crossing birthday banners, and a 3D envelope sealed
// with a wax seal. Tapping the seal opens the envelope and irises into the world.
export default function Gate({ onOpen }: { onOpen: () => void }) {
  const root = useRef<HTMLElement>(null);
  const opening = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.2 })
        .from(".band", { xPercent: (i) => (i ? 60 : -60), autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: 0.1 })
        .from(".gate-title .piece", { yPercent: 120, rotate: () => gsap.utils.random(-30, 30), duration: 1, ease: "back.out(2)", stagger: 0.06 }, "-=0.9")
        .from(".envelope-float", { y: 120, rotateX: 50, autoAlpha: 0, duration: 1.3, ease: "expo.out" }, "-=0.7")
        .from(".orbit .orb", { scale: 0, duration: 0.6, ease: "back.out(3)", stagger: 0.05 }, "-=0.8")
        .from(".gate-sub .piece, .seal-hint", { yPercent: 100, autoAlpha: 0, duration: 0.7, ease: "power3.out", stagger: 0.05 }, "-=0.5");
      if (!reduced) gsap.to(".envelope-float", { y: -10, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }, root);

    // The envelope leans towards the pointer.
    const env = root.current!.querySelector(".envelope");
    const rx = gsap.quickTo(env, "rotateX", { duration: 0.8, ease: "power3.out" });
    const ry = gsap.quickTo(env, "rotateY", { duration: 0.8, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      if (reduced || opening.current) return;
      rx((0.5 - e.clientY / innerHeight) * 22);
      ry((e.clientX / innerWidth - 0.5) * 30);
    };
    addEventListener("pointermove", onMove);
    return () => {
      removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, [reduced]);

  const open = () => {
    if (opening.current) return;
    opening.current = true;
    soundtrack.wake(); // this tap unlocks audio
    // AudioContext resumes asynchronously; give it a beat before the first sounds
    setTimeout(() => {
      sfx.pop(1.1);
      sfx.sparkle(5);
    }, 60);
    setTimeout(() => sfx.boom(0.5), 520); // the seal bursts
    setTimeout(() => sfx.chime(1046.5), 1100); // the card slides out
    setTimeout(() => sfx.whoosh(1.0), 1700); // the iris sweep
    if (reduced) return onOpen();
    const seal = root.current!.querySelector(".seal")!.getBoundingClientRect();
    const at = `${seal.left + seal.width / 2}px ${seal.top + seal.height / 2}px`;
    gsap
      .timeline({ onComplete: onOpen })
      .to(".envelope", { rotateX: 0, rotateY: 0, duration: 0.4, ease: "power2.out" })
      .to(".seal", { scale: 1.3, duration: 0.15, ease: "power2.out" }, "<")
      .to(".seal", { scale: 0, rotate: 120, duration: 0.3, ease: "back.in(2)" })
      .fromTo(".burst", { x: 0, y: 0, scale: 0, autoAlpha: 1 }, {
        x: () => gsap.utils.random(-170, 170), y: () => gsap.utils.random(-200, 60), rotate: () => gsap.utils.random(-180, 180),
        scale: 1, duration: 0.8, ease: "power3.out", stagger: 0.015,
      }, "<0.1")
      .to(".burst", { autoAlpha: 0, duration: 0.4 }, ">-0.2")
      .to(".flap", { rotateX: 180, duration: 0.6, ease: "power2.inOut" }, "<-0.5")
      .set(".flap", { z: 0 }) // once open, the flap sits behind the card
      .to(".env-card", { yPercent: -62, duration: 0.7, ease: "back.out(1.4)" }, "-=0.2")
      .to(".gate-copy, .band, .orbit, .seal-hint", { autoAlpha: 0, duration: 0.4 }, "<")
      .fromTo(".gate-iris", { clipPath: `circle(0% at ${at})`, autoAlpha: 1 }, { clipPath: `circle(150% at ${at})`, duration: 0.8, ease: "power3.in" }, "+=0.35");
  };

  return (
    <main ref={root} className="gate">
      <Band className="band-a" />
      <Band className="band-b" reverse />

      <div className="gate-copy">
        <KineticLine className="gate-title" text={`${story.name}.`} letters />
      </div>

      <div className="env-stage">
        <div className="orbit" aria-hidden="true">
          {ORBIT.map((shape, i) => (
            <span key={i} className="orb" style={{ ["--a" as string]: `${(360 / ORBIT.length) * i}deg` }}>
              <svg viewBox="0 0 24 24" className={`orb-svg ${shape === "ring" ? "line" : ""}`}>{paths[shape]}</svg>
            </span>
          ))}
        </div>
        <div className="envelope-float">
          <div className="envelope">
            <div className="env-back" />
            <div className="env-card">
              <span className="script-text">Happy birthday!</span>
            </div>
            <div className="env-pocket">
              <span className="env-to">for swara.</span>
            </div>
            <div className="flap">
              <div className="flap-face front" />
              <div className="flap-face back" />
            </div>
            <button className="seal" onClick={open} aria-label="Open">
              <span>S</span>
            </button>
            {Array.from({ length: 14 }, (_, i) => (
              <svg key={i} viewBox="0 0 24 24" className="burst" aria-hidden="true">
                {paths[i % 3 === 0 ? "sparkle" : "heart"]}
              </svg>
            ))}
          </div>
        </div>
      </div>

      <div className="gate-copy">
        <KineticLine className="gate-sub" text="this is for you. no strings." />
        <p className="seal-hint">tap the seal ✦</p>
      </div>

      <div className="gate-iris" aria-hidden="true" />
    </main>
  );
}
