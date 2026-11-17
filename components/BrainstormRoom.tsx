"use client";

import { ArrowLeft, Check, Copy, RotateCcw, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AGENT_MAP, type AgentId } from "@/lib/agents";
import { api, usePoll } from "@/lib/client";
import { BRAINSTORM_STATUS } from "@/lib/labels";
import type { Brief } from "@/lib/schemas";
import type { BrainstormMessageRow, BrainstormRow } from "@/lib/types";
import { Robot } from "./Robot";
import { Button, Chip, ErrorNote, Section } from "./ui";

const ORDER: AgentId[] = ["facilitator", "researcher", "critic", "architect", "pm"];

type Data = { session: BrainstormRow; messages: BrainstormMessageRow[] };

export function BrainstormRoom({ id }: { id: string }) {
  const { data, error, refresh } = usePoll<Data>(`/api/brainstorm/${id}`, 2500);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    setErr(null);
    try {
      await api(`/api/brainstorm/${id}`, { method: "POST", json: { action, ...extra } });
      if (action === "reply") setReply("");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  if (error && !data) return <ErrorNote>{error}</ErrorNote>;
  if (!data) return <div className="card shimmer h-64" />;

  const { session, messages } = data;
  const st = BRAINSTORM_STATUS[session.status];
  const last = messages.at(-1)?.author;
  const next = session.status === "running" ? (last === "user" || !last ? ORDER[0] : ORDER[ORDER.indexOf(last as AgentId) + 1]) : null;

  return (
    <div>
      <Link href="/brainstorm" className="mb-3 inline-flex items-center gap-1 text-sm text-mute hover:text-ink">
        <ArrowLeft size={16} /> Semua sesi
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label">Brainstorm</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{session.title}</h1>
        </div>
        <Chip tone={st.tone}>{st.label}</Chip>
      </header>

      {session.brief && <BriefCard brief={session.brief} />}

      <Section title="Diskusi tim">
        <ol className="space-y-3">
          {messages.map((m) => (
            <Message key={m.id} m={m} />
          ))}
          {next && (
            <li className="flex items-center gap-3 px-1">
              <span className="bot-working">
                <Robot color={AGENT_MAP[next].color} mood="working" size={32} />
              </span>
              <span className="text-sm text-mute">
                {AGENT_MAP[next].name} ({AGENT_MAP[next].role}) sedang berpikir…
              </span>
            </li>
          )}
        </ol>
      </Section>

      {session.status === "failed" && (
        <div className="mt-4 space-y-2">
          <ErrorNote>{session.error}</ErrorNote>
          <Button onClick={() => act("retry")} loading={busy === "retry"}>
            <RotateCcw size={16} /> Ulangi putaran
          </Button>
        </div>
      )}

      {err && <div className="mt-4"><ErrorNote>{err}</ErrorNote></div>}

      {session.status !== "running" && (
        <div className="sticky bottom-20 z-30 mt-6 md:bottom-4">
          <div className="card p-3 shadow-xl">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={2}
              placeholder="Jawab pertanyaan Fasi atau beri arahan baru — tim akan diskusi ulang"
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none"
            />
            <div className="mt-2 flex gap-2">
              {session.status !== "done" && (
                <Button variant="ghost" onClick={() => act("close")} loading={busy === "close"}>
                  <Check size={16} /> Selesai
                </Button>
              )}
              <Button className="flex-1" onClick={() => act("reply", { text: reply })} disabled={reply.trim().length < 2} loading={busy === "reply"}>
                <Send size={16} /> Kirim ke tim
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function briefMarkdown(b: Brief) {
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  return `# ${b.title}

${b.summary}

## Tujuan
${list(b.goals)}

## Metrik sukses
${list(b.success_metrics)}

## Scope MVP
${list(b.mvp_scope)}

## Di luar scope
${list(b.out_of_scope)}

## Roadmap
${b.roadmap.map((r) => `- **${r.week}** — ${r.focus}`).join("\n")}

## Risiko utama
${list(b.top_risks)}

## Langkah pertama
${b.first_step}
`;
}

function BriefCard({ brief }: { brief: Brief }) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="mt-5 overflow-hidden rounded-[22px] bg-ink text-paper">
      <div className="flex items-center justify-between px-5 pt-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-dew">Project brief · Pim</p>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(briefMarkdown(brief));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-1 text-xs text-paper/70 hover:text-paper"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Tersalin" : "Salin markdown"}
        </button>
      </div>
      <div className="space-y-4 px-5 pb-5 pt-2">
        <div>
          <h2 className="text-xl font-bold">{brief.title}</h2>
          <p className="mt-1 text-sm text-paper/80">{brief.summary}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <BriefList title="Scope MVP" items={brief.mvp_scope} />
          <BriefList title="Tujuan" items={brief.goals} />
          <BriefList title="Metrik sukses" items={brief.success_metrics} />
          <BriefList title="Risiko utama" items={brief.top_risks} />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-paper/50">Roadmap</p>
          <ol className="mt-1.5 space-y-1 text-sm">
            {brief.roadmap.map((r, i) => (
              <li key={i}>
                <b className="text-sun">{r.week}</b> — {r.focus}
              </li>
            ))}
          </ol>
        </div>
        <p className="rounded-xl bg-dew px-3 py-2 text-sm text-ink">
          <b>Langkah pertama:</b> {brief.first_step}
        </p>
      </div>
    </section>
  );
}

function BriefList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-paper/50">{title}</p>
      <ul className="mt-1.5 space-y-1 text-sm">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 bg-dew" />
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Agent messages ─────────────────────────────────────────── */

type Any = Record<string, unknown>;
const arr = (v: unknown) => (Array.isArray(v) ? v : []) as Any[] & string[];

function Message({ m }: { m: BrainstormMessageRow }) {
  if (m.author === "user") {
    return (
      <li className="ml-8 rounded-[22px] rounded-tr-md bg-ink px-4 py-3 text-sm text-paper whitespace-pre-wrap">
        {String(m.body.text)}
      </li>
    );
  }
  const a = AGENT_MAP[m.author];
  const b = m.body as Any;
  return (
    <li className="flex gap-2.5">
      <span className="shrink-0 pt-1">
        <Robot color={a.color} size={30} mood="idle" />
      </span>
      <div className="card min-w-0 flex-1 rounded-tl-md px-4 py-3 text-sm">
        <p className="mb-1.5 text-xs">
          <b>{a.name}</b> <span className="text-mute">· {a.role}</span>
        </p>
        {m.author === "facilitator" && (
          <div className="space-y-2">
            <p><b>Masalah:</b> {String(b.problem)}</p>
            <p><b>Pengguna:</b> {String(b.users)}</p>
            <p><b>Hasil yang diinginkan:</b> {String(b.desired_outcome)}</p>
            <Bullets title="Asumsi" items={arr(b.assumptions)} />
            {arr(b.questions).length > 0 && (
              <div className="rounded-xl bg-sun/20 px-3 py-2">
                <p className="text-xs font-semibold">Pertanyaan untukmu</p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                  {arr(b.questions).map((q, i) => <li key={i}>{String(q)}</li>)}
                </ol>
              </div>
            )}
          </div>
        )}
        {m.author === "researcher" && (
          <div className="space-y-2">
            <ul className="space-y-1.5">
              {arr(b.comparables).map((c, i) => (
                <li key={i}>
                  <b>{String(c.name)}</b> — {String(c.what_they_do)} <span className="text-mute">→ {String(c.lesson)}</span>
                </li>
              ))}
            </ul>
            <Bullets title="Celah yang bisa diisi" items={arr(b.gaps)} />
            {b.notes ? <p className="text-xs text-mute">{String(b.notes)}</p> : null}
          </div>
        )}
        {m.author === "critic" && (
          <div className="space-y-2">
            <ul className="space-y-1.5">
              {arr(b.risks).map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className={`mt-0.5 h-fit shrink-0 rounded px-1.5 text-[10px] font-semibold uppercase ${r.severity === "tinggi" ? "bg-danger/15 text-danger" : r.severity === "sedang" ? "bg-sun/30" : "bg-dew/20"}`}>
                    {String(r.severity)}
                  </span>
                  <span>
                    {String(r.risk)} <span className="text-mute">→ {String(r.mitigation)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p><b>Kesimpulan:</b> {String(b.verdict)}</p>
          </div>
        )}
        {m.author === "architect" && (
          <div className="space-y-2">
            <ul className="space-y-1">
              {arr(b.mvp_features).map((f, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{String(f.feature)}</span>
                  <span className="shrink-0 font-mono text-xs text-mute">{String(f.effort_days)} hr</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-mute">
              Total ±{arr(b.mvp_features).reduce((n, f) => n + Number(f.effort_days || 0), 0)} hari kerja
            </p>
            <div className="flex flex-wrap gap-1.5">
              {arr(b.stack).map((s, i) => (
                <span key={i} className="rounded-md bg-paper px-2 py-0.5 font-mono text-[11px]">{String(s)}</span>
              ))}
            </div>
            <p>{String(b.architecture)}</p>
            <Bullets title="Nanti" items={arr(b.later_features)} />
          </div>
        )}
        {m.author === "pm" && <p>Brief diperbarui — lihat kartu <b>Project brief</b> di atas.</p>}
        {!["facilitator", "researcher", "critic", "architect", "pm"].includes(m.author) && (
          <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(b, null, 2)}</pre>
        )}
      </div>
    </li>
  );
}

function Bullets({ title, items }: { title: string; items: unknown[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold">{title}</p>
      <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
        {items.map((x, i) => <li key={i}>{String(x)}</li>)}
      </ul>
    </div>
  );
}
