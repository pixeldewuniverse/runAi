import "server-only";
import { z } from "zod";
import { getAgent, type AgentId } from "./agents";
import { callProvider, PROVIDERS, ProviderError, type ProviderId } from "./ai/providers";
import { getAiSettings, modelFor, providerChain } from "./ai/settings";
import { mockOutput } from "./mock";
import { logEvent } from "./office";

/** True when at least one AI provider has an API key. */
export async function hasAI() {
  return providerChain(await getAiSettings()).length > 0;
}

interface RunOpts<S extends z.ZodType> {
  agent: AgentId;
  /** Brand profile + task-specific context. */
  prompt: string;
  schema: S;
  /** Agent would benefit from live web search (Scout & Researcher). Only some providers can. */
  webSearch?: boolean;
  maxTokens?: number;
}

const NO_INTERNET =
  "\n\nCatatan: di tugas ini kamu TIDAK punya akses internet. Gunakan pengetahuanmu sendiri, utamakan topik evergreen atau tren yang kamu yakini masih relevan, jangan mengarang berita/tanggal/angka spesifik, dan isi field sumber dengan string kosong.";

/** Parse JSON even if the model wrapped it in ``` fences or added text around it. */
export function extractJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1));
    throw new Error("Jawaban bukan JSON");
  }
}

function schemaFor(schema: z.ZodType) {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

/**
 * One agent turn = one AI call that must return JSON matching `schema`.
 * Tries the configured provider first, then the others (if fallback is on).
 * Without any API key it returns demo data so the office can be clicked through.
 */
export async function runAgent<S extends z.ZodType>(opts: RunOpts<S>): Promise<z.infer<S>> {
  const settings = await getAiSettings();
  const chain = providerChain(settings);

  if (!chain.length) {
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 900));
    return opts.schema.parse(mockOutput(opts.agent, opts.prompt));
  }

  const agent = getAgent(opts.agent);
  const jsonSchema = schemaFor(opts.schema);
  const failures: string[] = [];

  for (const [i, provider] of chain.entries()) {
    const canSearch = Boolean(opts.webSearch && PROVIDERS[provider].webSearch && process.env.ENABLE_WEB_SEARCH !== "false");
    const prompt = `${opts.prompt}${opts.webSearch && !canSearch ? NO_INTERNET : ""}\n\nJawab hanya dengan JSON yang sesuai schema.`;
    try {
      return await callWithRepair(provider, {
        model: modelFor(provider, settings),
        system: agent.system,
        prompt,
        schema: jsonSchema,
        maxTokens: opts.maxTokens ?? 4000,
        webSearch: canSearch,
        zod: opts.schema,
      });
    } catch (err) {
      const reason = err instanceof ProviderError ? err.friendly : `${PROVIDERS[provider].label}: ${(err as Error).message}`;
      failures.push(reason);
      const next = chain[i + 1];
      if (next) {
        await logEvent("system", `${reason} — ${agent.name} pindah ke ${PROVIDERS[next].label}`);
      }
    }
  }
  throw new Error(failures.join(" · "));
}

async function callWithRepair<S extends z.ZodType>(
  provider: ProviderId,
  input: Parameters<typeof callProvider>[1] & { zod: S },
): Promise<z.infer<S>> {
  const { zod, ...call } = input;
  let raw = await callOnce(provider, call);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return zod.parse(extractJson(raw));
    } catch (err) {
      if (attempt === 1) throw new Error(`format jawaban tidak sesuai (${(err as Error).message.slice(0, 160)})`);
      // One repair round: show the model its own output and the validation error.
      raw = await callOnce(provider, {
        ...call,
        webSearch: false,
        prompt: `${call.prompt}\n\nJawaban sebelumnya tidak valid:\n${raw.slice(0, 4000)}\n\nKesalahan: ${(err as Error).message.slice(0, 600)}\nUlangi dan kirim JSON yang benar saja.`,
      });
    }
  }
  throw new Error("unreachable");
}

/**
 * Free tiers have per-minute limits. On a 429 that asks to retry soon,
 * wait once (max 40s) before giving up on this provider.
 */
async function callOnce(provider: ProviderId, call: Parameters<typeof callProvider>[1]) {
  try {
    return await callProvider(provider, call);
  } catch (err) {
    if (!(err instanceof ProviderError) || err.status !== 429) throw err;
    const m = err.message.match(/retry in ([\d.]+)\s*s/i) ?? err.message.match(/try again in ([\d.]+)\s*s/i);
    const wait = m ? Number(m[1]) : 20;
    if (wait > 40 || /per ?day|daily|RPD/i.test(err.message)) throw err; // daily quota: don't wait
    await new Promise((r) => setTimeout(r, (wait + 1) * 1000));
    return callProvider(provider, call);
  }
}
