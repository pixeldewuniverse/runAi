import "server-only";
import { runAgent } from "../llm";
import { logEvent, setAgent, withAgent } from "../office";
import { IdeasSchema, PublishSchema, ReviewSchema, ScriptSchema, StoryboardSchema, TrendsSchema, type Idea, type StoryboardScene } from "../schemas";
import { brandContext, getBrand } from "../settings";
import { db, now, uid } from "../store";
import type { ContentRow, ContentStatus, RenderScene } from "../types";
import { dispatchRender } from "../render";

/*
 * Daily content pipeline
 *
 *  Scout ─▶ Strategist ─▶ [you pick 1 of 3 ideas]
 *        ─▶ Scriptwriter ─▶ Visual Director ─▶ [you approve or ask for a revision]
 *        ─▶ Publisher ─▶ Voice + Editor (render worker) ─▶ [you approve the video]
 *        ─▶ ready to post
 */

const ref = (id: string) => ({ ref_type: "content" as const, ref_id: id });

async function patch(id: string, p: Partial<ContentRow>) {
  return db().update("contents", id, { ...p, updated_at: now() });
}

async function load(id: string) {
  const row = await db().get("contents", id);
  if (!row) throw new Error("Konten tidak ditemukan");
  return row;
}

function assertStatus(row: ContentRow, ...allowed: ContentStatus[]) {
  if (!allowed.includes(row.status)) {
    throw new Error(`Status konten "${row.status}" tidak bisa diproses untuk langkah ini`);
  }
}

export async function fail(id: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  const row = await db().get("contents", id);
  if (!row || row.status === "failed") return;
  await patch(id, { status: "failed", error: msg, failed_status: row.status });
  await logEvent("system", `Konten "${row.title ?? "hari ini"}" gagal: ${msg.slice(0, 120)}`, {
    ...ref(id),
    kind: "error",
    push: true,
  });
}

/** Step 0: create the row (fast, returned to the caller). */
export async function createContent(topicHint?: string): Promise<ContentRow> {
  const row: ContentRow = {
    id: uid(),
    status: "researching",
    title: null,
    trends: null,
    ideas: null,
    picked: null,
    script: null,
    storyboard: null,
    scenes: null,
    publish: null,
    video_url: null,
    feedback: topicHint?.trim() || null,
    error: null,
    failed_status: null,
    created_at: now(),
    updated_at: now(),
  };
  await db().insert("contents", row);
  await logEvent("system", "Shift konten harian dimulai", ref(row.id));
  return row;
}

/** Step 1: research + 3 ideas. Runs in the background. */
export async function runIdeation(id: string) {
  try {
    const row = await load(id);
    const brand = await getBrand();
    const ctx = brandContext(brand);
    const today = new Date().toLocaleDateString("id-ID", { dateStyle: "full", timeZone: "Asia/Jakarta" });
    const hint = row.feedback ? `\nArahan dari pemilik brand untuk hari ini: ${row.feedback}` : "";

    const trends = await withAgent("scout", "Mencari tren hari ini", ref(id), () =>
      runAgent({
        agent: "scout",
        webSearch: true,
        schema: TrendsSchema,
        prompt: `${ctx}\n\nTanggal: ${today}.${hint}\nTemukan 5 topik yang relevan untuk niche brand hari ini.`,
      }),
    );
    await patch(id, { trends });

    const past = await db().list("contents", { order: { column: "created_at", ascending: false }, limit: 30 });
    const pastTitles = past.map((c) => c.title).filter(Boolean);

    const { ideas } = await withAgent("strategist", "Menyusun 3 ide konten", ref(id), () =>
      runAgent({
        agent: "strategist",
        schema: IdeasSchema,
        prompt: `${ctx}${hint}\n\nTemuan Scout:\n${JSON.stringify(trends.trends, null, 2)}\n\nKonten yang sudah pernah dibuat (jangan diulang):\n${pastTitles.join("\n") || "(belum ada)"}\n\nBuat tepat 3 ide.`,
      }),
    );

    await patch(id, { ideas: ideas.slice(0, 3), status: "awaiting_pick", feedback: null });
    await setAgent("strategist", "waiting", "Menunggu kamu pilih ide");
    await logEvent("strategist", "3 ide siap — pilih satu", { ...ref(id), kind: "approval" });
  } catch (err) {
    await fail(id, err);
  }
}

