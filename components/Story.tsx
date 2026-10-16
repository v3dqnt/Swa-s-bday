"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Finale from "./Finale";
import KineticLine from "./KineticLine";
import { story, type Beat, type Cue, type Row } from "@/content/story";
import { scene } from "@/lib/scene";
import { soundtrack } from "@/lib/soundtrack";
import { useReducedMotion } from "@/lib/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const BASE = "#112409";

const chapters: { label: string; rows: Row[] }[] = [
  { label: "01 — hello.", rows: story.opening },
  { label: "02 — thank you.", rows: story.gratitude },
  { label: "03 — imagine.", rows: story.imagine },
];

// Section height in viewport units. Taller sections hold their line on screen longer.
function heightOf(b: Beat) {
  if (b.layout === "marquee") return 2.6;
  if (b.layout === "zoom") return 2.3;
  if (b.layout === "scatter") return 2.0;
  return b.style === "title" ? 2.2 : 1.7;
}
const rowHeight = (n: number) => n * 1.3 + 0.4;

const rand = (n: number) => () => gsap.utils.random(-n, n);

// Builds the scroll-scrubbed animation for one single-line section. The line is
// sticky, pinned between pinStart and pinEnd of the section's travel (0..1).
function animateBeat(sec: HTMLElement, reduced: boolean) {
  const h = Number(sec.dataset.h);
  const pinStart = 1 / (h + 1);
  const pinEnd = h / (h + 1);
  const line = sec.querySelector<HTMLElement>(".beat")!;
  const pieces = sec.querySelectorAll(".piece");
  const { layout, kind } = sec.dataset;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: reduced ? true : 0.6, invalidateOnRefresh: true },
  });
  const inAt = pinStart - 0.14;
  const outAt = pinEnd - 0.02;

  if (reduced) {
    tl.fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.1 }, pinStart - 0.1).to(line, { opacity: 0, duration: 0.1 }, pinEnd);
  } else if (layout === "zoom") {
    // Grows out of the distance, holds, then rushes past the camera.
    tl.fromTo(line, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: "power3.out" }, inAt)
      .to(line, { scale: 1.08, duration: outAt - inAt - 0.2, ease: "none" })
      .to(line, { scale: 9, opacity: 0, duration: 0.14, ease: "power2.in" }, outAt);
  } else if (layout === "scatter") {
    // Words fly in from all over and settle, then break apart again.
    tl.fromTo(
      pieces,
      { x: rand(180), y: rand(260), rotate: rand(50), opacity: 0 },
      { x: 0, y: 0, rotate: 0, opacity: 1, duration: 0.18, ease: "power3.out", stagger: { amount: 0.08, from: "random" } },
      inAt
    ).to(pieces, { x: rand(220), y: rand(300), rotate: rand(70), opacity: 0, duration: 0.14, ease: "power2.in", stagger: { amount: 0.05, from: "random" } }, outAt);
  } else if (layout === "marquee") {
    // One giant line travelling right to left across the pinned stretch.
    tl.fromTo(
      line,
      { x: () => innerWidth },
      { x: () => -line.scrollWidth, duration: pinEnd - pinStart + 0.2, ease: "none" },
      pinStart - 0.1
    );
  } else {
    if (kind === "title") {
      tl.fromTo(pieces, { yPercent: 120, rotate: 8 }, { yPercent: 0, rotate: 0, duration: 0.14, ease: "expo.out", stagger: { amount: 0.08 } }, inAt)
        .fromTo(line, { scale: 0.92 }, { scale: 1.04, duration: pinEnd - pinStart + 0.1, ease: "none" }, pinStart - 0.05)
        .to(pieces, { yPercent: -120, rotate: -6, duration: 0.12, ease: "expo.in", stagger: { amount: 0.06 } }, outAt);
    } else if (kind === "soft") {
      tl.fromTo(pieces, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.14, ease: "power2.out", stagger: { amount: 0.1 } }, inAt)
        .to(pieces, { opacity: 0, x: -24, duration: 0.12, ease: "power2.in", stagger: { amount: 0.06 } }, outAt);
    } else {
      tl.fromTo(pieces, { yPercent: 110 }, { yPercent: 0, duration: 0.14, ease: "power3.out", stagger: { amount: 0.1 } }, inAt)
        .to(pieces, { yPercent: -110, duration: 0.12, ease: "power3.in", stagger: { amount: 0.06 } }, outAt);
    }
    // Off-centre lines drift against the scroll for a little parallax.
    if (layout === "left" || layout === "right") {
      const dir = layout === "left" ? 1 : -1;
      tl.fromTo(line, { x: -40 * dir }, { x: 40 * dir, duration: 1, ease: "none" }, 0);
    }
  }
  tl.set({}, {}, 1);
}

