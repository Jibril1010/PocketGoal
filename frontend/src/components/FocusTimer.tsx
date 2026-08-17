import { useEffect, useRef, useState } from "react";
import { useMusic } from "../lib/MusicContext";
import { MusicSelect } from "./MusicSelect";
import { playTimesUpBeep } from "../lib/beep";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FocusTimer() {
  const { songs, currentSong, selectSong, pause: pauseMusic } = useMusic();
  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          setRunning(false);
          pauseMusic();
          playTimesUpBeep();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Focus timer done!", { body: "Time's up — nice work." });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  function start() {
    setSecondsLeft((prev) => prev ?? minutes * 60);
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(null);
  }

  const done = secondsLeft === 0;
  const display = secondsLeft === null ? formatTime(minutes * 60) : formatTime(secondsLeft);

  return (
    <div className="card">
      <h3>Focus Timer</h3>

      {secondsLeft === null && (
        <div style={{ marginBottom: 10 }}>
          <input
            type="number"
            min={1}
            max={180}
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))}
            style={{ width: 90, display: "inline-block", marginBottom: 0, marginRight: 8 }}
          />
          <span className="meta">minutes</span>
        </div>
      )}

      <div style={{ fontSize: "2.5rem", fontWeight: 700, margin: "6px 0 14px", fontVariantNumeric: "tabular-nums" }}>
        {done ? "Time's up! 🎉" : display}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {!running && (
          <button onClick={start} disabled={done}>
            {secondsLeft !== null && secondsLeft > 0 ? "Resume" : "Start"}
          </button>
        )}
        {running && (
          <button className="secondary" onClick={pause}>
            Pause
          </button>
        )}
        <button className="secondary" onClick={reset}>
          Reset
        </button>
      </div>

      <h4 style={{ marginBottom: 8 }}>Music</h4>
      {songs.length === 0 ? (
        <p className="meta">No tracks available yet — add some on your Profile page.</p>
      ) : (
        <MusicSelect songs={songs} value={currentSong?.id ?? ""} onChange={selectSong} />
      )}
    </div>
  );
}
