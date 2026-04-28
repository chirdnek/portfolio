"use client";

import Hero from "@/components/sections/Hero";
import IntroSection from "@/components/sections/IntroSection";
import Technical from "@/components/sections/Technical";
import MyWork from "@/components/sections/MyWork";
import MySkills from "@/components/sections/MySkills";
import Bottom from "@/components/layout/Bottom";

export default function Home() {
  return (
    <>
      <IntroSection />
      <Hero />
      <Technical />
      <MyWork />
      <MySkills />
      <Bottom />
    </>
  );
}
