"use client";
import { useState } from "react";
import Gate from "./Gate";

// Scenes 1-7 from STORYBOARD.md get added here once the story is in.
export default function Experience() {
  const [opened, setOpened] = useState(false);
  if (!opened) return <Gate onOpen={() => setOpened(true)} />;
  return <main className="gate"><p>Scene 1 coming soon</p></main>;
}
