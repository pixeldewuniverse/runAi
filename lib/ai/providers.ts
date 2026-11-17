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

export const PROVIDER_ORDER: ProviderId[] = ["gemini", "groq", "openai", "claude"];

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
    if (this.status === 402) return `Saldo ${name} habis`;
    if (this.status >= 500) return `Server ${name} sedang bermasalah`;
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
  const status = /quota|rate limit|resource_exhausted/i.test(msg) && res.status === 400 ? 429 : res.status;
  throw new ProviderError(provider, status, String(msg).slice(0, 400));
}

/* ── Gemini ───────────────────────────────────────────────────── */

async function callGemini({ model, system, prompt, schema, maxTokens }: CallInput): Promise<string> {
  const res = await fetch(
    `${process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"}/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": providerKey("gemini") },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          maxOutputTokens: maxTokens,
        },
      }),
      signal: AbortSignal.timeout(180_000),
    },
  );
  if (!res.ok) await failFrom("gemini", res);
  const data = await res.json();
  const text: string = (data.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) {
    const reason = data.candidates?.[0]?.finishReason ?? data.promptFeedback?.blockReason ?? "kosong";
    throw new ProviderError("gemini", 500, `Gemini tidak memberi jawaban (${reason})`);
  }
  return text;
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
      [provider === "openai" ? "max_completion_tokens" : "max_tokens"]: maxTokens,
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
