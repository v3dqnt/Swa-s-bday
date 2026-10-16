import type { Shot } from "@/lib/camera";
import { plain } from "./KineticLine";

// Light-green motion-graphics garnish that pops in around a line when the camera
// arrives: hearts, stars, sparkles, rings, squiggles and confetti. Each piece sits
// at its own depth inside the line's 3D item, so it parallaxes as the camera moves.

type Shape = "heart" | "star" | "sparkle" | "ring" | "squiggle" | "dot";

const paths: Record<Shape, React.ReactNode> = {
  heart: <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.6.7-1.4 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" />,
  star: <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z" />,
  sparkle: <path d="M12 1.5c.8 5.6 3.9 9.7 10.5 10.5-6.6.8-9.7 4.9-10.5 10.5C11.2 16.9 8.1 12.8 1.5 12c6.6-.8 9.7-4.9 10.5-10.5z" />,
  ring: <circle cx="12" cy="12" r="8.5" fill="none" strokeWidth="2.6" />,
  squiggle: <path d="M2 14c2.5-5 5-5 7.5 0s5 5 7.5 0 4-5 5-3" fill="none" strokeWidth="2.6" strokeLinecap="round" />,
  dot: <circle cx="12" cy="12" r="5" />,
};

const rnd = (i: number, salt: number) => {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

type Mood = { shapes: Shape[]; confetti: boolean };

function moodOf(shot: Shot): Mood {
  const t = plain(shot.beat.text).toLowerCase();
  if (shot.kind === "scatter" || /angry|never remember|harden/.test(t)) return { shapes: [], confetti: false };
  if (/birthday|special day|graced|look at you|proud/.test(t)) return { shapes: ["star", "sparkle", "heart", "sparkle", "star", "dot"], confetti: true };
  if (/love|warmth|beautiful|lovely|awe|thank|grateful|happiness|bright face/.test(t)) return { shapes: ["heart", "sparkle", "heart", "ring", "heart", "dot"], confetti: false };
  if (/pop|dreamy|vividly|giggling/.test(t)) return { shapes: ["sparkle", "ring", "star", "squiggle", "sparkle", "dot", "heart"], confetti: true };
  return { shapes: ["sparkle", "ring", "squiggle", "dot"], confetti: false };
}

export default function Decor({ shot, index }: { shot: Shot; index: number }) {
  const { shapes, confetti } = moodOf(shot);
  return (
    <>
      {shapes.map((shape, k) => {
        // Keep clear of the words: even pieces float in a band above or below the
        // text, odd ones hug its left or right edge. Positions are % of the text box.
        const flip = rnd(index, k + 3) > 0.5;
        const x = k % 2 === 0 ? 5 + rnd(index, k) * 90 : flip ? -6 - rnd(index, k) * 8 : 106 + rnd(index, k) * 8;
        const y = k % 2 === 0 ? (flip ? -28 - rnd(index, k + 7) * 22 : 128 + rnd(index, k + 7) * 22) : 10 + rnd(index, k + 7) * 80;
        const z = -220 + rnd(index, k + 13) * 360;
        const size = 22 + rnd(index, k + 21) * 34;
        const tone = k % 3 === 0 ? "var(--mint)" : "var(--leaf)";
        return (
          <span
            key={k}
            className="decor"
            style={{ left: `${x}%`, top: `${y}%`, transform: `translate3d(-50%, -50%, ${z}px)` }}
          >
            <span className="pop">
              <svg
                viewBox="0 0 24 24"
                className={`bob shape-${shape}`}
                style={{
                  width: size,
                  height: size,
                  fill: shape === "ring" || shape === "squiggle" ? "none" : tone,
                  stroke: tone,
                  animationDelay: `${-rnd(index, k + 31) * 3}s`,
                }}
              >
                {paths[shape]}
              </svg>
            </span>
          </span>
        );
      })}
      {confetti &&
        Array.from({ length: 18 }, (_, k) => (
          <span key={`c${k}`} className="decor confetti-origin">
            <span
              className="confetti"
              style={{
                background: k % 3 === 0 ? "var(--cream)" : k % 3 === 1 ? "var(--leaf)" : "var(--mint)",
                width: 6 + rnd(index, k + 40) * 8,
                height: 10 + rnd(index, k + 50) * 10,
                borderRadius: k % 4 === 0 ? "50%" : 2,
              }}
            />
          </span>
        ))}
    </>
  );
}
