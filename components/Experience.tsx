"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Gate from "./Gate";
import Cinematic from "./Cinematic";
import { story } from "@/content/story";

const Orb = dynamic(() => import("./Orb"), { ssr: false });

// Chapters after the opening get added here as the story comes together.
export default function Experience() {
  const [stage, setStage] = useState<"gate" | "opening" | "gratitude" | "next">("gate");

  const open = () => {
    // The click is the user gesture that lets audio start. Missing file is fine.
    new Audio(story.song).play().catch(() => {});
    setStage("opening");
  };

  if (stage === "gate") return <Gate onOpen={open} />;
  return (
    <main className="gate">
      <Orb />
      {stage === "opening" ? (
        <Cinematic beats={story.opening} onDone={() => setStage("gratitude")} />
      ) : stage === "gratitude" ? (
        <Cinematic beats={story.gratitude} onDone={() => setStage("next")} />
      ) : (
        <p className="beat" style={{ opacity: 1, position: "relative" }}>More coming soon</p>
      )}
    </main>
  );
}
