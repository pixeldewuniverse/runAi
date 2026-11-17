import "server-only";
import type { z } from "zod";
import { getAgent, type AgentId } from "../agents";
import { runAgent } from "../llm";
import { logEvent, withAgent } from "../office";
import {
  ArchitectureSchema,
  BriefSchema,
  CritiqueSchema,
  FacilitatorSchema,
  ResearchSchema,
} from "../schemas";
import { brandContext, getBrand } from "../settings";
import { db, now, uid } from "../store";
import type { BrainstormMessageRow, BrainstormRow } from "../types";

/*
 * Brainstorm round:  Facilitator ─▶ Researcher ─▶ Devil's Advocate ─▶ Architect ─▶ PM (brief)
 * After each round you can answer the facilitator's questions or add direction;
 * the team runs another round on the full transcript and updates the brief.
 */

const ROUND: { agent: AgentId; task: string; schema: z.ZodType; webSearch?: boolean }[] = [
  { agent: "facilitator", task: "Merumuskan masalah", schema: FacilitatorSchema },
  { agent: "researcher", task: "Riset pembanding", schema: ResearchSchema, webSearch: true },
  { agent: "critic", task: "Mencari kelemahan ide", schema: CritiqueSchema },
  { agent: "architect", task: "Merancang solusi teknis", schema: ArchitectureSchema },
  { agent: "pm", task: "Menyusun project brief", schema: BriefSchema },
];

export async function createBrainstorm(idea: string): Promise<BrainstormRow> {
  const clean = idea.trim();
  const row: BrainstormRow = {
    id: uid(),
    title: clean.split("\n")[0].slice(0, 80),
    idea: clean,
    status: "running",
    brief: null,
    error: null,
    created_at: now(),
    updated_at: now(),
  };
  await db().insert("brainstorms", row);
  await addMessage(row.id, "user", { text: clean });
  await logEvent("user", `Brainstorm baru: ${row.title}`, { ref_type: "brainstorm", ref_id: row.id });
  return row;
}

async function addMessage(session_id: string, author: BrainstormMessageRow["author"], body: Record<string, unknown>) {
  await db().insert("brainstorm_messages", { id: uid(), session_id, author, body, created_at: now() });
}

export async function getTranscript(id: string) {
  return db().list("brainstorm_messages", { eq: { session_id: id }, order: { column: "created_at" } });
}

function render(messages: BrainstormMessageRow[]) {
  return messages
    .map((m) => {
      const who = m.author === "user" ? "PEMILIK PROJECT" : `${getAgent(m.author).role.toUpperCase()}`;
      return `### ${who}\n${m.author === "user" ? String(m.body.text) : JSON.stringify(m.body, null, 2)}`;
    })
    .join("\n\n");
}

export async function runBrainstormRound(id: string) {
  const ref = { ref_type: "brainstorm" as const, ref_id: id };
  try {
    const session = await db().get("brainstorms", id);
    if (!session) throw new Error("Sesi tidak ditemukan");
    const brand = await getBrand();

    for (const step of ROUND) {
      const transcript = render(await getTranscript(id));
      const out = (await withAgent(step.agent, step.task, ref, () =>
        runAgent({
          agent: step.agent,
          schema: step.schema,
          webSearch: step.webSearch,
          prompt: `Konteks pemilik project (freelance developer & desainer):\n${brandContext(brand)}\n\nTRANSKRIP DISKUSI SEJAUH INI:\n${transcript}\n\nSekarang giliranmu. Tanggapi berdasarkan seluruh diskusi di atas, terutama masukan terbaru dari pemilik project.`,
        }),
      )) as Record<string, unknown>;
      await addMessage(id, step.agent, out);
      if (step.agent === "pm") {
        await db().update("brainstorms", id, {
          brief: BriefSchema.parse(out),
          title: String(out.title || session.title),
        });
      }
    }

    await db().update("brainstorms", id, { status: "awaiting_user", updated_at: now() });
    await logEvent("pm", "Project brief siap — balas untuk iterasi berikutnya", { ...ref, kind: "approval" });
  } catch (err) {
    await db().update("brainstorms", id, {
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
      updated_at: now(),
    });
  }
}

export async function replyBrainstorm(id: string, text: string) {
  const s = await db().get("brainstorms", id);
  if (!s) throw new Error("Sesi tidak ditemukan");
  if (s.status === "running") throw new Error("Tim masih berdiskusi, tunggu sebentar");
  await addMessage(id, "user", { text: text.trim() });
  await logEvent("user", "Menambahkan arahan ke brainstorm", { ref_type: "brainstorm", ref_id: id });
  return db().update("brainstorms", id, { status: "running", error: null, updated_at: now() });
}

export async function closeBrainstorm(id: string) {
  return db().update("brainstorms", id, { status: "done", updated_at: now() });
}
