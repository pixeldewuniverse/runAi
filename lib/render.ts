import "server-only";
import { logEvent, setAgent } from "./office";
import { getBrand } from "./settings";
import { db, now, uid } from "./store";
import type { RenderScene } from "./types";

export const hasWorker = () => Boolean(process.env.RENDER_WORKER_URL);

export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

/**
 * Hand the approved storyboard to the render worker (Railway).
 * Without a worker the content still moves on: the app previews the video
 * in the browser with the same Remotion composition.
 */
export async function dispatchRender(contentId: string) {
  const content = await db().get("contents", contentId);
  if (!content?.scenes) throw new Error("Storyboard belum ada");
  const ref = { ref_type: "content" as const, ref_id: contentId };

  if (!hasWorker()) {
    await db().update("contents", contentId, { status: "awaiting_final", updated_at: now() });
    await logEvent("editor", "Preview siap (render worker belum diatur — video dirender di browser)", {
      ...ref,
      kind: "approval",
    });
    return;
  }

  const job = await db().insert("render_jobs", {
    id: uid(),
    content_id: contentId,
    status: "queued",
    output_url: null,
    error: null,
    created_at: now(),
    updated_at: now(),
  });

  const brand = await getBrand();
  await setAgent("voice", "working", "Merekam voice-over");
  await setAgent("editor", "working", "Merender video");
  await logEvent("editor", "Job render dikirim ke worker", ref);

  const res = await fetch(`${process.env.RENDER_WORKER_URL!.replace(/\/$/, "")}/render`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.RENDER_WORKER_SECRET ?? ""}`,
    },
    body: JSON.stringify({
      jobId: job.id,
      contentId,
      scenes: content.scenes,
      brand: { name: brand.name, handle: brand.handle, palette: brand.palette },
      voice: brand.voice,
      callbackUrl: `${appUrl()}/api/render/callback`,
    }),
  });
  if (!res.ok) {
    await setAgent("voice", "idle");
    await setAgent("editor", "error", "Worker menolak job");
    throw new Error(`Render worker error ${res.status}: ${await res.text()}`);
  }
}

export interface RenderCallback {
  jobId: string;
  status: "processing" | "done" | "failed";
  stage?: "voice" | "render" | "upload";
  outputUrl?: string;
  scenes?: RenderScene[];
  error?: string;
}

export async function handleRenderCallback(cb: RenderCallback) {
  const job = await db().get("render_jobs", cb.jobId);
  if (!job) throw new Error("Job tidak ditemukan");
  const ref = { ref_type: "content" as const, ref_id: job.content_id };

  if (cb.status === "processing") {
    await db().update("render_jobs", job.id, { status: "processing", updated_at: now() });
    if (cb.stage === "render") {
      await setAgent("voice", "idle");
      await logEvent("voice", "Voice-over selesai", ref);
    }
    return;
  }

  if (cb.status === "failed") {
    await db().update("render_jobs", job.id, { status: "failed", error: cb.error ?? null, updated_at: now() });
    await db().update("contents", job.content_id, { status: "failed", error: `Render gagal: ${cb.error}`, updated_at: now() });
    await setAgent("voice", "idle");
    await setAgent("editor", "error", "Render gagal");
    await logEvent("editor", `Render gagal: ${cb.error}`, { ...ref, kind: "error" });
    return;
  }

  await db().update("render_jobs", job.id, { status: "done", output_url: cb.outputUrl ?? null, updated_at: now() });
  await db().update("contents", job.content_id, {
    status: "awaiting_final",
    video_url: cb.outputUrl ?? null,
    ...(cb.scenes ? { scenes: cb.scenes } : {}),
    updated_at: now(),
  });
  await setAgent("voice", "idle");
  await setAgent("editor", "waiting", "Menunggu approval video");
  await logEvent("editor", "Video final siap direview", { ...ref, kind: "approval" });
}
