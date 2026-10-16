"use client";
import type { Experience } from "@/content/music";

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

// Skeuomorphic brushed-silver turntable built as a real CSS 3D box: the top plate
// with raised platter, knob and tonearm, plus four silver side panels and a base,
// so the camera can orbit it and see its thickness.
export default function Deck({ record }: { record: Experience | null | undefined }) {
  const playing = !!record;
  return (
    <div className="deck">
      <div className="face front" />
      <div className="face back" />
      <div className="face left" />
      <div className="face right" />
      <div className="face bottom" />
      <div className="deck-brush" />
      <div className="foot fl" />
      <div className="foot fr" />
      <div className="platter">
        <div className="strobe" />
        <div className="mat" />
        {record && (
          <div key={record.id} className={`vinyl ${playing ? "spin" : ""}`} style={{ ["--label" as string]: record.label }}>
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
  );
}
