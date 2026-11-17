"use client";

import { Check, LogOut, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { Brand } from "@/lib/brand";
import { api, usePoll } from "@/lib/client";
import type { OfficeData } from "@/lib/types";
import { Button, ErrorNote, PageTitle, Section } from "./ui";

const input = "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink/40";

export function SettingsView() {
  const { data: office } = usePoll<OfficeData>("/api/office", 30_000);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<Brand>("/api/brand").then(setBrand).catch((e) => setMsg({ ok: false, text: String(e.message ?? e) }));
  }, []);

  async function save() {
    if (!brand) return;
    setSaving(true);
    setMsg(null);
    try {
      setBrand(await api<Brand>("/api/brand", { method: "PUT", json: brand }));
      setMsg({ ok: true, text: "Profil brand tersimpan — dipakai semua agent mulai shift berikutnya." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof Brand>(k: K, v: Brand[K]) => setBrand((b) => (b ? { ...b, [k]: v } : b));
  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

  return (
    <div>
      <PageTitle kicker="Setelan" title="Brand & sistem" />

      <Section title="Status sistem">
        <ul className="card divide-y divide-line text-sm">
          {[
            ["Claude API", office?.config.claude, "ANTHROPIC_API_KEY"],
            ["Database Supabase", office?.config.supabase, "NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY"],
            ["Render worker", office?.config.worker, "RENDER_WORKER_URL + RENDER_WORKER_SECRET"],
          ].map(([label, on, env]) => (
            <li key={String(label)} className="flex items-center gap-3 px-4 py-3">
              <span className={`grid size-6 place-items-center rounded-full ${on ? "bg-dew/25" : "bg-ink/5 text-mute"}`}>
                {on ? <Check size={14} /> : <X size={14} />}
              </span>
              <span className="flex-1">
                <span className="font-medium">{label}</span>
                {!on && <span className="block font-mono text-[11px] text-mute">isi {String(env)}</span>}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Profil brand">
        {!brand ? (
          <div className="card shimmer h-64" />
        ) : (
          <div className="card space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nama brand"><input className={input} value={brand.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Handle"><input className={input} value={brand.handle} onChange={(e) => set("handle", e.target.value)} /></Field>
            </div>
            <Field label="Niche"><textarea className={input} rows={2} value={brand.niche} onChange={(e) => set("niche", e.target.value)} /></Field>
            <Field label="Audiens"><textarea className={input} rows={2} value={brand.audience} onChange={(e) => set("audience", e.target.value)} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bahasa"><input className={input} value={brand.language} onChange={(e) => set("language", e.target.value)} /></Field>
              <Field label="CTA standar"><input className={input} value={brand.cta} onChange={(e) => set("cta", e.target.value)} /></Field>
            </div>
            <Field label="Tone"><textarea className={input} rows={2} value={brand.tone} onChange={(e) => set("tone", e.target.value)} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Pilar konten (satu per baris)">
                <textarea className={input} rows={4} value={brand.pillars.join("\n")} onChange={(e) => set("pillars", lines(e.target.value))} />
              </Field>
              <Field label="Hindari (satu per baris)">
                <textarea className={input} rows={4} value={brand.avoid.join("\n")} onChange={(e) => set("avoid", lines(e.target.value))} />
              </Field>
            </div>
            <Field label="Palet">
              <div className="flex flex-wrap items-center gap-2">
                {(["background", "ink"] as const).map((k) => (
                  <ColorInput key={k} value={brand.palette[k]} onChange={(v) => set("palette", { ...brand.palette, [k]: v })} label={k} />
                ))}
                {brand.palette.accents.map((c, i) => (
                  <ColorInput
                    key={i}
                    value={c}
                    label={`aksen ${i + 1}`}
                    onChange={(v) => set("palette", { ...brand.palette, accents: brand.palette.accents.map((x, j) => (j === i ? v : x)) })}
                  />
                ))}
              </div>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Penyedia suara (TTS)">
                <select className={input} value={brand.voice.provider} onChange={(e) => set("voice", { ...brand.voice, provider: e.target.value as Brand["voice"]["provider"] })}>
                  <option value="openai">OpenAI TTS</option>
                  <option value="elevenlabs">ElevenLabs</option>
                </select>
              </Field>
              <Field label={brand.voice.provider === "openai" ? "Voice (mis. alloy, nova, onyx)" : "Voice ID ElevenLabs"}>
                <input className={input} value={brand.voice.voiceId} onChange={(e) => set("voice", { ...brand.voice, voiceId: e.target.value })} />
              </Field>
            </div>
            {msg && (msg.ok ? <p className="rounded-xl bg-dew/20 px-3 py-2 text-sm">{msg.text}</p> : <ErrorNote>{msg.text}</ErrorNote>)}
            <Button className="w-full" onClick={save} loading={saving}>
              Simpan profil brand
            </Button>
          </div>
        )}
      </Section>

      <div className="mt-8 text-center">
        <button
          onClick={async () => {
            await fetch("/api/auth", { method: "DELETE" });
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload clears session state
            window.location.href = "/login";
          }}
          className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink"
        >
          <LogOut size={15} /> Keluar
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}

function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 rounded-xl border border-line bg-paper py-1 pl-1 pr-2.5" title={label}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
      <span className="font-mono text-[11px]">{value}</span>
    </label>
  );
}