/** Step 2a: user picks an idea (or writes their own). */
export async function pickIdea(id: string, choice: { index?: number; custom?: Idea }) {
  const row = await load(id);
  assertStatus(row, "awaiting_pick");
  const picked = choice.custom ?? row.ideas?.[choice.index ?? -1];
  if (!picked) throw new Error("Ide tidak valid");
  await setAgent("strategist", "idle");
  await logEvent("user", `Memilih ide: ${picked.title}`, ref(id));
  return patch(id, { picked, title: picked.title, status: "scripting" });
}

/** Step 2b: script + storyboard. Runs in the background. */
export async function runScripting(id: string) {
  try {
    const row = await load(id);
    const brand = await getBrand();
    const ctx = brandContext(brand);
    const revision =
      row.feedback && row.script
        ? `\n\nREVISI — script sebelumnya:\n${JSON.stringify(row.script, null, 2)}\n\nCatatan revisi dari pemilik brand: ${row.feedback}\nPerbaiki sesuai catatan, pertahankan bagian yang sudah bagus.`
        : "";

    const draft = await withAgent("scriptwriter", revision ? "Merevisi script" : "Menulis script", ref(id), () =>
      runAgent({
        agent: "scriptwriter",
        schema: ScriptSchema,
        maxTokens: 5000,
        prompt: `${ctx}\n\nIde terpilih:\n${JSON.stringify(row.picked, null, 2)}\n\nRiset pendukung dari Scout:\n${JSON.stringify(row.trends?.trends ?? [], null, 2)}\n\nTulis script video 35–60 detik yang padat informasi. CTA penutup: "${brand.cta}".${revision}`,
      }),
    );

    // Second pair of eyes: score the draft and return an improved version.
    const script = await withAgent("reviewer", "Mengecek & memperbaiki script", ref(id), async () => {
      try {
        const review = await runAgent({
          agent: "reviewer",
          schema: ReviewSchema,
          maxTokens: 6000,
          prompt: `${ctx}\n\nIde:\n${JSON.stringify(row.picked, null, 2)}${row.feedback ? `\n\nCatatan pemilik brand yang WAJIB dipenuhi: ${row.feedback}` : ""}\n\nDraft script:\n${JSON.stringify(draft, null, 2)}`,
        });
        await logEvent("reviewer", `Nilai draft ${review.score}/10 — ${review.issues.slice(0, 2).join("; ") || "sudah bagus"}`, ref(id));
        return review.script.scenes.length >= 3 ? review.script : draft;
      } catch {
        return draft; // review is a bonus; never block the pipeline on it
      }
    });

    const storyboard = await withAgent("director", "Membuat storyboard", ref(id), () =>
      runAgent({
        agent: "director",
        schema: StoryboardSchema,
        maxTokens: 6000,
        prompt: `${ctx}\n\nScript (${script.scenes.length} scene):\n${JSON.stringify(script.scenes, null, 2)}\n\nBuat storyboard dengan jumlah scene SAMA PERSIS (${script.scenes.length}), urutan sama. Ingat aturan variasi layout & tema.`,
      }),
    );

    await patch(id, {
      script,
      storyboard,
      title: script.title,
      scenes: mergeScenes(script, storyboard, brand.palette.accents),
      status: "awaiting_script",
      feedback: null,
    });
    await setAgent("scriptwriter", "waiting", "Menunggu approval script");
    await logEvent("scriptwriter", "Script & storyboard siap direview", { ...ref(id), kind: "approval" });
  } catch (err) {
    await fail(id, err);
  }
}

