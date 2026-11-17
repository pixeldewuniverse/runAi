import { parseBuffer } from "music-metadata";

/*
 * Text-to-speech shared by the app (Vercel) and the render worker.
 * Gemini TTS is on the free tier; OpenAI / ElevenLabs are optional.
 * No "server-only" import here because the worker (plain Node) uses it too.
 */

export const hasTts = () => Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ELEVENLABS_API_KEY);

async function mp3(data: Buffer): Promise<Audio> {
  const meta = await parseBuffer(data, { mimeType: "audio/mpeg" });
  return { data, mime: "audio/mpeg", ext: "mp3", seconds: meta.format.duration ?? 0 };
}

/* ── Voice (TTS) ─────────────────────────────────────────────── */

export type Voice = { provider: "gemini" | "openai" | "elevenlabs"; voiceId: string };
export type Audio = { data: Buffer; mime: string; ext: string; seconds: number };

/** Wrap raw 16-bit mono PCM (what Gemini TTS returns) in a WAV header. */
function pcmToWav(pcm: Buffer, sampleRate = 24_000) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const GEMINI_TTS_MODELS = [process.env.GEMINI_TTS_MODEL, "gemini-3.8-flash-tts", "gemini-3.1-flash-tts-preview"].filter(
  Boolean,
) as string[];

async function geminiTts(text: string, voiceName: string): Promise<Audio> {
  let lastErr = "";
  for (const model of GEMINI_TTS_MODELS) {
    // Newer TTS models take `voice`, older previews take `prebuiltVoiceConfig`.
    for (const voiceConfig of [{ voice: voiceName }, { prebuiltVoiceConfig: { voiceName } }]) {
      const res = await fetch(`${process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"}/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig } },
        }),
      });
      if (!res.ok) {
        lastErr = `${model} ${res.status}: ${(await res.text()).slice(0, 200)}`;
        if (res.status === 400) continue; // try the other voice format
        break; // 404/429/503 → next model
      }
      const data = await res.json();
      const part = (data.candidates?.[0]?.content?.parts ?? []).find(
        (p: { inlineData?: { data?: string } }) => p.inlineData?.data,
      );
      if (!part) {
        lastErr = `${model}: tidak ada audio`;
        break;
      }
      const mime: string = part.inlineData.mimeType ?? "audio/L16;rate=24000";
      const raw = Buffer.from(part.inlineData.data, "base64");
      const rate = Number(mime.match(/rate=(\d+)/)?.[1] ?? 24_000);
      const wav = mime.includes("wav") ? raw : pcmToWav(raw, rate);
      return { data: wav, mime: "audio/wav", ext: "wav", seconds: (wav.length - 44) / (rate * 2) };
    }
  }
  throw new Error(`Gemini TTS gagal: ${lastErr}`);
}

async function openaiTts(text: string, voice: string): Promise<Audio> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
      voice,
      input: text,
      instructions: "Bicara dalam bahasa Indonesia yang santai dan bersemangat, tempo sedikit cepat seperti kreator TikTok.",
      response_format: "mp3",
    }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
  return mp3(Buffer.from(await res.arrayBuffer()));
}

async function elevenTts(text: string, voiceId: string): Promise<Audio> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2" }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return mp3(Buffer.from(await res.arrayBuffer()));
}

const TTS = {
  gemini: { key: "GEMINI_API_KEY", run: geminiTts, defaultVoice: "Kore" },
  openai: { key: "OPENAI_API_KEY", run: openaiTts, defaultVoice: "alloy" },
  elevenlabs: { key: "ELEVENLABS_API_KEY", run: elevenTts, defaultVoice: "" },
} as const;

/**
 * Speak `text` with the brand's chosen TTS; if that provider has no key or
 * fails, try the others that have keys. Returns null when no TTS key exists
 * at all (the video is then rendered silent with the script timings).
 */
export async function tts(text: string, voice: Voice): Promise<Audio | null> {
  const order = [voice.provider, ...(["gemini", "openai", "elevenlabs"] as const).filter((p) => p !== voice.provider)];
  const available = order.filter((p) => process.env[TTS[p].key]);
  if (!available.length) return null;
  const errors: string[] = [];
  for (const p of available) {
    const v = p === voice.provider && voice.voiceId ? voice.voiceId : TTS[p].defaultVoice;
    if (!v) continue;
    try {
      return await TTS[p].run(text, v);
    } catch (e) {
      errors.push((e as Error).message.slice(0, 200));
    }
  }
  throw new Error(errors.join(" · ") || "TTS gagal");
}

