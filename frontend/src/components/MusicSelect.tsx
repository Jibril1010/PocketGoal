import { useEffect, useRef, useState } from "react";
import { GlitchText } from "./GlitchText";
import type { Song } from "../lib/types";

interface MusicSelectProps {
  songs: Song[];
  value: string;
  onChange: (song: Song) => void;
}

// A custom dropdown (native <select> options can't be styled with the
// glitch text effect) for picking a track.
export function MusicSelect({ songs, value, onChange }: MusicSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = songs.find((s) => s.id === value);

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
    <div className="music-select" ref={containerRef}>
      <button type="button" className="music-select-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="music-select-note">♪</span>
        <span className="music-select-label">
          {selected ? <GlitchText text={selected.title} /> : "Pick a song…"}
        </span>
        <span className="pokemon-select-chevron">▾</span>
      </button>

      {open && (
        <div className="music-select-panel">
          {songs.map((s) => (
            <button
              type="button"
              key={s.id}
              className={`music-select-option${s.id === value ? " selected" : ""}`}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
            >
              <span className="music-select-note">♪</span>
              <span className="music-select-label">
                <GlitchText text={s.title} />
                {s.artist && <span className="meta"> — {s.artist}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
