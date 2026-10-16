"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Finale from "./Finale";
import { story } from "@/content/story";
import { scene } from "@/lib/scene";
import { useReducedMotion } from "@/lib/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

type Beat = { text: string; style?: "title" | "soft" };

// Section height in viewport units. Taller sections hold their line on screen longer.
const heightOf = (b: Beat) => (b.style === "title" ? 2.2 : 1.7);

const chapters: Beat[][] = [story.opening, story.gratitude, story.imagine];

// The whole story as one long scroll. Each line pins in the middle of the screen
// while its section passes, fading in from a blur and out again, all scrubbed by scroll.
export default function Story() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
    const lenis = reduced ? null : new Lenis({ lerp: 0.075, wheelMultiplier: 0.8 });
    lenis?.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const hidden = reduced ? { opacity: 0 } : { opacity: 0, y: 36, filter: "blur(12px)" };
      const shown = reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" };
      const gone = reduced ? { opacity: 0 } : { opacity: 0, y: -28, filter: "blur(8px)" };

      gsap.utils.toArray<HTMLElement>(".beat-sec").forEach((sec) => {
        // A sticky line is pinned between these two points of its section's travel.
        const h = Number(sec.dataset.h);
        const pinStart = 1 / (h + 1);
        const pinEnd = h / (h + 1);
        const line = sec.querySelector(".beat");
        gsap
          .timeline({ scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true } })
          .fromTo(line, hidden, { ...shown, duration: 0.16, ease: "power2.out" }, pinStart - 0.12)
          .to(line, { ...gone, duration: 0.16, ease: "power1.in" }, pinEnd - 0.04)
          .set({}, {}, 1);
      });

      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (s) => (scene.progress = s.progress),
      });

      const fin = ".finale-sec";
      ScrollTrigger.create({
        trigger: fin,
        start: "top bottom",
        end: "bottom top",
        onToggle: (s) => (scene.finaleActive = s.isActive),
      });
      ScrollTrigger.create({
        trigger: fin,
        start: "top 85%",
        end: "top top",
        onUpdate: (s) => (scene.finale = s.progress),
      });
      gsap
        .timeline({ scrollTrigger: { trigger: fin, start: "top top", end: "bottom bottom", scrub: true } })
        .fromTo(".duo", { opacity: 0, y: 48 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.05)
        .fromTo(".finale-caption", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25 }, 0.45)
        .set({}, {}, 1);
    }, root);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis?.destroy();
      Object.assign(scene, { progress: 0, finale: 0, finaleActive: false });
    };
  }, [reduced]);

  return (
    <div ref={root} className="story">
      <div className="bar top" />
      <div className="bar bottom" />
      {chapters.map((beats, c) => (
        <div key={c} className="chapter">
          {beats.map((b, i) => (
            <section key={i} className="beat-sec" data-h={heightOf(b)} style={{ height: `${heightOf(b) * 100}svh` }}>
              <div className="sticky">
                <p className={`beat ${b.style ?? ""}`}>{b.text}</p>
                {c === 0 && i === 0 && <span className="hint">scroll slowly</span>}
              </div>
            </section>
          ))}
          <div className="breath" />
        </div>
      ))}
      <section className="finale-sec">
        <div className="sticky">
          <Finale />
        </div>
      </section>
    </div>
  );
}
