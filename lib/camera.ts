import type { Beat, Cue, Row } from "@/content/story";

// A 2.5D camera rig for CSS 3D. Everything lives in one "world"; the camera is a
// pose (position + Euler rotation, degrees). Items are placed with
//   translate3d(p) rotateY(ry) rotateX(rx) rotateZ(rz)
// and the world is drawn through the camera with the exact inverse, so when the
// camera pose equals an item's pose that item sits flat, centred, at natural size.

export const PERSPECTIVE = 1000;

export type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number };
export const ORIGIN: Pose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };

export const itemTransform = (p: Pose) =>
  `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateY(${p.ry}deg) rotateX(${p.rx}deg) rotateZ(${p.rz}deg) translate(-50%, -50%)`;

export const worldTransform = (c: Pose) =>
  `rotateZ(${-c.rz}deg) rotateX(${-c.rx}deg) rotateY(${-c.ry}deg) translate3d(${-c.x}px, ${-c.y}px, ${-c.z}px)`;

/** The camera pose `local` expressed in the frame of `base` (e.g. "300px behind this line"). */
export function relative(base: Pose, local: Partial<Pose>): Pose {
  const m = new DOMMatrix(`rotateY(${base.ry}deg) rotateX(${base.rx}deg) rotateZ(${base.rz}deg)`);
  const v = m.transformPoint(new DOMPoint(local.x ?? 0, local.y ?? 0, local.z ?? 0));
  return {
    x: base.x + v.x,
    y: base.y + v.y,
    z: base.z + v.z,
    rx: base.rx + (local.rx ?? 0),
    ry: base.ry + (local.ry ?? 0),
    rz: base.rz + (local.rz ?? 0),
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
  rx: lerp(a.rx, b.rx, t),
  ry: lerp(a.ry, b.ry, t),
  rz: lerp(a.rz, b.rz, t),
});
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const sine = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

// ── Shots ──────────────────────────────────────────────────────────────

export type Kind = "straight" | "floor" | "ceiling" | "yawL" | "yawR" | "rise" | "roll" | "title" | "zoom" | "scatter" | "marquee" | "corner";

export type Shot = {
  beat: Beat;
  kind: Kind;
  chapter: number;
  pose: Pose; // where the line lives in the world
  cue?: Cue;
  tone?: string;
};

const CYCLE: Kind[] = ["straight", "floor", "yawL", "rise", "roll", "yawR", "ceiling"];

