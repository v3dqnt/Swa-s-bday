// All personal copy lives here.
//
// The site is one 2.5D space: each line sits somewhere in 3D and a camera flies
// to it as she scrolls (see lib/camera.ts).
// style:  "title" = huge · "soft" = quieter aside
// layout: the camera move for this line (default: cycles through straight, floor,
//         turn, rise, roll and ceiling shots)
//   left · right  — the line is turned sideways; the camera swings round to face it
//   zoom     — seen from far off, then the camera flies straight through it
//   scatter  — words float at different depths and only line up from one spot
//   marquee  — one giant line the camera tracks along
//   { row }  — lines on the walls of a corner; the camera turns from one to the next
// tone:   background shade while the line is on screen (subtle shifts of her green)
// cue:    soundtrack checkpoint; from here on the chosen record plays its track for
//         this cue (see content/music.ts)

export type Layout = "center" | "left" | "right" | "zoom" | "scatter" | "marquee";
export type Cue = "hello" | "birthday" | "thanks" | "hard" | "memories" | "finale";
export type Beat = { text: string; style?: "title" | "soft"; layout?: Layout; tone?: string; cue?: Cue };
export type Row = Beat | { row: Beat[]; tone?: string; cue?: Cue };

const tone = {
  base: "#112409", //     her green
  cool: "#0d1d0d", //     distance, longing
  bright: "#183410", //   celebration
  warm: "#1e2f0c", //     gratitude, golden olive
  vivid: "#1f4214", //    the colours pop
  dim: "#0c1608", //      the hard times
};

export const story = {
  name: "Swara",
  nickname: "",
  birthday: "",

  // Chapter 1: the opening.
  opening: [
    { text: "Hello, Swara.", style: "title", tone: tone.base, cue: "hello" },
    { text: "It has been a long time since we spoke properly, hasn't it?", layout: "left", tone: "#0f200b" },
    { text: "To me, every day without you felt like a week. And the weeks felt so long.", style: "soft", layout: "right", tone: tone.cool },
    { text: "But all that aside…", layout: "marquee", tone: tone.base },
    { text: "Today is your special day.", layout: "zoom", tone: tone.bright, cue: "birthday" },
    { text: "The day you graced this big, big world with your presence.", tone: tone.bright },
    {
      tone: "#1a3310",
      row: [
        { text: "You started with tiny little palms and a small torso." },
        { text: "And now, look at you.", style: "title" },
      ],
    },
    { text: "A fine young woman. Beautiful, sincere, and, no matter what anyone says, charming.", tone: "#1a3310" },
    { text: "Life threw so many challenges and hurdles your way.", layout: "scatter", tone: tone.dim },
    { text: "And you met them with compassion, bravery, and sincerity.", layout: "left", tone: "#15290b" },
    { text: "Not everyone stays soft when the world asks them to harden. You did.", style: "soft", layout: "right", tone: "#15290b" },
    { text: "That is something to be proud of, especially in the last year of your childhood.", tone: tone.bright },
    { text: "Happy birthday, Swara.", style: "title", layout: "zoom", tone: "#1c3a0e" },
  ] as Row[],

  // Chapter 2: the thank-you.
  gratitude: [
    { text: "Swara, I really, truly want to thank you.", style: "title", tone: tone.warm, cue: "thanks" },
    {
      tone: tone.warm,
      row: [
        { text: "For all the warmth, and love, and happiness you brought into my life." },
        { text: "I honestly can't express how much it means to me." },
      ],
    },
    { text: "Everyone feels happy when something good happens.", layout: "left", tone: "#142609" },
    { text: "But there is a different kind of happiness.", layout: "right", tone: "#142609" },
    { text: "The kind where you find yourself giggling, and looking at the world really vividly.", tone: "#1b380f" },
    { text: "The colours pop. Everything feels dreamy.", layout: "zoom", tone: tone.vivid },
    { text: "Even though it was ephemeral, I am grateful for every second you spent with me.", tone: "#172c0c" },
    { text: "Every time I looked at you beside me, I felt awe and disbelief.", layout: "left", tone: "#172c0c" },
    { text: "That a girl so beautiful and so lovely was right here, right next to me.", layout: "right", tone: tone.warm },
    { text: "I can't thank you enough.", style: "title", tone: tone.warm },
    { text: "Sure, there were times I was angry, annoyed, frustrated.", layout: "scatter", tone: tone.dim, cue: "hard" },
    { text: "But looking back, I never remember those.", style: "soft", tone: "#0f1d0a" },
    {
      tone: "#1b340f",
      cue: "memories",
      row: [
        { text: "I only remember the good ones. Just you and me, and your shimmering, bright face in front of me." },
        { text: "Nothing in the world bothered me in those moments." },
      ],
    },
    { text: "So again, I'm really, truly thankful. For every one of those moments, and for all the happiness.", tone: tone.warm },
    { text: "Thank you, Swara.", style: "title", layout: "zoom", tone: tone.warm },
  ] as Row[],

  // Chapter 3: lead-in to the imagined ending. Base tone so the finale fades in seamlessly.
  imagine: [
    { text: "This is what my imagination makes of a perfect ending to your birthday.", tone: tone.base, cue: "finale" },
  ] as Row[],

};
