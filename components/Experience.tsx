"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Gate from "./Gate";

const World = dynamic(() => import("./World"), { ssr: false });

export default function Experience() {
  const [opened, setOpened] = useState(false);
  return opened ? <World /> : <Gate onOpen={() => setOpened(true)} />;
}
