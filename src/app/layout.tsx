import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import ScrollProgress from "@/components/layout/ScrollProgress";
import JsonLd from "@/components/JsonLd";
import CustomCursor from "@/components/transitions/CustomCursor";
import ConsoleFilter from "@/components/ConsoleFilter";
import SmoothScroll from "@/components/providers/SmoothScroll";
import NoiseOverlay from "@/components/ui/NoiseOverlay";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kendrick Serrano — Creative Developer",
  description: "Full-stack developer building refined, high-craft web experiences.",
  keywords: ["developer", "portfolio", "web development", "creative", "react", "typescript"],
  authors: [{ name: "Kendrick Serrano" }],
  icons: { icon: "/favicon.jpg" },
  openGraph: {
    title: "Kendrick Serrano — Creative Developer",
    description: "Full-stack developer building refined, high-craft web experiences.",
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans cursor-none bg-bg`}
      >
        <ConsoleFilter />
        <NoiseOverlay />
        <CustomCursor />
        <ScrollProgress />
        <SmoothScroll>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </SmoothScroll>
        <Analytics />
      </body>
    </html>
  );
}
