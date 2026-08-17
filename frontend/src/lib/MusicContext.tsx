import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Song } from "./types";

interface MusicContextValue {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  needsGesture: boolean;
  selectSong: (song: Song) => void;
  resumeAfterGesture: () => void;
  refreshSongs: () => Promise<void>;
  pause: () => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

// Tells iOS/Android this is a real "now playing" media session — this is
// what makes lock-screen controls appear and is part of what the OS uses to
// decide whether audio is allowed to keep playing once the screen locks or
// the app goes to the background (best-effort: WebKit still ultimately
// decides this, a web app doesn't get the same guarantees a native app's
// background-audio entitlement would).
function updateMediaSession(song: Song | null, playing: boolean, handlers: { play: () => void; pause: () => void }) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

  if (song) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist ?? "Pocket Goals",
      album: "Pocket Goals",
      artwork: [
        { src: "/icons/poke.jpg", sizes: "192x192", type: "image/jpeg" },
        { src: "/icons/poke.jpg", sizes: "512x512", type: "image/jpeg" },
      ],
    });
  }
  navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  navigator.mediaSession.setActionHandler("play", handlers.play);
  navigator.mediaSession.setActionHandler("pause", handlers.pause);
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);

  const refreshSongs = useCallback(async () => {
    const list = await api.get<Song[]>("/music/songs");
    setSongs(list);
  }, []);

  // On every app start, fetch the catalog and autoplay a fresh random pick.
  useEffect(() => {
    let cancelled = false;
    api.get<Song[]>("/music/songs").then((list) => {
      if (cancelled || list.length === 0) return;
      setSongs(list);
      setCurrentSong(list[Math.floor(Math.random() * list.length)]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!currentSong || !audio) return;
    audio.src = currentSong.file_url;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setNeedsGesture(false);
      })
      .catch(() => {
        // Browser blocked autoplay without a recent user gesture.
        setIsPlaying(false);
        setNeedsGesture(true);
      });
  }, [currentSong]);

  const selectSong = useCallback((song: Song) => {
    setCurrentSong(song);
    api.post("/music/selection", { songId: song.id }).catch(() => {});
  }, []);

  const resumeAfterGesture = useCallback(() => {
    audioRef.current
      ?.play()
      .then(() => {
        setIsPlaying(true);
        setNeedsGesture(false);
      })
      .catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  // Keep isPlaying (and the lock-screen playback state) in sync even when
  // playback is started/stopped from outside our own play()/pause() calls —
  // e.g. the OS's own lock-screen media controls.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  useEffect(() => {
    updateMediaSession(currentSong, isPlaying, { play: resumeAfterGesture, pause });
  }, [currentSong, isPlaying, resumeAfterGesture, pause]);

  return (
    <MusicContext.Provider
      value={{ songs, currentSong, isPlaying, needsGesture, selectSong, resumeAfterGesture, refreshSongs, pause }}
    >
      {children}
      <audio ref={audioRef} loop playsInline />
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}
