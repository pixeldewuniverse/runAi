import "server-only";
import { logEvent, setAgent } from "./office";
import { fail as failContent } from "./pipeline/content";
import { hasWorker } from "./render";
import { db, now } from "./store";
import type { ContentStatus } from "./types";

/*
 * Watchdog: background work can die silently (serverless timeout, worker
 * restart, crash). Anything "in progress" that hasn't moved for too long is
 * marked failed, which shows the "Coba lagi" button — retry resumes from the
 * step that stalled. Called lazily from read endpoints and the daily cron.
 */

const MIN = 60_000;
export const LIMITS = {
  agentStep: 8 * MIN, // one Vercel function is capped at 5 min
  render: 25 * MIN, // worker reports progress at each stage
  brainstormStep: 8 * MIN,
};

const g = globalThis as unknown as { __runaiSweep?: number };

const age = (iso: string) => Date.now() - new Date(iso).getTime();

export async function sweepStale(force = false) {
  if (!force && g.__runaiSweep && Date.now() - g.__runaiSweep < 20_000) return;
  g.__runaiSweep = Date.now();

  try {
    const working: ContentStatus[] = ["researching", "scripting", "rendering"];
    for (const status of working) {
      const rows = await db().list("contents", { eq: { status } });
      for (const c of rows) {
        let limit = LIMITS.agentStep;
        let since = c.updated_at;
        if (status === "rendering" && hasWorker()) {
          const jobs = await db().list("render_jobs", {
            eq: { content_id: c.id },
            order: { column: "created_at", ascending: false },
            limit: 1,
          });
          if (jobs[0] && ["queued", "processing"].includes(jobs[0].status)) {
            limit = LIMITS.render;
            since = jobs[0].updated_at > since ? jobs[0].updated_at : since;
            if (age(since) > limit) {
              await db().update("render_jobs", jobs[0].id, {
                status: "failed",
                error: "Tidak ada kabar dari worker",
                updated_at: now(),
              });
              await setAgent("voice", "idle");
              await setAgent("editor", "error", "Render macet");
            }
          }
        }
        if (age(since) > limit) {
          await failContent(c.id, "Proses berhenti tanpa kabar (kemungkinan timeout atau server restart). Tekan Coba lagi untuk melanjutkan.");
        }
      }
    }

    const sessions = await db().list("brainstorms", { eq: { status: "running" } });
    for (const s of sessions) {
      if (age(s.updated_at) > LIMITS.brainstormStep) {
        await db().update("brainstorms", s.id, {
          status: "failed",
          error: "Diskusi berhenti tanpa kabar (kemungkinan timeout). Tekan Ulangi untuk melanjutkan.",
          updated_at: now(),
        });
        await logEvent("system", `Brainstorm "${s.title}" terhenti`, { ref_type: "brainstorm", ref_id: s.id, kind: "error", push: true });
      }
    }

    // Agents stuck in "working" with nothing running return to the lounge.
    const statuses = await db().list("agent_status", { eq: { state: "working" } });
    for (const a of statuses) {
      if (age(a.updated_at) > LIMITS.render) await setAgent(a.id, "idle");
    }
  } catch (err) {
    console.error("watchdog", err);
  }
}
