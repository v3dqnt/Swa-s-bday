"use client";
import dynamic from "next/dynamic";
import { story } from "@/content/story";

const Orb = dynamic(() => import("./Orb"), { ssr: false });

export default function Gate({ onOpen }: { onOpen: () => void }) {
  return (
    <main className="gate">
      <Orb />
      <div className="gate-ui">
        <p>{story.name}, this is for you. No strings.</p>
        <button onClick={onOpen}>Open</button>
      </div>
    </main>
  );
}
