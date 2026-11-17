import "server-only";
import { logEvent, setAgent } from "./office";
import { voiceInApp } from "./voice";
import { fail as failContent } from "./pipeline/content";
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
    await browserFallback(contentId, "Preview siap — video dibuat di browser (tombol Buat & unduh video)");
    return;
  }

  const brand = await getBrand();
  const jobId = uid();
  const payload = {
    jobId,
    contentId,
    scenes: content.scenes,
    brand: { name: brand.name, handle: brand.handle, palette: brand.palette },
    voice: brand.voice,
    callbackUrl: `${appUrl()}/api/render/callback`,
  };
  // The payload is stored so the worker can pick the job up again after a restart.
  await db().insert("render_jobs", {
    id: jobId,
    content_id: contentId,
    status: "queued",
    payload,
    output_url: null,
    error: null,
    created_at: now(),
    updated_at: now(),
  });

  await setAgent("voice", "working", "Merekam voice-over");
  await setAgent("editor", "working", "Merender video");
  await logEvent("editor", "Job render dikirim ke worker", ref);

  let res: Response;
  try {
    res = await fetch(`${process.env.RENDER_WORKER_URL!.replace(/\/$/, "")}/render`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.RENDER_WORKER_SECRET ?? ""}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    await markJobFailed(jobId, `Worker tidak bisa dihubungi: ${why}`);
    await browserFallback(contentId, `Render worker tidak bisa dihubungi (${workerHost()}) — video dibuat di browser saja, tanpa suara`, true);
    return;
  }
  if (!res.ok) {
    const text = (await res.text()).slice(0, 200);
    await markJobFailed(jobId, `HTTP ${res.status}: ${text}`);
    const hint = res.status === 401 ? "RENDER_WORKER_SECRET di Vercel & Railway tidak sama" : `worker error ${res.status}`;
    await browserFallback(contentId, `Render worker menolak job (${hint}) — video dibuat di browser saja, tanpa suara`, true);
  }
}

const workerHost = () => {
  try {
    return new URL(process.env.RENDER_WORKER_URL ?? "").host || "URL kosong";
  } catch {
    return "URL tidak valid";
  }
};

/** Skip the worker: the user renders the (silent) MP4 in the browser instead. */
async function browserFallback(contentId: string, message: string, warn = false) {
  await setAgent("editor", warn ? "error" : "idle", warn ? "Worker tidak terjangkau" : null);
  // Vox still records the voice-over here, so the browser-made MP4 has sound.
  const voiced = await voiceInApp(contentId);
  if (voiced) message = message.replace("tanpa suara", "dengan voice-over");
  await db().update("contents", contentId, { status: "awaiting_final", updated_at: now() });
  await logEvent("editor", message, { ref_type: "content", ref_id: contentId, kind: "approval" });
}

async function markJobFailed(jobId: string, error: string) {
  await db().update("render_jobs", jobId, { status: "failed", error, updated_at: now() });
  await setAgent("voice", "idle");
  await setAgent("editor", "error", "Render gagal");
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

  // Ignore duplicates. A late "done" for a job the watchdog gave up on is still
  // accepted as long as the content hasn't moved on (e.g. retried meanwhile).
  if (job.status === "done") return;
  if (job.status === "failed") {
    if (cb.status !== "done") return;
    const content = await db().get("contents", job.content_id);
    if (!content || content.status !== "failed" || content.failed_status !== "rendering") return;
  }

  if (cb.status === "processing") {
    await db().update("render_jobs", job.id, { status: "processing", updated_at: now() });
    await db().update("contents", job.content_id, { updated_at: now() });
    if (cb.stage === "render") {
      await setAgent("voice", "idle");
      await logEvent("voice", "Voice-over selesai", ref);
    }
    return;
  }

  if (cb.status === "failed") {
    await markJobFailed(job.id, cb.error ?? "unknown");
    await failContent(job.content_id, `Render gagal: ${cb.error}`);
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
