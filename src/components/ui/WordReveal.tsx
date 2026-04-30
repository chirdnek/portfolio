"use client";

import { motion, type Variants } from "framer-motion";

interface WordRevealProps {
  text: string;
  className?: string;
  staggerDelay?: number;
  as?: keyof React.JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

const containerVariants: Variants = {
  hidden: {},
  visible: (stagger: number = 0.05) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.1 },
  }),
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function WordReveal({
  text,
  className = "",
  staggerDelay = 0.06,
  as: Tag = "h2",
  style,
}: WordRevealProps) {
  const words = text.split(" ");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-15% 0px" }}
      custom={staggerDelay}
      className={className}
      style={style}
    >
      <Tag className="m-0">
        {words.map((word, i) => (
          <span
            key={i}
            className="inline-block overflow-hidden align-bottom mr-[0.25em]"
          >
            <motion.span variants={wordVariants} className="inline-block">
              {word}
            </motion.span>
          </span>
        ))}
      </Tag>
    </motion.div>
  );
}
