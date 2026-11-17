import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { parseBuffer } from "music-metadata";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { RenderScene } from "../lib/types";

const here = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.resolve(here, "../remotion/index.ts");
const BUCKET = process.env.SUPABASE_BUCKET ?? "videos";

export interface RenderJob {
  jobId: string;
  contentId: string;
  scenes: RenderScene[];
  brand: { name: string; handle: string; palette: { background: string; ink: string; accents: string[] } };
  voice: { provider: "openai" | "elevenlabs"; voiceId: string };
  callbackUrl: string;
}

type Report = (body: Record<string, unknown>) => Promise<void>;

/* ── Storage ─────────────────────────────────────────────────── */

export const hasSupabase = () =>
  Boolean((process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY);

export const supabase = () =>
  createClient(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

async function upload(key: string, data: Buffer, contentType: string) {
  const sb = supabase();
  const { error } = await sb.storage.from(BUCKET).upload(key, data, { contentType, upsert: true });
  if (error) throw new Error(`Upload ${key}: ${error.message}`);
  return sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}

/* ── Voice (TTS) ─────────────────────────────────────────────── */

async function tts(text: string, voice: RenderJob["voice"]): Promise<Buffer | null> {
  if (voice.provider === "elevenlabs" && process.env.ELEVENLABS_API_KEY) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2" }),
      },
    );
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
        voice: voice.provider === "openai" ? voice.voiceId : "alloy",
        input: text,
        instructions: "Bicara dalam bahasa Indonesia yang santai dan bersemangat, tempo sedikit cepat seperti kreator TikTok.",
        response_format: "mp3",
      }),
    });
    if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return null; // no TTS key → silent video with the script timings
}

async function voiceOver(job: RenderJob): Promise<RenderScene[]> {
  const out: RenderScene[] = [];
  for (const [i, scene] of job.scenes.entries()) {
    const audio = await tts(scene.voiceover, job.voice);
    if (!audio) {
      out.push(scene);
      continue;
    }
    const meta = await parseBuffer(audio, { mimeType: "audio/mpeg" });
    const duration = meta.format.duration ?? scene.seconds;
    const url = await upload(`${job.contentId}/vo-${i + 1}.mp3`, audio, "audio/mpeg");
    out.push({ ...scene, audio_url: url, seconds: Math.max(1.5, Math.round((duration + 0.35) * 100) / 100) });
  }
  return out;
}

/* ── Render ──────────────────────────────────────────────────── */

let bundled: Promise<string> | null = null;
export const getBundle = () => (bundled ??= bundle({ entryPoint: ENTRY, onProgress: () => {} }));

export async function renderVideo(scenes: RenderScene[], brand: RenderJob["brand"], outFile: string) {
  const serveUrl = await getBundle();
  const inputProps = { scenes, brand };
  const composition = await selectComposition({
    serveUrl,
    id: "PixeldewVideo",
    inputProps,
    browserExecutable: process.env.BROWSER_EXECUTABLE || null,
  });
  await renderMedia({
    serveUrl,
    composition,
    codec: "h264",
    crf: 20,
    x264Preset: "veryfast",
    outputLocation: outFile,
    inputProps,
    concurrency: Number(process.env.RENDER_CONCURRENCY ?? 2),
    browserExecutable: process.env.BROWSER_EXECUTABLE || null,
  });
}

export async function processJob(job: RenderJob, report: Report) {
  const dir = await mkdtemp(path.join(tmpdir(), "runai-"));
  try {
    await report({ status: "processing", stage: "voice" });
    const scenes = await voiceOver(job);

    await report({ status: "processing", stage: "render" });
    const file = path.join(dir, "video.mp4");
    await renderVideo(scenes, job.brand, file);

    await report({ status: "processing", stage: "upload" });
    const outputUrl = await upload(`${job.contentId}/video-${Date.now()}.mp4`, await readFile(file), "video/mp4");
    await report({ status: "done", outputUrl, scenes });
  } catch (err) {
    await report({ status: "failed", error: err instanceof Error ? err.message : String(err) });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * After a restart, pick up jobs that were queued or mid-render. Only the most
 * recent job of a content that is still waiting for its video is resumed;
 * older ones are marked superseded.
 */
export async function recoverJobs(): Promise<RenderJob[]> {
  if (!hasSupabase()) return [];
  const sb = supabase();
  const since = new Date(Date.now() - 6 * 3600_000).toISOString();
  const { data: jobs, error } = await sb
    .from("render_jobs")
    .select("id, content_id, payload, created_at")
    .in("status", ["queued", "processing"])
    .gte("created_at", since)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`recover: ${error.message}`);

  const latest = new Map<string, { id: string; payload: RenderJob | null }>();
  for (const j of jobs ?? []) latest.set(j.content_id, { id: j.id, payload: j.payload as RenderJob | null });

  const resumable: RenderJob[] = [];
  for (const j of jobs ?? []) {
    const keep = latest.get(j.content_id)?.id === j.id && j.payload;
    if (keep) {
      const { data: content } = await sb.from("contents").select("status").eq("id", j.content_id).maybeSingle();
      if (content?.status === "rendering") {
        resumable.push(j.payload as RenderJob);
        continue;
      }
    }
    await sb
      .from("render_jobs")
      .update({ status: "failed", error: "Dilewati saat worker restart (sudah tidak relevan)", updated_at: new Date().toISOString() })
      .eq("id", j.id);
  }
  return resumable;
}
