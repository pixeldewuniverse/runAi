import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/*
 * Thin adapters for each AI provider. Every adapter takes a system prompt,
 * a user prompt and a JSON Schema, and returns raw text that should be JSON.
 * Parsing + validation (zod) and fallback between providers live in lib/llm.ts.
 */

export type ProviderId = "gemini" | "groq" | "openai" | "claude";

export const PROVIDERS: Record<
  ProviderId,
  { label: string; env: string; defaultModel: string; free: boolean; webSearch: boolean; keyUrl: string }
> = {
  gemini: {
    label: "Google Gemini",
    env: "GEMINI_API_KEY",
    defaultModel: "gemini-3.8-flash",
    free: true,
    webSearch: false, // Google Search grounding is not part of the free tier
    keyUrl: "https://aistudio.google.com/apikey",
  },
  groq: {
    label: "Groq",
    env: "GROQ_API_KEY",
    defaultModel: "openai/gpt-oss-120b",
    free: true,
    webSearch: false,
    keyUrl: "https://console.groq.com/keys",
  },
  openai: {
    label: "OpenAI",
    env: "OPENAI_API_KEY",
    defaultModel: "gpt-5-mini",
    free: false,
    webSearch: false,
    keyUrl: "https://platform.openai.com/api-keys",
  },
  claude: {
    label: "Claude (Anthropic)",
    env: "ANTHROPIC_API_KEY",
    defaultModel: "claude-sonnet-5-5",
    free: false,
    webSearch: true,
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
};

export const PROVIDER_ORDER: ProviderId[] = ["groq", "gemini", "openai", "claude"];

export const providerKey = (id: ProviderId) => process.env[PROVIDERS[id].env]?.trim() || "";
export const hasProvider = (id: ProviderId) => Boolean(providerKey(id));

export interface CallInput {
  model: string;
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  maxTokens: number;
  webSearch: boolean;
}

/** Error with enough info to decide whether to fall back to another provider. */
export class ProviderError extends Error {
  constructor(
    public provider: ProviderId,
    public status: number,
    message: string,
  ) {
    super(message);
  }
  /** Human explanation in Indonesian for the UI. */
  get friendly() {
    const name = PROVIDERS[this.provider].label;
    if (this.status === 401 || this.status === 403) return `API key ${name} tidak valid atau tidak punya akses`;
    if (this.status === 429) return `Kuota/batas request ${name} habis untuk sementara`;
    if (this.status === 404) return `Model ${name} tidak ditemukan — cek nama model di Setelan`;
    if (this.status === 402 || /credit balance|insufficient_quota|billing/i.test(this.message))
      return `Saldo/kredit ${name} habis — isi saldo atau pakai penyedia gratis`;
    if (this.status >= 500) return `${name} error ${this.status}: ${this.message.slice(0, 160)}`;
    return `${name}: ${this.message.slice(0, 200)}`;
  }
}

async function failFrom(provider: ProviderId, res: Response): Promise<never> {
  const text = await res.text().catch(() => "");
  let msg = text;
  try {
    const j = JSON.parse(text);
    msg = j.error?.message ?? j.message ?? text;
  } catch {}
  // Some providers signal quota problems with 400 + specific text.
  let status = res.status;
  if (status === 400 && /api key not valid|invalid api key|API_KEY_INVALID/i.test(msg)) status = 401;
  else if (status === 400 && /quota|rate limit|resource_exhausted/i.test(msg)) status = 429;
  throw new ProviderError(provider, status, String(msg).slice(0, 400));
}

/* ── Gemini ───────────────────────────────────────────────────── */

async function geminiRequest(model: string, payload: Record<string, unknown>) {
  return fetch(
    `${process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"}/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": providerKey("gemini") },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(170_000),
    },
  );
}

/*
 * Gemini quirks handled here:
 * - Thinking tokens count toward maxOutputTokens; a small budget ends in an
 *   empty answer (finishReason MAX_TOKENS). We give a large budget and ask
 *   for low thinking.
 * - Some models/schemas reject responseJsonSchema or thinkingConfig (400)
 *   or fail with 500 — we retry with the schema in the prompt instead.
 * - 503 "overloaded" is retried once after a short pause.
 */
const GEMINI_SIBLINGS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];

/** Try the chosen model, then other free Flash models when it's overloaded or rate limited. */
async function callGemini(input: CallInput): Promise<string> {
  const models = [input.model, ...GEMINI_SIBLINGS.filter((m) => m !== input.model)];
  let last: unknown;
  for (const model of models) {
    try {
      return await callGeminiModel({ ...input, model });
    } catch (err) {
      last = err;
      const status = (err as ProviderError).status;
      // Overloaded, rate limited or unknown model: each Flash model has its own quota, try the next.
      if (!(err instanceof ProviderError) || ![429, 503, 404].includes(status)) throw err;
    }
  }
  throw last;
}

async function callGeminiModel({ model, system, prompt, schema, maxTokens }: CallInput): Promise<string> {
  const base = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };
  const budget = Math.max(maxTokens * 4, 16_000);
  const attempts: { label: string; payload: Record<string, unknown> }[] = [
    {
      label: "schema",
      payload: {
        ...base,
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          maxOutputTokens: budget,
          thinkingConfig: { thinkingLevel: "low" },
        },
      },
    },
    {
      label: "prompt-schema",
      payload: {
        systemInstruction: base.systemInstruction,
        contents: [
          {
            role: "user",
            parts: [{ text: `${prompt}\n\nFormat jawaban WAJIB berupa JSON valid sesuai JSON Schema ini:\n${JSON.stringify(schema)}` }],
          },
        ],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: budget },
      },
    },
  ];

  let last: ProviderError | null = null;
  for (const attempt of attempts) {
    for (let retry = 0; retry < 2; retry++) {
      const res = await geminiRequest(model, attempt.payload);
      if (res.ok) {
        const data = await res.json();
        const text: string = (data.candidates?.[0]?.content?.parts ?? [])
          .filter((p: { thought?: boolean }) => !p.thought)
          .map((p: { text?: string }) => p.text ?? "")
          .join("");
        if (text) return text;
        const reason = data.candidates?.[0]?.finishReason ?? data.promptFeedback?.blockReason ?? "kosong";
        last = new ProviderError("gemini", 502, `jawaban kosong (${reason})`);
        break; // try the next attempt style
      }
      try {
        await failFrom("gemini", res);
      } catch (err) {
        last = err as ProviderError;
      }
      if (!last) break;
      if (last.status === 503 && retry === 0) {
        await new Promise((r) => setTimeout(r, 4000));
        continue;
      }
      break;
    }
    // Only fall through to the next attempt style for format/server problems.
    if (last && ![400, 500, 502, 503].includes(last.status)) throw last;
  }
  throw last ?? new ProviderError("gemini", 500, "tidak ada jawaban");
}

/* ── OpenAI-compatible (OpenAI, Groq) ─────────────────────────── */

async function callOpenAICompatible(
  provider: "openai" | "groq",
  { model, system, prompt, schema, maxTokens }: CallInput,
): Promise<string> {
  const base =
    provider === "groq"
      ? process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"
      : process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${providerKey(provider)}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "agent_output", schema, strict: provider === "openai" || model.startsWith("openai/gpt-oss") },
      },
      max_completion_tokens: model.startsWith("openai/gpt-oss") ? Math.max(maxTokens * 2, 8000) : maxTokens,
      // Same setting as the Dewbit chatbot: gpt-oss reasons first, keep it short.
      ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) await failFrom(provider, res);
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new ProviderError(provider, 500, "jawaban kosong");
  return text;
}

/* ── Claude ───────────────────────────────────────────────────── */

let anthropic: Anthropic | null = null;

async function callClaude({ model, system, prompt, schema, maxTokens, webSearch }: CallInput): Promise<string> {
  anthropic ??= new Anthropic({ apiKey: providerKey("claude") });
  const base = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user" as const, content: prompt }],
    output_config: { format: { type: "json_schema" as const, schema } },
  };
  const run = async (search: boolean) => {
    const msg = await anthropic!.messages.create(
      search ? { ...base, tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }] } : base,
    );
    // With web search there can be several text blocks; the structured answer is the last one.
    const texts = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text.trim());
    return texts.filter(Boolean).at(-1) ?? "";
  };
  try {
    try {
      return await run(webSearch);
    } catch (err) {
      if (!webSearch) throw err;
      return await run(false); // web search may be disabled for the org
    }
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const msg = (err as { error?: { error?: { message?: string } } }).error?.error?.message ?? (err as Error).message;
    throw new ProviderError("claude", status, msg);
  }
}

export function callProvider(id: ProviderId, input: CallInput): Promise<string> {
  switch (id) {
    case "gemini":
      return callGemini(input);
    case "groq":
      return callOpenAICompatible("groq", input);
    case "openai":
      return callOpenAICompatible("openai", input);
    case "claude":
      return callClaude(input);
  }
}
