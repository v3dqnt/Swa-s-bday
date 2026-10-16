"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Gate from "./Gate";
import RecordPlayer from "./RecordPlayer";

const Story = dynamic(() => import("./Story"), { ssr: false });

export default function Experience() {
  const [stage, setStage] = useState<"gate" | "player" | "story">("gate");

  if (stage === "gate") return <Gate onOpen={() => setStage("player")} />;
  if (stage === "player") return <RecordPlayer onBegin={() => setStage("story")} />;
  return <Story />;
}