// Small deterministic noise so the path is varied but identical on every load.
const noise = (i: number, salt: number) => {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

/** Lay every line of the story out in space along a winding flight path. */
export function layoutShots(chapters: Row[][]): Shot[] {
  const shots: Shot[] = [];
  let at = { x: 0, y: -260, z: -1900 };
  let n = 0;

  chapters.forEach((rows, chapter) => {
    for (const row of rows) {
      if ("row" in row) {
        // A corner: panels on the walls around one eye point; the camera turns in place.
        const first = { ...at, rx: 0, ry: 0, rz: 0 };
        const eye = { x: first.x, y: first.y, z: first.z + PERSPECTIVE };
        row.row.forEach((beat, k) => {
          const th = (-90 * k * Math.PI) / 180;
          const pose = { x: eye.x - PERSPECTIVE * Math.sin(th), y: eye.y, z: eye.z - PERSPECTIVE * Math.cos(th), rx: 0, ry: -90 * k, rz: 0 };
          shots.push({ beat, kind: "corner", chapter, pose, cue: k === 0 ? row.cue : undefined, tone: row.tone });
        });
        const last = shots[shots.length - 1].pose;
        at = { x: last.x + 1400, y: last.y - 200, z: last.z - 1800 };
        n++;
        continue;
      }

      const beat = row as Beat;
      const kind: Kind =
        beat.layout === "left" ? "yawL"
        : beat.layout === "right" ? "yawR"
        : beat.layout === "zoom" ? "zoom"
        : beat.layout === "scatter" ? "scatter"
        : beat.layout === "marquee" ? "marquee"
        : beat.style === "title" ? "title"
        : CYCLE[n % CYCLE.length];

      const pose: Pose = { ...at, rx: 0, ry: 0, rz: 0 };
      if (kind === "floor") pose.rx = -62;
      if (kind === "ceiling") pose.rx = 50;
      if (kind === "yawL") { pose.ry = 42; pose.x -= 500; }
      if (kind === "yawR") { pose.ry = -42; pose.x += 500; }
      if (kind === "rise") { pose.y -= 700; pose.rx = 18; }
      if (kind === "roll") pose.rz = noise(n, 1) > 0 ? 16 : -16;
      if (kind === "straight" || kind === "title") pose.rz = noise(n, 2) * 5;

      shots.push({ beat, kind, chapter, pose, cue: beat.cue, tone: beat.tone });
      at = {
        x: at.x + noise(n, 3) * 900,
        y: at.y + noise(n, 4) * 500,
        z: at.z - 1900 - Math.abs(noise(n, 5)) * 500,
      };
      n++;
    }
  });
  return shots;
}

// ── Timeline ───────────────────────────────────────────────────────────
// The scroll is a list of segments measured in screen-heights. Travel segments
// fly between shots; hold segments drift gently while a line is read.

export type Segment = { from: Pose; to: Pose; len: number; travel: boolean; shot: number; start: number; settle?: number };

/** Where the camera sits while holding a shot, as start/end offsets in the shot's own frame. */
function holdFor(kind: Kind, measure: { width: number }): { from: Partial<Pose>; to: Partial<Pose>; len: number; settle?: number } {
  switch (kind) {
    case "title": return { from: { z: 380 }, to: { z: -140, rz: 2 }, len: 1.0 };
    case "zoom": return { from: { z: 1300 }, to: { z: 60 }, len: 1.3 };
    // the words line up 65% of the way through, then stay readable
    case "scatter": return { from: { x: 420, y: -260, z: 260, ry: 14 }, to: {}, len: 1.6, settle: 0.65 };
    case "marquee": {
      const reach = Math.max(0, measure.width / 2 - innerWidth * 0.35);
      return { from: { x: -reach, z: 120 }, to: { x: reach, z: 120 }, len: 2.0 };
    }
    case "corner": return { from: { z: 60 }, to: { z: -40 }, len: 0.9 };
    case "yawL": return { from: { x: -25, z: 140 }, to: { x: 25, z: 40 }, len: 0.85 };
    case "yawR": return { from: { x: 25, z: 140 }, to: { x: -25, z: 40 }, len: 0.85 };
    default: return { from: { z: 160 }, to: { z: -60 }, len: 0.85 };
  }
}

// The opening: a frontal view of the deck (matching the picker screen), then an
// orbit that shows off its sides before the camera leaves for the first line.
export const DECK_VIEW: Pose = { x: 0, y: 60, z: 0, rx: 0, ry: 0, rz: 0 };
// Orbit poses look at the deck's centre from `d` px further out along their own view axis.
const orbit = (rx: number, ry: number, rz: number, d: number) => relative({ ...ORIGIN, rx, ry, rz }, { z: d });
const ORBIT = () => [orbit(-55, 0, 0, 250), orbit(-40, -60, 4, 380), orbit(-66, 42, -6, 560)];

export const FINALE_LEN = 3.6;

export function buildTimeline(shots: Shot[], widths: number[]) {
  const segs: Segment[] = [];
  let t = 0;
  const push = (from: Pose, to: Pose, len: number, travel: boolean, shot: number, settle?: number) => {
    segs.push({ from, to, len, travel, shot, start: t, settle });
    t += len;
  };

  push(DECK_VIEW, DECK_VIEW, 0.25, false, -1);
  let prev = DECK_VIEW;
  for (const o of ORBIT()) {
    push(prev, o, 0.9, true, -1);
    prev = o;
  }

  shots.forEach((s, i) => {
    const h = holdFor(s.kind, { width: widths[i] ?? 0 });
    const a = relative(s.pose, h.from);
    const b = relative(s.pose, h.to);
    const travelLen = i === 0 ? 1.5 : s.kind === "corner" && shots[i - 1]?.kind === "corner" ? 1.1 : 1.0;
    push(prev, a, travelLen, true, i);
    push(a, b, h.len, false, i, h.settle);
    prev = b;
  });

  // Finale: drift up and away into the night while the scene fades in.
  const end = relative(prev, { y: -300, z: -2600, rx: 14 });
  const finaleStart = t;
  push(prev, end, FINALE_LEN, true, shots.length);

  return { segs, total: t, finaleStart };
}

/** Camera pose at scroll position s (in screen-heights). */
export function sample(segs: Segment[], s: number, reduced: boolean): { pose: Pose; seg: Segment; u: number } {
  let seg = segs[segs.length - 1];
  for (const g of segs) if (s < g.start + g.len) { seg = g; break; }
  const u = Math.min(1, Math.max(0, (s - seg.start) / seg.len));
  if (reduced && seg.travel) return { pose: u < 0.5 ? seg.from : seg.to, seg, u };
  const k = seg.travel ? inOut(u) : sine(Math.min(1, u / (seg.settle ?? 1)));
  return { pose: mix(seg.from, seg.to, k), seg, u };
}
