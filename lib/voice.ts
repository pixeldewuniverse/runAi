import "server-only";
import { createClient } from "@supabase/supabase-js";
import { logEvent, setAgent } from "./office";
import { getBrand } from "./settings";
import { db, hasSupabase, now } from "./store";
import { hasTts, tts } from "./tts";
import type { RenderScene } from "./types";

/*
 * Voice-over without the render worker: Vox reads the whole script in ONE
 * TTS request (free tiers have tight per-minute limits), and each scene's
 * length is set from its share of the text so captions stay in sync.
 * The audio goes to Supabase Storage (or inline as a data URL without it),
 * and the browser renderer mixes it into the downloaded MP4.
 */

const PAUSE = 0.35; // seconds of breathing room per scene

async function store(contentId: string, data: Buffer, mime: string, ext: string) {
  if (!hasSupabase()) return `data:${mime};base64,${data.toString("base64")}`;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const key = `${contentId}/voice-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("videos").upload(key, data, { contentType: mime, upsert: true });
  if (error) return `data:${mime};base64,${data.toString("base64")}`; // bucket missing → inline
  return sb.storage.from("videos").getPublicUrl(key).data.publicUrl;
}

/** Returns true when a voice track was added. Never throws. */
export async function voiceInApp(contentId: string): Promise<boolean> {
  if (!hasTts()) return false;
  const ref = { ref_type: "content" as const, ref_id: contentId };
  const content = await db().get("contents", contentId);
  if (!content?.scenes?.length) return false;

  await setAgent("voice", "working", "Merekam voice-over");
  try {
    const brand = await getBrand();
    const scenes: RenderScene[] = content.scenes.map((s) => ({ ...s, audio_url: undefined, track_url: undefined }));
    const script = scenes.map((s) => s.voiceover.trim()).join("\n\n");
    const audio = await tts(script, brand.voice);
    if (!audio || !audio.seconds) throw new Error("audio kosong");

    // Spread the audio length over the scenes by character count.
    const chars = scenes.map((s) => Math.max(8, s.voiceover.length));
    const total = chars.reduce((a, b) => a + b, 0);
    const speech = Math.max(0, audio.seconds - PAUSE * scenes.length);
    const timed = scenes.map((s, i) => ({
      ...s,
      seconds: Math.max(1.5, Math.round(((speech * chars[i]) / total + PAUSE) * 100) / 100),
    }));
    timed[0].track_url = await store(contentId, audio.data, audio.mime, audio.ext);

    await db().update("contents", contentId, { scenes: timed, updated_at: now() });
    await logEvent("voice", `Voice-over selesai (${Math.round(audio.seconds)} detik)`, ref);
    return true;
  } catch (err) {
    await logEvent("voice", `Voice-over gagal, video tanpa suara: ${(err as Error).message.slice(0, 160)}`, {
      ...ref,
      kind: "error",
    });
    return false;
  } finally {
    await setAgent("voice", "idle");
  }
}
