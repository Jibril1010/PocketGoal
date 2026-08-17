import { useEffect, useRef, useState } from "react";

export interface PokemonSelectOption {
  id: string;
  name: string;
  spriteUrl?: string;
  badge?: string;
}

interface PokemonSelectProps {
  options: PokemonSelectOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

// A round, avatar-based dropdown — native <select> can't render images
// inside its options, so this is a custom trigger + panel instead.
export function PokemonSelect({ options, value, onChange, disabled }: PokemonSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="pokemon-select" ref={containerRef}>
      <button
        type="button"
        className="pokemon-select-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className="pokemon-select-avatar">
          {selected?.spriteUrl && <img src={selected.spriteUrl} alt="" />}
        </span>
        <span className="pokemon-select-label">{selected ? selected.name : "Select…"}</span>
        {selected?.badge && <span className="pokemon-select-badge">{selected.badge}</span>}
        <span className="pokemon-select-chevron">▾</span>
      </button>

      {open && (
        <div className="pokemon-select-panel">
          {options.map((o) => (
            <button
              type="button"
              key={o.id}
              className={`pokemon-select-option${o.id === value ? " selected" : ""}`}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
            >
              <span className="pokemon-select-avatar">{o.spriteUrl && <img src={o.spriteUrl} alt="" />}</span>
              <span className="pokemon-select-label">{o.name}</span>
              {o.badge && <span className="pokemon-select-badge">{o.badge}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
