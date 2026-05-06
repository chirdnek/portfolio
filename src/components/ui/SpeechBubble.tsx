"use client";

import { useEffect, useState } from "react";

interface SpeechBubbleProps {
  messages?: string[];
  intervalMs?: number;
  className?: string;
}

const DEFAULT_MESSAGES = [
  "Hi there 👋",
  "I'm Kendrick's guide bot.",
  "Wanna build something cool?",
  "Drop a message below.",
];

export default function SpeechBubble({
  messages = DEFAULT_MESSAGES,
  intervalMs = 4200,
  className = "",
}: SpeechBubbleProps) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const tick = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 320);
    }, intervalMs);
    return () => clearInterval(tick);
  }, [mounted, messages.length, intervalMs]);

  if (!mounted) {
    return (
      <div
        suppressHydrationWarning
        className={className}
        style={{ minHeight: 56 }}
      />
    );
  }

  return (
    <div
      suppressHydrationWarning
      className={`relative inline-block ${className}`}
    >
      <div
        className="font-mono text-sm sm:text-base"
        style={{
          padding: "0.7rem 1.05rem",
          background: "rgba(20, 20, 24, 0.82)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          borderRadius: "16px",
          color: "rgba(255, 255, 255, 0.94)",
          boxShadow:
            "0 14px 36px -16px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(14px) saturate(140%)",
          WebkitBackdropFilter: "blur(14px) saturate(140%)",
          minWidth: "180px",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-3px)",
          transition: "opacity 320ms ease, transform 320ms ease",
          letterSpacing: "0.01em",
        }}
      >
        <span style={{ color: "rgba(154, 166, 255, 0.85)", marginRight: 6 }}>
          ›
        </span>
        {messages[idx]}
      </div>
      {/* Tail — pointing right-down toward the robot */}
      <span
        aria-hidden
        className="absolute"
        style={{
          bottom: "-7px",
          right: "22%",
          width: "14px",
          height: "14px",
          background: "rgba(20, 20, 24, 0.82)",
          borderRight: "1px solid rgba(255, 255, 255, 0.16)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.16)",
          transform: "rotate(45deg)",
        }}
      />
    </div>
  );
}
