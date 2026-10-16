"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import KineticLine from "./KineticLine";
import { experiences, type Experience } from "@/content/music";
import { soundtrack } from "@/lib/soundtrack";

// Silver tonearm drawn in deck coordinates (500 × 400). It pivots at (400, 70);
// resting it clears the platter, and rotated 22° the stylus lands in the grooves.
function Tonearm({ playing }: { playing: boolean }) {
  return (
    <svg className="arm-layer" viewBox="0 0 500 400" aria-hidden="true">
      <defs>
        <linearGradient id="silver" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fbfcfd" />
          <stop offset="0.45" stopColor="#a8acb1" />
          <stop offset="0.7" stopColor="#eceef0" />
          <stop offset="1" stopColor="#8d9196" />
        </linearGradient>
        <radialGradient id="base" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#bfc3c7" />
          <stop offset="1" stopColor="#6f7378" />
        </radialGradient>
      </defs>
      <circle cx="400" cy="70" r="30" fill="#7b7f84" opacity="0.35" transform="translate(3 5)" />
      <circle cx="400" cy="70" r="28" fill="url(#base)" stroke="#8a8e93" />
      <g className={`arm ${playing ? "on" : ""}`}>
        <rect x="390" y="18" width="20" height="26" rx="4" fill="url(#silver)" stroke="#7d8186" />
        <path d="M400 70 L386 296 L342 330" fill="none" stroke="#6d7176" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M400 70 L386 296 L342 330" fill="none" stroke="url(#silver)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M399 74 L386 290" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
        <path d="M330 320 L356 314 L362 334 L336 342 Z" fill="#2b2d30" stroke="#55585c" />
        <circle cx="400" cy="70" r="11" fill="url(#silver)" stroke="#7d8186" />
      </g>
    </svg>
  );
}

// Skeuomorphic brushed-silver turntable. She picks a record (a soundtrack that
// changes as she reads), or chooses silence, then begins.
export default function RecordPlayer({ onBegin }: { onBegin: () => void }) {
  const root = useRef<HTMLElement>(null);
  const [record, setRecord] = useState<Experience | null | undefined>(undefined);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.15 })
        .from(".player-title .piece", { yPercent: 115, duration: 1, ease: "expo.out", stagger: 0.06 })
        .from(".deck", { y: 60, opacity: 0, rotateX: 18, duration: 1.2, ease: "expo.out" }, "-=0.7")
        .from(".crate, .silence, .begin", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, clearProps: "opacity,transform" }, "-=0.8");
    }, root);
    return () => ctx.revert();
  }, []);

  const choose = (r: Experience | null) => {
    setRecord(r);
    soundtrack.select(r); // this tap is the gesture that unlocks audio
    if (r) gsap.fromTo(".vinyl", { scale: 1.12, y: -18, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.7, ease: "bounce.out" });
  };

  const playing = !!record;

  return (
    <main ref={root} className="player">
      <KineticLine className="player-title" text="pick a record." />
      <p className="player-sub">each one is a soundtrack that changes as you read.</p>

      <div className="deck">
        <div className="deck-brush" />
        <div className="platter">
          <div className="strobe" />
          <div className="mat" />
          {record && (
            <div className={`vinyl ${playing ? "spin" : ""}`} style={{ ["--label" as string]: record.label }}>
              <div className="label">
                <span>{record.title}</span>
              </div>
            </div>
          )}
          <div className="sheen" />
          <div className="spindle" />
        </div>
        <Tonearm playing={playing} />
        <div className="knob" />
        <div className={`led ${playing ? "on" : ""}`} />
        <span className="speed">33⅓</span>
      </div>

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

      <button className="begin" disabled={record === undefined} onClick={onBegin}>
        begin.
      </button>
    </main>
  );
}
