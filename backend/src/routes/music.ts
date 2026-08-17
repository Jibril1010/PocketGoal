import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export const musicRouter = Router();

musicRouter.get("/songs", async (_req, res) => {
  const { data, error } = await supabaseAdmin.from("songs").select("*").order("created_at", { ascending: false });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

musicRouter.post("/songs", async (req, res) => {
  const { title, artist, fileUrl } = req.body as { title?: string; artist?: string; fileUrl?: string };
  if (!title || !title.trim() || !fileUrl || !fileUrl.trim()) {
    res.status(400).json({ error: "title and fileUrl are required" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("songs")
    .insert({ title: title.trim(), artist: artist?.trim() || null, file_url: fileUrl.trim(), uploaded_by: req.userId })
    .select("*")
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
});

musicRouter.get("/selection", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("user_music_selection")
    .select("song_id, songs(*)")
    .eq("user_id", req.userId)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data?.songs ?? null);
});

musicRouter.post("/selection", async (req, res) => {
  const { songId } = req.body as { songId?: string };
  if (!songId) {
    res.status(400).json({ error: "songId is required" });
    return;
  }

  const { error } = await supabaseAdmin
    .from("user_music_selection")
    .upsert({ user_id: req.userId, song_id: songId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).send();
});
