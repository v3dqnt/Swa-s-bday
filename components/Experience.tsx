"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Gate from "./Gate";
import { story } from "@/content/story";

const Story = dynamic(() => import("./Story"), { ssr: false });

export default function Experience() {
  const [opened, setOpened] = useState(false);

  const open = () => {
    // The click is the user gesture that lets audio start. Missing file is fine.
    new Audio(story.song).play().catch(() => {});
    setOpened(true);
  };

  return opened ? <Story /> : <Gate onOpen={open} />;
}
