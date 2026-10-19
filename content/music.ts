import type { Cue } from "./story";

// Song experiences: each record is a set of tracks keyed by story cue.
// When she scrolls past a cue (marked in content/story.ts), the record crossfades
// to that cue's track. A cue with no track keeps the previous song playing.
//
// Put the mp3 files in public/audio/<record id>/ and point to them here.
// Every record ends on the same song for the fireworks scene, starting at 0:17.
// "#t=<seconds>" sets where a track starts (and loops back to).
const FINALE = "/audio/finale.mp3#t=17";

export type Experience = {
  id: string;
  title: string;
  note: string; // one-line description on the sleeve
  label: string; // vinyl label colour
  sleeve: string; // sleeve colour
  ink: string; // sleeve text colour
  tracks: Partial<Record<Cue, string>>;
};

// Files live in public/audio/ under their original names (spaces and all).
const song = (file: string) => `/audio/${encodeURIComponent(file)}`;

export const experiences: Experience[] = [
  {
    id: "best-part",
    title: "best part.",
    note: "H.E.R. ft. Daniel Caesar",
    label: "#c9a96e",
    sleeve: "#e4d3a8",
    ink: "#112409",
    // one song through the whole story, then the fireworks song
    tracks: { hello: song("H.E.R. - Best Part (Lyrics) Ft. Daniel Caesar.mp3"), finale: FINALE },
  },
  {
    id: "sweet",
    title: "sweet.",
    note: "Cigarettes After Sex",
    label: "#3d5a73",
    sleeve: "#1d2c38",
    ink: "#f2eed6",
    tracks: { hello: song("Sweet - Cigarettes After Sex.mp3"), finale: FINALE },
  },
  {
    id: "te-amo",
    title: "te amo.",
    note: "from Dum Maaro Dum",
    label: "#f2eed6",
    sleeve: "#5a6b4a",
    ink: "#f2eed6",
    tracks: { hello: song("Te Amo Dum Maaro Dum (full song) Bipasha Basu, Rana Dagubati.mp3"), finale: FINALE },
  },
];
