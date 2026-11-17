import { connection } from "next/server";
import { ok } from "@/lib/api";
import { providerChain, getAiSettings } from "@/lib/ai/settings";
import { PROVIDERS } from "@/lib/ai/providers";
import { getAgentStatuses } from "@/lib/office";
import { hasWorker } from "@/lib/render";
import { db, hasSupabase } from "@/lib/store";
import { sweepStale } from "@/lib/watchdog";

const PENDING = ["awaiting_pick", "awaiting_script", "awaiting_final"];

export async function GET() {
  await connection();
  await sweepStale();
  const aiActive = providerChain(await getAiSettings())[0] ?? null;
  const [agents, events, contents, brainstorms] = await Promise.all([
    getAgentStatuses(),
    db().list("events", { order: { column: "created_at", ascending: false }, limit: 30 }),
    db().list("contents", { order: { column: "created_at", ascending: false }, limit: 50 }),
    db().list("brainstorms", { order: { column: "created_at", ascending: false }, limit: 20 }),
  ]);

  return ok({
    agents,
    events,
    approvals: contents
      .filter((c) => PENDING.includes(c.status))
      .map((c) => ({ id: c.id, status: c.status, title: c.title })),
    stats: {
      contentToday: contents.filter(
        (c) => new Date(c.created_at).toDateString() === new Date().toDateString(),
      ).length,
      ready: contents.filter((c) => c.status === "ready").length,
      published: contents.filter((c) => c.status === "published").length,
      brainstorms: brainstorms.length,
    },
    config: {
      ai: aiActive ? PROVIDERS[aiActive].label : null,
      supabase: hasSupabase(),
      worker: hasWorker(),
      store: db().kind,
    },
  });
}
