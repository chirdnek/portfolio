type Props = { text: string };

/**
 * Red chromatic-echo heading. Two stacked copies of the text sit slightly
 * offset behind the main layer and glitch in CSS via .dd-eldritch__echo
 * keyframes. No framer-motion, no transitions — pure CSS animations only.
 */
export default function EldritchHeading({ text }: Props) {
  const chars = Array.from(text);

  return (
    <span className="dd-eldritch" aria-label={text}>
      {/* Red fringe echoes */}
      <span className="dd-eldritch__echo dd-eldritch__echo--red" aria-hidden>
        {text}
      </span>
      <span className="dd-eldritch__echo dd-eldritch__echo--deep" aria-hidden>
        {text}
      </span>

      {/* Main text */}
      <span className="dd-eldritch__main">
        {chars.map((c, i) => (
          <span key={i} className="dd-eldritch__char">
            {c === " " ? " " : c}
          </span>
        ))}
      </span>
    </span>
  );
}
