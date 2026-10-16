"use client";
import { story } from "@/content/story";

export default function Gate({ onOpen }: { onOpen: () => void }) {
  return (
    <main className="gate">
      <div className="gate-ui">
        <p>{story.name}, this is for you. No strings.</p>
        <button onClick={onOpen}>Open</button>
      </div>
    </main>
  );
}
