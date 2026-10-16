"use client";
import type { Experience } from "@/content/music";

// A green painted wooden crate, built as a CSS 3D box (open top), with a CD jewel
// case standing upright inside for every record. Cases poke up above the rim and
// lift on hover; tapping one picks that record. Lives in the same 3D world as the
// turntable, tilted so you look down into it.
export default function Crate({
  records,
  picked,
  onPick,
}: {
  records: Experience[];
  picked: string | null | undefined;
  onPick: (r: Experience, el: HTMLElement) => void;
}) {
  return (
    <div className="crate3d">
      <div className="crate-body">
        <div className="cface c-floor" />
        <div className="cface c-back" />
        <div className="cface c-left" />
        <div className="cface c-right" />
        {records.map((r, k) => {
          // front-to-back rows, slightly staggered and leaning like real cases in a box
          const n = records.length;
          const z = 40 - k * 28;
          const x = (k - (n - 1) / 2) * 64; // fanned sideways so every cover shows
          const lean = -6 - k * 2;
          return (
            <button
              key={r.id}
              className={`cd ${picked === r.id ? "picked" : ""}`}
              style={{ ["--z" as string]: `${z}px`, ["--x" as string]: `${x}px`, ["--lean" as string]: `${lean}deg` }}
              aria-pressed={picked === r.id}
              aria-label={`${r.title} ${r.note}`}
              onClick={(e) => onPick(r, e.currentTarget)}
            >
              <span className="cd-body">
                <span className="cd-spine" style={{ background: r.sleeve }} />
                <span className="cd-front" style={{ background: r.sleeve, color: r.ink }}>
                  <span className="cd-art" style={{ ["--label" as string]: r.label }} />
                  <span className="cd-title">{r.title}</span>
                  <span className="cd-note">{r.note}</span>
                  <span className="cd-glare" />
                </span>
              </span>
            </button>
          );
        })}
        <div className="cface c-front">
          <span>for swara.</span>
        </div>
      </div>
    </div>
  );
}
