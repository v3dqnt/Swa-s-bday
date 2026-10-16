"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import Backdrop from "./Backdrop";
import Deck from "./Deck";
import Finale from "./Finale";
import KineticLine from "./KineticLine";
import Decor from "./Decor";
import { WIPES, arrival, fxFor, playWipe, punch } from "@/lib/mograph";
import { story, type Cue } from "@/content/story";
import { experiences, type Experience } from "@/content/music";
import { soundtrack } from "@/lib/soundtrack";
import { scene } from "@/lib/scene";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  FINALE_LEN,
  ORIGIN,
  PERSPECTIVE,
  buildTimeline,
  itemTransform,
  layoutShots,
  sample,
  worldTransform,
  type Pose,
  type Segment,
} from "@/lib/camera";

const BASE = "#112409";
const LABELS = ["01 — hello.", "02 — thank you.", "03 — imagine."];
const FINALE_LABEL = "04 — happy birthday.";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];

// The whole experience as one 2.5D world. It opens on the silver turntable, where
// she picks a record. Once she begins, scrolling flies a camera: first orbiting the
// turntable to show it is a real object, then on to each line of the story, which
// sit at different places and angles in space.
export default function World() {
  const reduced = useReducedMotion();
  const shots = useMemo(() => layoutShots([story.opening, story.gratitude, story.imagine]), []);
  const [record, setRecord] = useState<Experience | null | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [spacer, setSpacer] = useState(0);

  const root = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const deckItem = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const label = useRef<HTMLSpanElement>(null);
  const timeline = useRef<{ segs: Segment[]; total: number; finaleStart: number; windows: [number, number][] } | null>(null);
  const arrivals = useRef<gsap.core.Timeline[]>([]);
  const vh = useRef(1);

  // Picker entrance.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.15 })
        .from(".picker-title .piece", { yPercent: 115, duration: 1, ease: "expo.out", stagger: 0.06 })
        .from(".deck-in", { y: 90, opacity: 0, duration: 1.2, ease: "expo.out" }, "-=0.7")
        .from(".picker-bottom > *", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, clearProps: "opacity,transform" }, "-=0.8");
    }, root);
    return () => ctx.revert();
  }, []);

  // Drop the record onto the platter whenever a new one is chosen.
  useEffect(() => {
    if (record) gsap.fromTo(".vinyl", { scale: 1.12, y: -18, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.7, ease: "bounce.out" });
  }, [record]);

  // Measure text, set up anamorphic "scatter" words, and build the camera timeline.
  useEffect(() => {
    const build = () => {
      vh.current = innerHeight;
      const widths = items.current.map((el) => el?.offsetWidth ?? 0);
      items.current.forEach((el, i) => {
        if (!el || shots[i].kind !== "scatter") return;
        // Each word sits at its own depth, scaled so that from the exact viewpoint the
        // line reads normally; from anywhere else it breaks apart in parallax.
        const line = el.querySelector<HTMLElement>(".beat")!;
        const W = line.offsetWidth;
        const H = line.offsetHeight;
        line.querySelectorAll<HTMLElement>(".piece").forEach((p, k) => {
          const r = Math.abs(Math.sin(k * 91.7 + i * 13.3) * 43758.5453) % 1;
          const dz = -700 + r * 950;
          const s = (PERSPECTIVE - dz) / PERSPECTIVE;
          // offsetLeft/Top are relative to the nearest 3D ancestor, so sum up to the line.
          let x = 0;
          let y = 0;
          for (let e: HTMLElement | null = p; e && e !== line; e = e.offsetParent as HTMLElement | null) {
            x += e.offsetLeft;
            y += e.offsetTop;
          }
          const cx = x + p.offsetWidth / 2 - W / 2;
          const cy = y + p.offsetHeight / 2 - H / 2;
          p.style.transform = `translate3d(${cx * (s - 1)}px, ${cy * (s - 1)}px, ${dz}px) scale(${s})`;
        });
      });
      const tl = buildTimeline(shots, widths);
      // Each line is "on stage" from just past the middle of the flight towards it
      // until just before the middle of the flight away from it.
      const travels = tl.segs.filter((g) => g.travel && g.shot >= 0);
      const windows = shots.map((_, i): [number, number] => {
        const a = travels.find((g) => g.shot === i)!;
        const b = travels.find((g) => g.shot === i + 1)!;
        return [a.start + a.len * 0.55, b.start + b.len * 0.45];
      });
      timeline.current = { ...tl, windows };
      setSpacer((timeline.current.total + 1) * innerHeight);
    };
    build();
    document.fonts?.ready.then(build);
    addEventListener("resize", build);
    return () => removeEventListener("resize", build);
  }, [shots]);

  // Edit-style entrance for every line (paused; played as the camera arrives).
  useEffect(() => {
    const ctx = gsap.context(() => {
      arrivals.current = items.current.map((el, i) => arrival(el!, fxFor(shots[i], i)));
    }, root);
    return () => ctx.revert();
  }, [shots]);

  // Smooth scrolling once the story begins.
  useEffect(() => {
    if (!started) return;
    window.scrollTo(0, 0);
    if (reduced) return;
    const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.7, syncTouch: true });
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [started, reduced]);

  // The camera loop: scroll position → camera pose → world transform, plus fog,
  // background tone, chapter label, soundtrack cues and the finale handoff.
  useEffect(() => {
    let current = -2;
    const onStage = shots.map(() => false);
    const finaleEl = root.current!.querySelector<HTMLElement>(".finale-layer")!;

    // Opacity flattens 3D in Chrome, so items that must stay 3D (the deck, the
    // depth-scattered words) fade their flat leaves instead of themselves.
    const fadeTargets = new Map<HTMLElement, HTMLElement[]>();
    const targetsOf = (el: HTMLElement) => {
      let t = fadeTargets.get(el);
      if (!t) {
        t =
          el === deckItem.current ? []
          : el.classList.contains("kind-scatter") ? [...el.querySelectorAll<HTMLElement>(".piece")]
          : ([...el.children] as HTMLElement[]); // the line, its underline and each garnish
        fadeTargets.set(el, t);
      }
      return t;
    };
    const fog = (el: HTMLElement, p: Pose, m: DOMMatrix, far: number) => {
      const q = m.transformPoint(new DOMPoint(p.x, p.y, p.z));
      const d = PERSPECTIVE - q.z; // distance from the eye, along the view axis
      const o = d < 200 ? 0 : clamp01((d - 220) / 380) * clamp01(1 - (d - far) / 1000);
      const vis = o === 0 ? "hidden" : "visible";
      if (el.style.visibility !== vis) el.style.visibility = vis;
      const v = o.toFixed(3);
      for (const t of targetsOf(el)) if (t.style.opacity !== v) t.style.opacity = v;
    };

    const update = () => {
      const tl = timeline.current;
      const w = world.current;
      if (!tl || !w) return;
      const s = started ? scrollY / vh.current : 0;
      const { pose, seg, u } = sample(tl.segs, s, reduced);
      const t = worldTransform(pose);
      w.style.transform = t;
      scene.camYaw = pose.ry;
      scene.camPitch = pose.rx;
      w.style.opacity = reduced && seg.travel && started ? Math.abs(1 - 2 * u).toFixed(3) : "1";

      const m = new DOMMatrix(t);
      shots.forEach((sh, i) => {
        const el = items.current[i];
        if (el) fog(el, sh.pose, m, !started ? -1e4 : sh.kind === "zoom" ? 2450 : sh.kind === "marquee" ? 2800 : 2300);
      });
      if (deckItem.current) fog(deckItem.current, ORIGIN, m, 3400);

      // Play each line's entrance as it comes on stage; rewind it as it leaves.
      shots.forEach((_, i) => {
        const [a, b] = tl.windows[i];
        const on = started && s >= a && s < b;
        if (on === onStage[i]) return;
        onStage[i] = on;
        const anim = arrivals.current[i];
        if (!anim) return;
        if (reduced) anim.progress(on ? 1 : 0);
        else if (on) anim.timeScale(1).play();
        else anim.timeScale(2.2).reverse();
      });

      // Which line has she reached? (past the midpoint of the flight towards it)
      let reached = -1;
      for (const g of tl.segs) if (g.travel && g.shot >= 0 && g.start + g.len * 0.5 <= s) reached = Math.max(reached, g.shot);
      if (reached !== current) {
        const forward = reached > current && current > -2;
        current = reached;
        // Cut-style flourishes when moving forward: mask wipes at chapter changes
        // and every few lines, and a zoom kick when a title lands.
        const sh = shots[reached];
        if (forward && sh && !reduced) {
          const prev = shots[reached - 1];
          const newChapter = prev && prev.chapter !== sh.chapter;
          if (reached > 0 && (newChapter || reached % 5 === 0)) playWipe(WIPES[Math.floor(reached / 5) % WIPES.length]);
          if (sh.beat.style === "title") punch();
        }
        const inFinale = reached >= shots.length;
        const tone = inFinale || reached < 0 ? BASE : shots[reached].tone ?? BASE;
        gsap.to(document.body, { backgroundColor: tone, duration: 1.4, ease: "power2.out", overwrite: "auto" });
        scene.tone = rgb(tone);
        scene.world = inFinale ? "city" : reached < 0 ? "abstract" : shots[reached].scene;
        if (label.current) label.current.textContent = inFinale ? FINALE_LABEL : LABELS[Math.max(0, shots[reached]?.chapter ?? 0)];
        const passed = shots.slice(0, reached + 1).flatMap((sh) => (sh.cue ? [sh.cue] : [])) as Cue[];
        soundtrack.follow(inFinale ? [...passed, "finale"] : passed.length ? passed : ["hello"]);
      }

      // Finale: the night scene takes over the screen.
      const q = s - tl.finaleStart;
      scene.finaleActive = q > -0.2;
      scene.finale = clamp01(q / 1.2);
      finaleEl.style.opacity = clamp01(q / 0.4).toFixed(3);
      finaleEl.style.visibility = q > 0 ? "visible" : "hidden";
      const f = q / FINALE_LEN;
      const duo = clamp01((f - 0.3) / 0.25);
      gsap.set(".duo", { opacity: duo, y: 48 * (1 - duo) });
      const cap = clamp01((f - 0.6) / 0.2);
      gsap.set(".finale-caption .piece", { yPercent: 115 * (1 - cap * (2 - cap)) });

      gsap.set(".progress", { scaleX: clamp01(s / tl.total) });
      gsap.set(".hint", { opacity: started ? clamp01(1 - s / 0.15) : 0 });
    };

    gsap.ticker.add(update);
    return () => {
      gsap.ticker.remove(update);
      document.body.style.backgroundColor = "";
      Object.assign(scene, { finale: 0, finaleActive: false });
    };
  }, [started, reduced, shots]);

  const choose = (r: Experience | null) => {
    setRecord(r);
    soundtrack.select(r); // this tap is the gesture that unlocks audio
  };

  const begin = () =>
    gsap.to(".picker", { opacity: 0, y: 24, duration: 0.7, ease: "power2.in", onComplete: () => setStarted(true) });

  return (
    <div ref={root} className="world-root">
      <Backdrop />
      <div className="stage">
        <div ref={world} className="world">
          <div ref={deckItem} className="item" style={{ transform: itemTransform(ORIGIN) }}>
            <div className="deck-in">
              <Deck record={record} />
            </div>
          </div>
          {shots.map((sh, i) => (
            <div
              key={i}
              ref={(el) => {
                items.current[i] = el;
              }}
              className={`item kind-${sh.kind} fx-${fxFor(sh, i)}`}
              style={{ transform: itemTransform(sh.pose), visibility: "hidden" }}
            >
              <KineticLine className={`beat ${sh.beat.style ?? ""}`} text={sh.beat.text} letters={fxFor(sh, i) === "letters"} />
              {sh.beat.style === "title" && <span className="underline" />}
              <Decor shot={sh} index={i} />
            </div>
          ))}
        </div>
      </div>

      <div className="wipes" aria-hidden="true">
        <div className="wipe-iris" />
        <div className="wipe-iris2" />
        <div className="wipe-bars">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="wipe-bar" />
          ))}
        </div>
        <svg className="wipe-heart" viewBox="0 0 24 24">
          <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.6.7-1.4 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" />
        </svg>
        <div className="wipe-diag" />
      </div>

      <div className="finale-layer">
        <Finale />
      </div>

      {!started ? (
        <div className="picker">
          <div className="picker-top">
            <KineticLine className="picker-title" text="pick a record." />
            <p className="picker-sub">each one is a soundtrack that changes as you read.</p>
          </div>
          <div className="picker-bottom">
            <div className="crate" role="radiogroup" aria-label="records">
              {experiences.map((r) => (
                <button
                  key={r.id}
                  role="radio"
                  aria-checked={record?.id === r.id}
                  className={`sleeve ${record?.id === r.id ? "picked" : ""}`}
                  style={{ ["--sleeve" as string]: r.sleeve, ["--label" as string]: r.label, color: r.ink }}
                  onClick={() => choose(r)}
                >
                  <span className="sleeve-disc" />
                  <span className="sleeve-title">{r.title}</span>
                  <span className="sleeve-note">{r.note}</span>
                </button>
              ))}
            </div>
            <button className={`silence ${record === null ? "picked" : ""}`} onClick={() => choose(null)}>
              no music, just words.
            </button>
            <button className="begin" disabled={record === undefined} onClick={begin}>
              begin.
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="hud">
            <span ref={label}>{LABELS[0]}</span>
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
          <span className="hint">scroll slowly</span>
          <div style={{ height: spacer }} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
