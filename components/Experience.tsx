"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import Gate from "./Gate";
import { measureFrame } from "@/lib/frame";

const Backdrop = dynamic(() => import("./Backdrop"), { ssr: false });
const World = dynamic(() => import("./World"), { ssr: false });

export default function Experience() {
  const [opened, setOpened] = useState(false);

  // Keep --k and [data-frame] current for everything sized off the reference frames.
  useEffect(() => {
    measureFrame();
    const onResize = () => measureFrame();
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);

  // The gate ends on a full light-green iris; once the world is mounted, the
  // curtain shrinks back to a point to reveal it.
  useEffect(() => {
    if (!opened) return;
    gsap.fromTo(
      ".curtain",
      { clipPath: "circle(150% at 50% 50%)", autoAlpha: 1 },
      { clipPath: "circle(0% at 50% 50%)", duration: 0.9, delay: 0.15, ease: "power3.inOut", onComplete: () => gsap.set(".curtain", { autoAlpha: 0 }) }
    );
  }, [opened]);

  return (
    <>
      <Backdrop />
      {opened ? <World /> : <Gate onOpen={() => setOpened(true)} />}
      <div className="curtain" aria-hidden="true" />
      {/* one grain + vignette pass over everything, so text and scene read as one image */}
      <div className="film" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  );
}
