"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { measureFrame } from "@/lib/frame";

const Backdrop = dynamic(() => import("./Backdrop"), { ssr: false });

const HEART = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const UNITS = [
  ["days", 86400],
  ["hours", 3600],
  ["minutes", 60],
  ["seconds", 1],
] as const;

function split(ms: number) {
  let s = Math.max(0, Math.floor(ms / 1000));
  return UNITS.map(([label, size]) => {
    const v = Math.floor(s / size);
    s -= v * size;
    return [label, String(v).padStart(2, "0")] as const;
  });
}

// Each digit sits in a window; when it changes, the old digit rolls up and out as
// the new one rolls in. Keyed by the new value so re-renders don't restart the roll.
function Digits({ value }: { value: string }) {
  const [pair, setPair] = useState({ from: value, to: value });
  if (value !== pair.to) setPair({ from: pair.to, to: value });
  return (
    <span className="cnt-digits">
      {pair.to.split("").map((d, i) => {
        const was = pair.from[i] ?? d;
        return (
          <span key={i} className="cnt-slot">
            {was === d ? (
              <span className="cnt-roll">
                <span>{d}</span>
              </span>
            ) : (
              <span key={pair.to} className="cnt-roll rolling">
                <span>{was}</span>
                <span>{d}</span>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** The locked gate before her birthday: a live countdown, then the page reloads into the story. */
export default function Countdown({ unlockAt, serverNow }: { unlockAt: number; serverNow: number }) {
  // Count against the server's clock (a wrong phone clock can't skew it), starting
  // from the server-rendered value so hydration matches.
  const [left, setLeft] = useState(unlockAt - serverNow);

  useEffect(() => {
    measureFrame();
    const skew = serverNow - Date.now();
    const tick = () => setLeft(unlockAt - (Date.now() + skew));
    tick();
    const id = setInterval(tick, 250);
    const onResize = () => measureFrame();
    addEventListener("resize", onResize);
    return () => {
      clearInterval(id);
      removeEventListener("resize", onResize);
    };
  }, [unlockAt, serverNow]);

  const open = left <= 0;
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => location.reload(), 1800); // the server now serves the story
    return () => clearTimeout(t);
  }, [open]);

  return (
    <>
      <Backdrop />
      <main className="countdown" aria-live="polite">
        <p className="cnt-for">for swara.</p>
        <svg className="cnt-heart" viewBox="0 0 24 24" aria-hidden="true">
          <path d={HEART} />
        </svg>
        {open ? (
          <h1 className="cnt-title">it&rsquo;s time.</h1>
        ) : (
          <>
            <h1 className="cnt-title">something&rsquo;s waiting for you.</h1>
            <div className="cnt-grid" role="timer">
              {split(left).map(([label, value]) => (
                <div key={label} className="cnt-unit">
                  <Digits value={value} />
                  <span className="cnt-label">{label}</span>
                </div>
              ))}
            </div>
            <p className="cnt-note script-text">opens on the 1st of November</p>
          </>
        )}
      </main>
      <div className="film" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  );
}
