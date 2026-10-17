import type { Cue } from "./story";

// Song experiences: each record is a set of tracks keyed by story cue.
// When she scrolls past a cue (marked in content/story.ts), the record crossfades
// to that cue's track. A cue with no track keeps the previous song playing.
//
// Put the mp3 files in public/audio/<record id>/ and point to them here.
// Every record ends on the same song for the fireworks scene, starting at 2:20.
// "#t=<seconds>" sets where a track starts (and loops back to).
const FINALE = "/audio/finale.mp3#t=140";

export type Experience = {
  id: string;
  title: string;
  note: string; // one-line description on the sleeve
  label: string; // vinyl label colour
  sleeve: string; // sleeve colour
  ink: string; // sleeve text colour
  tracks: Partial<Record<Cue, string>>;
};

export const experiences: Experience[] = [
  {
    id: "golden-hour",
    title: "golden hour.",
    note: "warm and sweet.",
    label: "#c9a96e",
    sleeve: "#e4d3a8",
    ink: "#112409",
    tracks: {
      hello: "/audio/golden-hour/1.mp3",
      birthday: "/audio/golden-hour/2.mp3",
      thanks: "/audio/golden-hour/3.mp3",
      hard: "/audio/golden-hour/4.mp3",
      memories: "/audio/golden-hour/5.mp3",
      finale: FINALE,
    },
  },
  {
    id: "midnight",
    title: "midnight.",
    note: "slow and a little blue.",
    label: "#3d5a73",
    sleeve: "#1d2c38",
    ink: "#f2eed6",
    tracks: {
      hello: "/audio/midnight/1.mp3",
      birthday: "/audio/midnight/2.mp3",
      thanks: "/audio/midnight/3.mp3",
      hard: "/audio/midnight/4.mp3",
      memories: "/audio/midnight/5.mp3",
      finale: FINALE,
    },
  },
  {
    id: "soft-piano",
    title: "soft piano.",
    note: "quiet, just keys.",
    label: "#f2eed6",
    sleeve: "#5a6b4a",
    ink: "#f2eed6",
    tracks: {
      hello: "/audio/soft-piano/1.mp3",
      thanks: "/audio/soft-piano/2.mp3",
      hard: "/audio/soft-piano/3.mp3",
      finale: FINALE,
    },
  },
];
