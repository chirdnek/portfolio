"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Three random cards drawn from a shuffled deck via the public
 * Deck of Cards API. Fetched on mount; displayed as a fanned hand.
 *
 * API: https://deckofcardsapi.com
 *   1) GET /api/deck/new/shuffle/?deck_count=1 → { deck_id }
 *   2) GET /api/deck/{deck_id}/draw/?count=3   → { cards: [{ code, image, ... }] }
 */

interface DeckCard {
  code: string;
  image: string;       // PNG URL
  value: string;       // "ACE" | "KING" | "2" .. "10"
  suit: string;        // "SPADES" | "HEARTS" | "DIAMONDS" | "CLUBS"
}

interface ShuffleResponse {
  success: boolean;
  deck_id: string;
}

interface DrawResponse {
  success: boolean;
  cards: DeckCard[];
}

const BACK_IMAGE = "https://deckofcardsapi.com/static/img/back.png";

const POSITIONS = [
  { rotate: -14, x: -160, delay: 0.55 },
  { rotate: -2,  x: -80,  delay: 0.65 },
  { rotate: 12,  x: 0,    delay: 0.75 },
];

export default function HeroCardHand() {
  const [cards, setCards] = useState<DeckCard[] | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const shuffleRes = await fetch(
          "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1"
        );
        const shuffle: ShuffleResponse = await shuffleRes.json();
        if (!shuffle.success) throw new Error("shuffle failed");

        const drawRes = await fetch(
          `https://deckofcardsapi.com/api/deck/${shuffle.deck_id}/draw/?count=3`
        );
        const draw: DrawResponse = await drawRes.json();
        if (!draw.success) throw new Error("draw failed");

        if (!cancelled) setCards(draw.cards);
      } catch {
        // Silent failure — placeholders (card backs) stay shown.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // While loading: 3 card backs in the same fanned layout.
  const items =
    cards ??
    POSITIONS.map((_, i) => ({
      code: `back-${i}`,
      image: BACK_IMAGE,
      value: "BACK",
      suit: "—",
    }));

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-32 lg:bottom-40 right-6 sm:right-10 lg:right-16 z-[5] hidden md:block"
      style={{ width: "340px", height: "240px" }}
    >
      {items.map((c, i) => {
        const p = POSITIONS[i];
        const isLoading = !cards;
        return (
          <motion.div
            key={c.code}
            initial={{ opacity: 0, y: 30, rotate: p.rotate - 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotate: p.rotate, scale: 1 }}
            transition={{
              duration: 0.9,
              delay: p.delay,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ y: -6, rotate: p.rotate, scale: 1.04 }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
            className="absolute pointer-events-auto"
            style={{
              right: `${p.x * -1}px`,
              bottom: 0,
              width: "150px",
              transformOrigin: "bottom center",
              zIndex: 10 + i,
              filter:
                "drop-shadow(0 14px 26px rgba(0,0,0,0.7)) drop-shadow(0 0 22px rgba(232,80,112,0.18))",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.image}
              alt={isLoading ? "Loading card" : `${c.value} of ${c.suit}`}
              width={150}
              height={210}
              loading="lazy"
              draggable={false}
              className="w-full h-auto select-none rounded-md"
              style={{
                opacity: isLoading ? 0.85 : 1,
                filter: hoverIdx === i ? "invert(1)" : "none",
                transition: "opacity 350ms ease, filter 300ms ease",
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
