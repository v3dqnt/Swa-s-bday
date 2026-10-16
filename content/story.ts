// All personal copy lives here. Fill in as the story comes together.
export const story = {
  name: "Swara",
  nickname: "",
  birthday: "",
  // Chapter 1: the opening. style "title" = big card, "soft" = quieter aside.
  opening: [
    { text: "Hello, Swara.", style: "title" },
    { text: "It has been a long time since we spoke properly, hasn't it?" },
    { text: "To me, every day without you felt like a week. And the weeks felt so long.", style: "soft" },
    { text: "But all that aside…" },
    { text: "Today is your special day." },
    { text: "The day you graced this big, big world with your presence." },
    { text: "You started with tiny little palms and a small torso." },
    { text: "And now, look at you.", style: "title" },
    { text: "A fine young woman. Beautiful, sincere, and, no matter what anyone says, charming." },
    { text: "Life threw so many challenges and hurdles your way." },
    { text: "And you met them with compassion, bravery, and sincerity." },
    { text: "Not everyone stays soft when the world asks them to harden. You did.", style: "soft" },
    { text: "That is something to be proud of, especially in the last year of your childhood." },
    { text: "Happy birthday, Swara.", style: "title" },
  ] as { text: string; style?: "title" | "soft" }[],
  timeline: [] as { date: string; caption: string; photo: string }[],
  loves: [] as { word: string; note: string }[],
  letter: "",
  gift: "",
  song: "/audio/song.mp3",
};
