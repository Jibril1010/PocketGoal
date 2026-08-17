interface GlitchTextProps {
  text: string;
  className?: string;
}

// Renders text with a CSS-only RGB-split glitch flicker. `data-text` feeds
// the ::before/::after duplicate layers via `content: attr(data-text)`.
export function GlitchText({ text, className = "" }: GlitchTextProps) {
  return (
    <span className={`glitch-text ${className}`.trim()} data-text={text}>
      {text}
    </span>
  );
}
