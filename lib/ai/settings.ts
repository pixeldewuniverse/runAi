import "server-only";
import { z } from "zod";
import { db, now } from "../store";
import { hasProvider, PROVIDER_ORDER, PROVIDERS, type ProviderId } from "./providers";

const ProviderEnum = z.enum(["gemini", "groq", "openai", "claude"]);

export const AiSettingsSchema = z.object({
  /** "auto" = first provider with an API key, free ones first. */
  provider: z.union([z.literal("auto"), ProviderEnum]),
  /** Try the other configured providers when the main one fails (quota, outage, bad key). */
  fallback: z.boolean(),
  /** Optional model override per provider. Empty = default. */
  models: z.partialRecord(ProviderEnum, z.string()),
});
export type AiSettings = z.infer<typeof AiSettingsSchema>;

export const DEFAULT_AI: AiSettings = { provider: "auto", fallback: true, models: {} };

export async function getAiSettings(): Promise<AiSettings> {
  const row = await db().get("settings", "ai");
  const parsed = AiSettingsSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : DEFAULT_AI;
}

export async function saveAiSettings(s: AiSettings) {
  await db().upsert("settings", { key: "ai", value: s, updated_at: now() });
}

export function modelFor(id: ProviderId, s: AiSettings) {
  const envModel = process.env[`${id.toUpperCase()}_MODEL`] || (id === "claude" ? process.env.ANTHROPIC_MODEL : undefined);
  return s.models[id]?.trim() || envModel || PROVIDERS[id].defaultModel;
}

/** Ordered list of providers to try for one agent call. */
export function providerChain(s: AiSettings): ProviderId[] {
  const configured = PROVIDER_ORDER.filter(hasProvider);
  if (!configured.length) return [];
  const primary = s.provider !== "auto" && configured.includes(s.provider) ? s.provider : configured[0];
  return s.fallback ? [primary, ...configured.filter((p) => p !== primary)] : [primary];
}

export async function aiStatus() {
  const s = await getAiSettings();
  const chain = providerChain(s);
  return {
    settings: s,
    active: chain[0] ?? null,
    chain,
    providers: PROVIDER_ORDER.map((id) => ({
      id,
      label: PROVIDERS[id].label,
      configured: hasProvider(id),
      free: PROVIDERS[id].free,
      webSearch: PROVIDERS[id].webSearch,
      env: PROVIDERS[id].env,
      keyUrl: PROVIDERS[id].keyUrl,
      model: modelFor(id, s),
      defaultModel: PROVIDERS[id].defaultModel,
    })),
  };
}
export type AiStatus = Awaited<ReturnType<typeof aiStatus>>;
