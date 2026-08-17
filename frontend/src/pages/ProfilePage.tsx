import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { enablePushNotifications } from "../lib/push";
import { useMusic } from "../lib/MusicContext";
import type { Profile, Song } from "../lib/types";

function expToNextLevel(level: number): number {
  return Math.round(100 * Math.pow(1.25, level - 1));
}

const BACKGROUND_OPTIONS = ["/backgrounds/bb1.jpg", "/backgrounds/bb2.jpg", "/backgrounds/bb3.jpg", "/backgrounds/bb4.jpg"];

export function ProfilePage() {
  const queryClient = useQueryClient();
  const [pushStatus, setPushStatus] = useState<"idle" | "enabling" | "enabled" | "error">("idle");
  const [pushError, setPushError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/profile"),
  });

  const { songs, currentSong, selectSong, refreshSongs } = useMusic();

  const setBackground = useMutation({
    mutationFn: (backgroundUrl: string | null) => api.post("/profile/background", { backgroundUrl }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const addSong = useMutation({
    mutationFn: () => api.post<Song>("/music/songs", { title: newTitle, artist: newArtist, fileUrl: newUrl }),
    onSuccess: () => {
      setNewTitle("");
      setNewArtist("");
      setNewUrl("");
      refreshSongs();
    },
  });

  const subscribe = useMutation({
    mutationFn: (sub: PushSubscription) => {
      const json = sub.toJSON();
      return api.post("/push/subscribe", { endpoint: json.endpoint, keys: json.keys });
    },
  });

  async function handleEnablePush() {
    setPushStatus("enabling");
    setPushError(null);
    try {
      const { publicKey } = await api.get<{ publicKey: string; enabled: boolean }>("/push/public-key");
      if (!publicKey) throw new Error("Push notifications are not configured on the server yet (missing VAPID keys).");
      const sub = await enablePushNotifications(publicKey);
      await subscribe.mutateAsync(sub);
      setPushStatus("enabled");
    } catch (err) {
      setPushStatus("error");
      setPushError((err as Error).message);
    }
  }

  if (!profile) return <p>Loading profile…</p>;

  const needed = expToNextLevel(profile.level);
  const pct = Math.min(100, Math.round((profile.current_exp / needed) * 100));

  return (
    <div>
      <h1>Profile</h1>

      <div className="card">
        <h3>
          {profile.username} — Level {profile.level}
        </h3>
        <div className="exp-bar-track">
          <div className="exp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="meta">
          {profile.current_exp} / {needed} EXP to next level
        </p>
        <p className="meta">🪙 {profile.coins} coins</p>
      </div>

      <div className="card">
        <h3>Streak</h3>
        <p style={{ fontSize: "2rem", margin: "4px 0" }}>🔥 {profile.streak_current}</p>
        <p className="meta">Longest streak: {profile.streak_longest} days</p>
        <p className="meta">Goals completed: {profile.goals_completed_count}</p>
      </div>

      <div className="card">
        <h3>Home Background</h3>
        <p className="meta">Choose a background image for your home screen board.</p>
        <div className="background-picker">
          <button
            className={`background-option${!profile.background_url ? " selected" : ""}`}
            onClick={() => setBackground.mutate(null)}
            disabled={setBackground.isPending}
          >
            None
          </button>
          {BACKGROUND_OPTIONS.map((url) => (
            <button
              key={url}
              className={`background-option${profile.background_url === url ? " selected" : ""}`}
              onClick={() => setBackground.mutate(url)}
              disabled={setBackground.isPending}
              style={{ backgroundImage: `url(${url})` }}
            />
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Notifications</h3>
        <p className="meta">Get a push reminder if you haven't completed a goal by the end of the day.</p>
        <button onClick={handleEnablePush} disabled={pushStatus === "enabling" || pushStatus === "enabled"}>
          {pushStatus === "enabled" ? "Enabled ✓" : pushStatus === "enabling" ? "Enabling…" : "Enable notifications"}
        </button>
        {pushError && <p className="error-text">{pushError}</p>}
      </div>

      <div className="card">
        <h3>Music</h3>
        {currentSong && (
          <p className="meta">
            Now playing: {currentSong.title}
            {currentSong.artist ? ` — ${currentSong.artist}` : ""}
          </p>
        )}

        {songs.length === 0 && <p className="meta">No tracks yet — add one below.</p>}
        {songs.map((song) => (
          <div className="goal-row" key={song.id} style={{ marginBottom: 6 }}>
            <span>
              {song.title}
              {song.artist ? ` — ${song.artist}` : ""}
            </span>
            <button
              className={currentSong?.id === song.id ? "" : "secondary"}
              onClick={() => selectSong(song)}
            >
              {currentSong?.id === song.id ? "Playing" : "Play this"}
            </button>
          </div>
        ))}

        <h4 style={{ marginTop: 16, marginBottom: 8 }}>Add a track</h4>
        <p className="meta" style={{ marginTop: -4, marginBottom: 8 }}>
          Drop an audio file in <code>frontend/public/music/</code> and reference it as <code>/music/yourfile.mp3</code>, or
          link any URL you host yourself.
        </p>
        <input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <input placeholder="Artist (optional)" value={newArtist} onChange={(e) => setNewArtist(e.target.value)} />
        <input placeholder="Audio URL or /music/file.mp3" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
        <button
          onClick={() => addSong.mutate()}
          disabled={addSong.isPending || !newTitle.trim() || !newUrl.trim()}
        >
          Add track
        </button>
      </div>
    </div>
  );
}