/** Remove markdown the model may add (`code`, **bold**, # headings) — TTS would read it aloud. */
export function plain(text: string) {
  return text
    .replace(/```[a-z]*\n?|```/gi, "")
    .replace(/[`*_~]+/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function mergeScenes(
  script: NonNullable<ContentRow["script"]>,
  storyboard: NonNullable<ContentRow["storyboard"]>,
  accents: string[],
): RenderScene[] {
  const last = script.scenes.length - 1;
  return script.scenes.map((s, i) => {
    const b: StoryboardScene = storyboard.scenes[i] ?? {
      layout: i === 0 ? "hook" : i === last ? "cta" : "statement",
      theme: i === 0 || i === last ? "dark" : i % 2 ? "light" : "accent",
      headline: s.on_screen,
      body: s.detail ?? "",
      items: [],
      items_b: [],
      labels: [],
      code: "",
      stat: "",
      accent: accents[i % accents.length],
    };
    return {
      voiceover: plain(s.voiceover),
      on_screen: plain(s.on_screen),
      seconds: Math.min(Math.max(s.seconds || 4, 2), 15),
      ...b,
      headline: plain(b.headline || s.on_screen),
      // Fall back to the script's on-screen detail so information is never lost.
      body: plain(b.body || (["hook", "cta"].includes(b.layout) ? "" : (s.detail ?? ""))),
      items: (b.items ?? []).map(plain).filter(Boolean),
      items_b: (b.items_b ?? []).map(plain).filter(Boolean),
      labels: (b.labels ?? []).map(plain),
      accent: /^#[0-9a-f]{6}$/i.test(b.accent) ? b.accent : accents[i % accents.length],
    };
  });
}

/** User asks for changes on the script. */
export async function requestRevision(id: string, note: string) {
  const row = await load(id);
  assertStatus(row, "awaiting_script", "awaiting_final");
  await setAgent("scriptwriter", "idle");
  await logEvent("user", `Minta revisi: ${note}`, ref(id));
  return patch(id, { feedback: note, status: "scripting", video_url: null });
}

/** Step 3: script approved → publish plan → render. */
export async function approveScript(id: string) {
  const row = await load(id);
  assertStatus(row, "awaiting_script");
  await setAgent("scriptwriter", "idle");
  await logEvent("user", "Script disetujui", ref(id));
  return patch(id, { status: "rendering" });
}

export async function runProduction(id: string) {
  try {
    const row = await load(id);
    const brand = await getBrand();
    const publish = await withAgent("publisher", "Menyiapkan caption & jadwal", ref(id), () =>
      runAgent({
        agent: "publisher",
        schema: PublishSchema,
        prompt: `${brandContext(brand)}\n\nScript final:\n${JSON.stringify(row.script, null, 2)}`,
      }),
    );
    await patch(id, { publish });
    await dispatchRender(id);
  } catch (err) {
    await fail(id, err);
  }
}

/** Step 4: final video approved → ready to post. */
export async function approveFinal(id: string) {
  const row = await load(id);
  assertStatus(row, "awaiting_final");
  await setAgent("editor", "idle");
  await logEvent("user", "Video disetujui — siap posting", { ...ref(id), kind: "done" });
  return patch(id, { status: "ready" });
}

export async function markPublished(id: string) {
  const row = await load(id);
  assertStatus(row, "ready");
  await logEvent("publisher", "Ditandai sudah diposting", { ...ref(id), kind: "done" });
  return patch(id, { status: "published" });
}

export async function rejectContent(id: string) {
  const row = await load(id);
  if (["published", "rejected"].includes(row.status)) return row;
  for (const a of ["strategist", "scriptwriter", "editor"] as const) await setAgent(a, "idle");
  await logEvent("user", "Konten dibatalkan", ref(id));
  return patch(id, { status: "rejected" });
}

/** Retry a failed content from the step where it stopped. */
export async function retryContent(id: string): Promise<ContentStatus> {
  const row = await load(id);
  assertStatus(row, "failed");
  const status = resumeStatus(row);
  await patch(id, { status, error: null, failed_status: null });
  await logEvent("user", "Mengulang dari langkah terakhir", ref(id));
  return status;
}

function resumeStatus(row: ContentRow): ContentStatus {
  if (row.failed_status && ["researching", "scripting", "rendering"].includes(row.failed_status)) {
    return row.failed_status;
  }
  // Older rows without failed_status: infer from what exists.
  if (!row.ideas) return "researching";
  if (!row.picked) return "awaiting_pick";
  if (!row.script) return "scripting";
  return "rendering";
}