// A run of lines laid out side by side; vertical scroll moves the track sideways.
function animateRow(sec: HTMLElement, reduced: boolean) {
  const panels = gsap.utils.toArray<HTMLElement>(sec.querySelectorAll(".panel"));
  const n = panels.length;
  const h = rowHeight(n);
  const pinStart = 1 / (h + 1);
  const pinEnd = h / (h + 1);
  const moveStart = pinStart + 0.06;
  const moveEnd = pinEnd - 0.08;
  const seg = (moveEnd - moveStart) / (n - 1);
  const tl = gsap.timeline({
    scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: reduced ? true : 0.6 },
  });

  panels.forEach((panel, i) => {
    const pieces = panel.querySelectorAll(".piece");
    const arrive = i === 0 ? pinStart : moveStart + i * seg;
    const at = i === 0 ? pinStart - 0.12 : arrive - seg * 0.55;
    if (reduced) tl.fromTo(pieces, { opacity: 0 }, { opacity: 1, duration: 0.08 }, at);
    else tl.fromTo(pieces, { yPercent: 115 }, { yPercent: 0, duration: Math.min(0.14, seg * 0.45), ease: "power3.out", stagger: { amount: 0.06 } }, at);
  });
  for (let i = 1; i < n; i++) {
    tl.to(sec.querySelector(".track"), { xPercent: (-100 * i) / n, duration: seg, ease: "power2.inOut" }, moveStart + (i - 1) * seg);
  }
  const last = panels[n - 1].querySelectorAll(".piece");
  if (reduced) tl.to(last, { opacity: 0, duration: 0.08 }, pinEnd);
  else tl.to(last, { yPercent: -115, duration: 0.12, ease: "power3.in", stagger: { amount: 0.05 } }, pinEnd - 0.02);
  tl.set({}, {}, 1);
}

function BeatSection({ b, hint }: { b: Beat; hint?: boolean }) {
  const h = heightOf(b);
  const layout = b.layout ?? "center";
  return (
    <section
      className={`beat-sec layout-${layout}`}
      data-h={h}
      data-layout={layout}
      data-kind={b.style ?? "line"}
      data-tone={b.tone}
      data-cue={b.cue}
      style={{ height: `${h * 100}svh` }}
    >
      <div className="sticky">
        <KineticLine className={`beat ${b.style ?? ""}`} text={b.text} letters={b.style === "title" && layout !== "zoom"} />
        {hint && <span className="hint">scroll slowly</span>}
      </div>
    </section>
  );
}

function RowSection({ beats, tone, cue }: { beats: Beat[]; tone?: string; cue?: Cue }) {
  return (
    <section className="row-sec" data-tone={tone} data-cue={cue} style={{ height: `${rowHeight(beats.length) * 100}svh` }}>
      <div className="sticky">
        <div className="track" style={{ width: `${beats.length * 100}%` }}>
          {beats.map((b, i) => (
            <div key={i} className="panel">
              <KineticLine className={`beat ${b.style ?? ""}`} text={b.text} />
              <span className="panel-count">{`${i + 1}/${beats.length}`}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// The whole story as one long scroll, varied section by section: words rising from
// masks, lines zooming past, scattering, sliding as a marquee or sideways in rows,
// while the background shifts shade with what is being said.
export default function Story() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [muted, setMuted] = useState(soundtrack.muted);

  useEffect(() => {
    window.scrollTo(0, 0);
    const lenis = reduced ? null : new Lenis({ lerp: 0.075, wheelMultiplier: 0.8 });
    lenis?.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".beat-sec").forEach((sec) => animateBeat(sec, reduced));
      gsap.utils.toArray<HTMLElement>(".row-sec").forEach((sec) => animateRow(sec, reduced));

      // Background shade follows whichever section holds the middle of the screen.
      const setTone = (c: string) => gsap.to(document.body, { backgroundColor: c, duration: 1.4, ease: "power2.out", overwrite: "auto" });
      gsap.utils.toArray<HTMLElement>("[data-tone]").forEach((sec) =>
        ScrollTrigger.create({
          trigger: sec,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (s) => s.isActive && setTone(sec.dataset.tone!),
        })
      );

      // Soundtrack: every cue she has scrolled past (mid-screen) is "passed";
      // the record plays the latest one it has a track for. Scrolling back reverts.
      let cues: { cue: Cue; st: ScrollTrigger }[] = [];
      const followCues = () => soundtrack.follow(cues.filter((c) => c.st.isActive).map((c) => c.cue));
      cues = gsap.utils.toArray<HTMLElement>("[data-cue]").map((el) => ({
        cue: el.dataset.cue as Cue,
        st: ScrollTrigger.create({ trigger: el, start: "top 50%", end: "max", onToggle: followCues }),
      }));

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
      document.body.style.backgroundColor = "";
      Object.assign(scene, { finale: 0, finaleActive: false });
    };
  }, [reduced]);

  return (
    <div ref={root} className="story">
      <div className="hud">
        <span ref={label}>{chapters[0].label}</span>
        {soundtrack.active ? (
          <button
            className="sound"
            onClick={() => {
              soundtrack.setMuted(!muted);
              setMuted(!muted);
            }}
          >
            {muted ? "sound off." : "sound on."}
          </button>
        ) : (
          <span>for swara.</span>
        )}
      </div>
      <div className="progress" />
      {chapters.map((ch, c) => (
        <div key={c} className="chapter" data-label={ch.label}>
          {ch.rows.map((r, i) =>
            "row" in r ? (
              <RowSection key={i} beats={r.row} tone={r.tone} cue={r.cue} />
            ) : (
              <BeatSection key={i} b={r} hint={c === 0 && i === 0} />
            )
          )}
          <div className="breath" />
        </div>
      ))}
      <section className="finale-sec" data-label="04 — happy birthday." data-tone={BASE}>
        <div className="sticky">
          <Finale />
        </div>
      </section>
    </div>
  );
}
