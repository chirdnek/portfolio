import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Bebas_Neue } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import FloatingDock from "@/components/ui/FloatingDock";
import ScrollProgress from "@/components/layout/ScrollProgress";
import JsonLd from "@/components/JsonLd";
import CustomCursor from "@/components/transitions/CustomCursor";
import ConsoleFilter from "@/components/ConsoleFilter";
import SmoothScroll from "@/components/providers/SmoothScroll";
import NoiseOverlay from "@/components/ui/NoiseOverlay";

// Body — Space Grotesk: tight geometric sans, reads like a HUD chyron.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// HUD — JetBrains Mono: the terminal/visa-countdown typeface.
const jetMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Display — Bebas Neue: massive condensed numerals and uppercase headlines.
const bebas = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Kendrick Serrano — UI/UX Designer & Developer",
  description:
    "UI/UX designer and web/mobile developer based in Tugbungan, Zamboanga City. Selected work in Figma, Flutter, and React — interfaces designed and shipped end-to-end.",
  keywords: [
    "Kendrick Serrano",
    "UI/UX designer",
    "portfolio",
    "design portfolio",
    "Figma",
    "Flutter",
    "React",
    "Next.js",
    "Zamboanga",
    "WMSU",
  ],
  authors: [{ name: "Kendrick U. Serrano" }],
  icons: { icon: "/favicon.jpg" },
  openGraph: {
    title: "Kendrick Serrano — UI/UX Designer & Developer",
    description:
      "Selected UI/UX design work — interfaces designed in Figma and shipped in Flutter and React.",
    type: "website",
  },
};

export const viewport = "width=device-width, initial-scale=1, maximum-scale=1";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${jetMono.variable} ${bebas.variable} font-sans cursor-none bg-bg`}
      >
        <ConsoleFilter />
        <NoiseOverlay />
        <CustomCursor />
        <ScrollProgress />
        <SmoothScroll>
          <main className="min-h-screen">{children}</main>
        </SmoothScroll>
        <FloatingDock />
        <Analytics />
      </body>
    </html>
  );
}
