"use client";

import { Check, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { AiStatus } from "@/lib/ai/settings";
import { api } from "@/lib/client";
import { Button, ErrorNote } from "./ui";

const input = "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink/40";

export function AiSettingsCard() {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [draft, setDraft] = useState<AiStatus["settings"] | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<AiStatus>("/api/ai")
      .then((s) => {
        setStatus(s);
        setDraft(s.settings);
      })
      .catch((e) => setMsg({ ok: false, text: String(e.message ?? e) }));
  }, []);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setMsg(null);
    try {
      const s = await api<AiStatus>("/api/ai", { method: "PUT", json: draft });
      setStatus(s);
      setDraft(s.settings);
      setMsg({ ok: true, text: "Tersimpan — berlaku untuk tugas agent berikutnya." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  }

  if (!status || !draft) return <div className="card shimmer h-40" />;
  const configured = status.providers.filter((p) => p.configured);

  return (
    <div className="card space-y-4 p-4">
      <ul className="divide-y divide-line rounded-xl border border-line">
        {status.providers.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full ${p.configured ? "bg-dew/25" : "bg-ink/5 text-mute"}`}>
              {p.configured ? <Check size={14} /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-medium">{p.label}</span>{" "}
              {p.free && <span className="rounded bg-dew/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase">gratis</span>}{" "}
              {status.active === p.id && <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase text-paper">aktif</span>}
              <span className="block font-mono text-[11px] text-mute">
                {p.configured ? p.model : `isi ${p.env} di Vercel`}
              </span>
            </span>
            {!p.configured && (
              <a href={p.keyUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs text-violet">
                Ambil key <ExternalLink size={12} />
              </a>
            )}
          </li>
        ))}
      </ul>

      {configured.length === 0 ? (
        <p className="rounded-xl bg-sun/20 px-3 py-2 text-sm">
          Belum ada API key. Paling mudah: buat key <b>Gemini</b> (gratis) di Google AI Studio, isi <code className="font-mono text-xs">GEMINI_API_KEY</code> di Vercel, lalu redeploy.
        </p>
      ) : (
        <>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-2">Penyedia utama</span>
            <select className={input} value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value as typeof draft.provider })}>
              <option value="auto">Otomatis (yang gratis dulu)</option>
              {configured.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 size-4 accent-ink" checked={draft.fallback} onChange={(e) => setDraft({ ...draft, fallback: e.target.checked })} />
            <span>
              <span className="font-medium">Cadangan otomatis</span>
              <span className="block text-mute">Kalau kuota habis atau error, agent pindah ke penyedia lain yang key-nya terpasang.</span>
            </span>
          </label>

          <details>
            <summary className="cursor-pointer text-xs text-mute">Ganti model (lanjutan)</summary>
            <div className="mt-2 space-y-2">
              {configured.map((p) => (
                <label key={p.id} className="block">
                  <span className="mb-1 block text-xs text-ink-2">{p.label}</span>
                  <input
                    className={`${input} font-mono`}
                    placeholder={p.defaultModel}
                    value={draft.models[p.id] ?? ""}
                    onChange={(e) => setDraft({ ...draft, models: { ...draft.models, [p.id]: e.target.value } })}
                  />
                </label>
              ))}
            </div>
          </details>

          <p className="text-xs text-mute">
            Riset internet (Scout & Reza) aktif dengan Claude, dan dengan Groq bila browser search tersedia di akunmu. Gemini memakai pengetahuan modelnya sendiri.
          </p>

          {msg && (msg.ok ? <p className="rounded-xl bg-dew/20 px-3 py-2 text-sm">{msg.text}</p> : <ErrorNote>{msg.text}</ErrorNote>)}
          <Button className="w-full" onClick={save} loading={saving}>
            Simpan pengaturan AI
          </Button>
        </>
      )}
    </div>
  );
}
