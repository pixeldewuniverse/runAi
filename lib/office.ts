import "server-only";
import { AGENT_MAP, AGENTS, getAgent, type AgentId } from "./agents";
import { notify } from "./push";
import { db, now, uid } from "./store";
import type { AgentState, AgentStatusRow, EventRow } from "./types";

/** Current state of every agent (missing rows default to idle in the lounge). */
export async function getAgentStatuses(): Promise<AgentStatusRow[]> {
  const rows = await db().list("agent_status");
  const byId = new Map(rows.map((r) => [r.id, r]));
  return AGENTS.map(
    (a) =>
      byId.get(a.id) ?? { id: a.id, state: "idle", room: "lounge", task: null, updated_at: now() },
  );
}

export async function setAgent(id: AgentId, state: AgentState, task: string | null = null) {
  const room = state === "idle" ? "lounge" : getAgent(id).room;
  await db().upsert("agent_status", { id, state, room, task, updated_at: now() });
}

export async function logEvent(
  agent_id: EventRow["agent_id"],
  message: string,
  opts: {
    kind?: EventRow["kind"];
    ref_type?: EventRow["ref_type"];
    ref_id?: string | null;
    /** Push to the phone. Defaults to true for "approval" events. */
    push?: boolean;
  } = {},
) {
  const kind = opts.kind ?? "info";
  if (opts.push ?? kind === "approval") {
    const who = agent_id in AGENT_MAP ? AGENT_MAP[agent_id as AgentId].name : "runAI";
    await notify({
      title: kind === "error" ? "⚠️ Ada yang gagal" : `${who} butuh keputusanmu`,
      body: message,
      url: opts.ref_id ? `/${opts.ref_type === "brainstorm" ? "brainstorm" : "content"}/${opts.ref_id}` : "/",
      tag: opts.ref_id ?? undefined,
    });
  }
  await db().insert("events", {
    id: uid(),
    agent_id,
    kind,
    message,
    ref_type: opts.ref_type ?? null,
    ref_id: opts.ref_id ?? null,
    created_at: now(),
  });
}

/**
 * Run one unit of agent work with office bookkeeping: the agent walks to its
 * room, shows the task, then goes back to the lounge (or shows an error).
 */
export async function withAgent<T>(
  id: AgentId,
  task: string,
  ref: { ref_type: EventRow["ref_type"]; ref_id: string },
  fn: () => Promise<T>,
): Promise<T> {
  await setAgent(id, "working", task);
  await logEvent(id, task, ref);
  try {
    const out = await fn();
    await setAgent(id, "idle");
    return out;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await setAgent(id, "error", msg.slice(0, 140));
    await logEvent(id, `Gagal: ${msg}`, { ...ref, kind: "error" });
    throw err;
  }
}
