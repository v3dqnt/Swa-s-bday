"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Finale from "./Finale";
import KineticLine from "./KineticLine";
import { story } from "@/content/story";
import { scene } from "@/lib/scene";
import { useReducedMotion } from "@/lib/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

type Beat = { text: string; style?: "title" | "soft" };

// Section height in viewport units. Taller sections hold their line on screen longer.
const heightOf = (b: Beat) => (b.style === "title" ? 2.2 : 1.7);

const chapters: { label: string; beats: Beat[] }[] = [
  { label: "01 — hello.", beats: story.opening },
  { label: "02 — thank you.", beats: story.gratitude },
  { label: "03 — imagine.", beats: story.imagine },
];

// The whole story as one long scroll. Each line pins mid-screen while its section
// passes; its words (or letters, for titles) slide out of masks, scrubbed by scroll.
export default function Story() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
    const lenis = reduced ? null : new Lenis({ lerp: 0.075, wheelMultiplier: 0.8 });
    lenis?.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".beat-sec").forEach((sec) => {
        // A sticky line is pinned between these two points of its section's travel.
        const h = Number(sec.dataset.h);
        const pinStart = 1 / (h + 1);
        const pinEnd = h / (h + 1);
        const pieces = sec.querySelectorAll(".piece");
        const kind = sec.dataset.kind;
        const tl = gsap.timeline({
          scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: reduced ? true : 0.6 },
        });

        if (reduced) {
          tl.fromTo(pieces, { opacity: 0 }, { opacity: 1, duration: 0.1 }, pinStart - 0.1)
            .to(pieces, { opacity: 0, duration: 0.1 }, pinEnd);
        } else if (kind === "title") {
          tl.fromTo(
            pieces,
            { yPercent: 120, rotate: 8 },
            { yPercent: 0, rotate: 0, duration: 0.14, ease: "expo.out", stagger: { amount: 0.08 } },
            pinStart - 0.14
          )
            .fromTo(sec.querySelector(".beat"), { scale: 0.92 }, { scale: 1.04, duration: pinEnd - pinStart + 0.1, ease: "none" }, pinStart - 0.05)
            .to(pieces, { yPercent: -120, rotate: -6, duration: 0.12, ease: "expo.in", stagger: { amount: 0.06 } }, pinEnd - 0.02);
        } else if (kind === "soft") {
          tl.fromTo(
            pieces,
            { opacity: 0, x: 24 },
            { opacity: 1, x: 0, duration: 0.14, ease: "power2.out", stagger: { amount: 0.1 } },
            pinStart - 0.14
          ).to(pieces, { opacity: 0, x: -24, duration: 0.12, ease: "power2.in", stagger: { amount: 0.06 } }, pinEnd - 0.02);
        } else {
          tl.fromTo(
            pieces,
            { yPercent: 110 },
            { yPercent: 0, duration: 0.14, ease: "power3.out", stagger: { amount: 0.1 } },
            pinStart - 0.14
          ).to(pieces, { yPercent: -110, duration: 0.12, ease: "power3.in", stagger: { amount: 0.06 } }, pinEnd - 0.02);
        }
        tl.set({}, {}, 1);
      });

      gsap.utils.toArray<HTMLElement>(".chapter, .finale-sec").forEach((ch) =>
        ScrollTrigger.create({
          trigger: ch,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (s) => s.isActive && label.current && (label.current.textContent = ch.dataset.label ?? ""),
        })
      );

      gsap.fromTo(".progress", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });

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
        .timeline({ scrollTrigger: { trigger: fin, start: "top top", end: "bottom bottom", scrub: 0.6 } })
        .fromTo(".duo", { opacity: 0, y: 48 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.05)
        .fromTo(".finale-caption .piece", { yPercent: 115 }, { yPercent: 0, duration: 0.25, ease: "expo.out", stagger: { amount: 0.08 } }, 0.45)
        .set({}, {}, 1);
    }, root);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis?.destroy();
      Object.assign(scene, { finale: 0, finaleActive: false });
    };
  }, [reduced]);

  return (
    <div ref={root} className="story">
      <div className="hud">
        <span ref={label}>{chapters[0].label}</span>
        <span>for swara.</span>
      </div>
      <div className="progress" />
      {chapters.map((ch, c) => (
        <div key={c} className="chapter" data-label={ch.label}>
          {ch.beats.map((b, i) => (
            <section
              key={i}
              className="beat-sec"
              data-h={heightOf(b)}
              data-kind={b.style ?? "line"}
              style={{ height: `${heightOf(b) * 100}svh` }}
            >
              <div className="sticky">
                <KineticLine className={`beat ${b.style ?? ""}`} text={b.text} letters={b.style === "title"} />
                {c === 0 && i === 0 && <span className="hint">scroll slowly</span>}
              </div>
            </section>
          ))}
          <div className="breath" />
        </div>
      ))}
      <section className="finale-sec" data-label="04 — happy birthday.">
        <div className="sticky">
          <Finale />
        </div>
      </section>
    </div>
  );
}
