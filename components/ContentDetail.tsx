"use client";

import { ArrowLeft, Check, Copy, Download, PenLine, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AGENT_MAP, type AgentId } from "@/lib/agents";
import type { Brand } from "@/lib/brand";
import { api, timeAgo, usePoll } from "@/lib/client";
import { CONTENT_STATUS, STEPS } from "@/lib/labels";
import type { Idea } from "@/lib/schemas";
import type { ContentRow } from "@/lib/types";
import { Robot } from "./Robot";
import { Button, Chip, ErrorNote, Section } from "./ui";
import { DownloadVideo } from "./DownloadVideo";
import { VideoPreview } from "./VideoPreview";

const fileNameFor = (c: ContentRow) =>
  `pixeldew-${(c.title ?? "konten").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}`;

const WORKING: Partial<Record<ContentRow["status"], { agents: AgentId[]; text: string }>> = {
  researching: { agents: ["scout", "strategist"], text: "Scout sedang riset tren, lalu Strat menyusun 3 ide…" },
  scripting: { agents: ["scriptwriter", "director"], text: "Scripty menulis script, Dira membuat storyboard…" },
  rendering: { agents: ["publisher", "voice", "editor"], text: "Pubby menyiapkan caption, Vox & Edi memproduksi video…" },
};

export function ContentDetail({ id }: { id: string }) {
  const { data: c, error, refresh } = usePoll<ContentRow>(`/api/content/${id}`, 2500);
  const { data: brand } = usePoll<Brand>("/api/brand", 60_000);
  const [busy, setBusy] = useState<string | null>(null);
  const [actErr, setActErr] = useState<string | null>(null);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    setActErr(null);
    try {
      await api(`/api/content/${id}`, { method: "POST", json: { action, ...extra } });
      await refresh();
    } catch (e) {
      setActErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  if (error && !c) return <ErrorNote>{error}</ErrorNote>;
  if (!c) return <div className="card shimmer h-64" />;

  const s = CONTENT_STATUS[c.status];
  const stepIdx = STEPS.findIndex((st) => st.statuses.includes(c.status));
  const work = WORKING[c.status];

  return (
    <div>
      <Link href="/content" className="mb-3 inline-flex items-center gap-1 text-sm text-mute hover:text-ink">
        <ArrowLeft size={16} /> Semua konten
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label">Konten · {timeAgo(c.created_at)}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{c.title ?? "Konten hari ini"}</h1>
        </div>
        <Chip tone={s.tone}>{s.label}</Chip>
      </header>

      {/* stepper */}
      <ol className="mt-4 grid grid-cols-5 gap-1.5">
        {STEPS.map((st, i) => (
          <li key={st.key}>
            <div className={`h-1.5 rounded-full ${i < stepIdx || c.status === "published" ? "bg-ink" : i === stepIdx ? "bg-dew" : "bg-ink/10"}`} />
            <p className={`mt-1.5 text-[11px] ${i === stepIdx ? "font-semibold text-ink" : "text-mute"}`}>{st.label}</p>
          </li>
        ))}
      </ol>

      {actErr && <div className="mt-4"><ErrorNote>{actErr}</ErrorNote></div>}

      {work && <Working agents={work.agents} text={work.text} />}

      {c.status === "failed" && (
        <div className="mt-5 space-y-3">
          <ErrorNote>{c.error ?? "Terjadi kesalahan."}</ErrorNote>
          <Button onClick={() => act("retry")} loading={busy === "retry"}>
            <RotateCcw size={16} /> Coba lagi dari langkah terakhir
          </Button>
        </div>
      )}

      {c.status === "awaiting_pick" && c.ideas && (
        <PickIdea ideas={c.ideas} busy={busy} onPick={(index) => act("pick", { index })} onCustom={(custom) => act("pick", { custom })} />
      )}

      {c.status === "awaiting_script" && c.script && (
        <>
          <Section title="Preview">
            {c.scenes && brand ? <VideoPreview scenes={c.scenes} brand={brand} /> : null}
            <p className="mt-2 text-center text-xs text-mute">Preview tanpa suara — voice-over dibuat saat produksi.</p>
          </Section>
          <ScriptView c={c} />
          <Decision
            approveLabel="Setujui script & produksi"
            busy={busy}
            onApprove={() => act("approve_script")}
            onRevise={(note) => act("revise", { note })}
            onReject={() => act("reject")}
          />
        </>
      )}

      {c.status === "awaiting_final" && (
        <>
          <Section title="Video final">
            {c.video_url ? (
              <video src={c.video_url} controls playsInline className="mx-auto w-full max-w-[300px] rounded-[22px] border border-line bg-ink" />
            ) : c.scenes && brand ? (
              <>
                <VideoPreview scenes={c.scenes} brand={brand} />
                <div className="mt-3 flex justify-center">
                  <DownloadVideo scenes={c.scenes} brand={brand} fileName={fileNameFor(c)} />
                </div>
              </>
            ) : null}
          </Section>
          <PublishView c={c} />
          <Decision
            approveLabel="Setujui video"
            busy={busy}
            onApprove={() => act("approve_final")}
            onRevise={(note) => act("revise", { note })}
            onReject={() => act("reject")}
          />
        </>
      )}

      {(c.status === "ready" || c.status === "published") && (
        <>
          <Section title="Siap diposting">
            {c.video_url ? (
              <video src={c.video_url} controls playsInline className="mx-auto w-full max-w-[300px] rounded-[22px] border border-line bg-ink" />
            ) : c.scenes && brand ? (
              <VideoPreview scenes={c.scenes} brand={brand} />
            ) : null}
            {!c.video_url && c.scenes && brand && (
              <div className="mt-3 flex justify-center">
                <DownloadVideo scenes={c.scenes} brand={brand} fileName={fileNameFor(c)} />
              </div>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {c.video_url && (
                <a href={c.video_url} download className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper">
                  <Download size={16} /> Unduh MP4
                </a>
              )}
              {c.status === "ready" && (
                <Button variant="accent" onClick={() => act("published")} loading={busy === "published"}>
                  <Check size={16} /> Tandai sudah diposting
                </Button>
              )}
            </div>
          </Section>
          <PublishView c={c} />
        </>
      )}

      {c.script && !["awaiting_script"].includes(c.status) && (
        <details className="mt-6">
          <summary className="label cursor-pointer">Lihat script</summary>
          <ScriptView c={c} />
        </details>
      )}

      {c.trends && (
        <details className="mt-4">
          <summary className="label cursor-pointer">Temuan Scout</summary>
          <ul className="card mt-2 divide-y divide-line">
            {c.trends.trends.map((t, i) => (
              <li key={i} className="px-4 py-3 text-sm">
                <p className="font-medium">{t.topic}</p>
                <p className="text-mute">{t.why_now}</p>
                {t.source && /^https?:/.test(t.source) ? (
                  <a href={t.source} target="_blank" rel="noreferrer" className="text-xs text-violet underline">
                    sumber
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      )}

      {!["rejected", "published", "ready"].includes(c.status) && (
        <div className="mt-8 text-center">
          <button onClick={() => act("reject")} className="text-xs text-mute underline hover:text-danger">
            Batalkan konten ini
          </button>
        </div>
      )}
    </div>
  );
}

function Working({ agents, text }: { agents: AgentId[]; text: string }) {
  return (
    <div className="card dot-floor mt-5 flex flex-col items-center px-6 py-10 text-center">
      <div className="flex gap-3">
        {agents.map((a) => (
          <span key={a} className="bot-working flex flex-col items-center">
            <Robot color={AGENT_MAP[a].color} mood="working" size={48} />
            <span className="mt-1 font-mono text-[10px] text-ink-2">{AGENT_MAP[a].name}</span>
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-2">{text}</p>
      <p className="mt-1 text-xs text-mute">Halaman ini memperbarui sendiri. Kamu boleh tinggalkan dulu.</p>
    </div>
  );
}

function PickIdea({
  ideas,
  busy,
  onPick,
  onCustom,
}: {
  ideas: Idea[];
  busy: string | null;
  onPick: (i: number) => void;
  onCustom: (idea: Idea) => void;
}) {
  const [own, setOwn] = useState(false);
  const [title, setTitle] = useState("");
  const [angle, setAngle] = useState("");

  return (
    <Section title="Pilih satu ide">
      <ul className="space-y-3">
        {ideas.map((idea, i) => (
          <li key={i} className="card p-4">
            <p className="label">{idea.pillar}</p>
            <h3 className="mt-1 text-lg font-semibold leading-snug">{idea.title}</h3>
            <p className="mt-2 rounded-xl bg-paper px-3 py-2 text-sm">
              <span className="font-mono text-[10px] uppercase text-mute">hook </span>“{idea.hook}”
            </p>
            <p className="mt-2 text-sm text-ink-2">{idea.angle}</p>
            {idea.key_points?.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {idea.key_points.map((k, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 bg-dew" />
                    {k}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-1 text-xs text-mute">
              {idea.format} · {idea.why}
            </p>
            <Button className="mt-3 w-full" onClick={() => onPick(i)} loading={busy === "pick"} disabled={!!busy}>
              Pakai ide ini
            </Button>
          </li>
        ))}
      </ul>
      {own ? (
        <div className="card mt-3 space-y-2 p-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul / topik" className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none" />
          <textarea value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="Poin-poin yang mau disampaikan (satu per baris)" rows={3} className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none" />
          <Button
            className="w-full"
            disabled={title.trim().length < 3 || !!busy}
            loading={busy === "pick"}
            onClick={() =>
              onCustom({
                title,
                angle,
                key_points: angle.split("\n").map((x) => x.trim()).filter(Boolean),
                hook: "",
                pillar: "Pilihan pemilik brand",
                format: "Bebas",
                why: "Ide dari pemilik brand",
              })
            }
          >
            Pakai ide saya
          </Button>
        </div>
      ) : (
        <button onClick={() => setOwn(true)} className="mt-3 w-full text-center text-sm text-mute underline">
          Atau tulis ide sendiri
        </button>
      )}
    </Section>
  );
}

function ScriptView({ c }: { c: ContentRow }) {
  if (!c.script) return null;
  return (
    <Section title={`Script · ${c.script.scenes.reduce((n, s) => n + s.seconds, 0)} detik`}>
      <ol className="card divide-y divide-line">
        {c.script.scenes.map((sc, i) => (
          <li key={i} className="flex gap-3 px-4 py-3">
            <span className="font-mono text-xs text-mute">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">{sc.voiceover}</p>
              {sc.detail ? <p className="mt-1 text-xs text-ink-2">↳ {sc.detail}</p> : null}
              <p className="mt-1 text-xs text-mute">
                Layar: <b className="text-ink-2">{c.scenes?.[i]?.headline ?? sc.on_screen}</b> · {c.scenes?.[i]?.layout ?? "—"} · {sc.seconds}s
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function CopyButton({ text, children }: { text: string; children: ReactNode }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-xs text-violet"
    >
      {done ? <Check size={14} /> : <Copy size={14} />} {done ? "Tersalin" : children}
    </button>
  );
}

function PublishView({ c }: { c: ContentRow }) {
  const p = c.publish;
  const caption = p?.caption ?? c.script?.caption;
  const tags = p?.hashtags ?? c.script?.hashtags ?? [];
  if (!caption) return null;
  const full = `${caption}\n\n${tags.join(" ")}`;
  return (
    <Section title="Caption" action={<CopyButton text={full}>Salin</CopyButton>}>
      <div className="card space-y-2 p-4 text-sm">
        <p className="whitespace-pre-wrap">{caption}</p>
        <p className="text-violet">{tags.join(" ")}</p>
        {p && (
          <p className="pt-1 text-xs text-mute">
            Cover: <b className="text-ink-2">{p.cover_title}</b> · Jam terbaik: <b className="text-ink-2">{p.best_time_wib} WIB</b>
          </p>
        )}
      </div>
    </Section>
  );
}

function Decision({
  approveLabel,
  busy,
  onApprove,
  onRevise,
  onReject,
}: {
  approveLabel: string;
  busy: string | null;
  onApprove: () => void;
  onRevise: (note: string) => void;
  onReject: () => void;
}) {
  const [revising, setRevising] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div className="sticky bottom-20 z-30 mt-6 md:bottom-4">
      <div className="card space-y-2 p-3 shadow-xl">
        {revising ? (
          <>
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Apa yang perlu diubah? mis. hook kurang nendang, scene 3 terlalu panjang"
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none"
            />
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setRevising(false)} className="flex-1">
                Batal
              </Button>
              <Button className="flex-1" disabled={note.trim().length < 3} loading={busy === "revise"} onClick={() => onRevise(note)}>
                Kirim revisi
              </Button>
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onReject} loading={busy === "reject"} aria-label="Tolak">
              <X size={16} />
            </Button>
            <Button variant="ghost" onClick={() => setRevising(true)} className="flex-1">
              <PenLine size={16} /> Revisi
            </Button>
            <Button variant="accent" onClick={onApprove} loading={busy?.startsWith("approve")} className="flex-[1.6]">
              <Check size={16} /> {approveLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
