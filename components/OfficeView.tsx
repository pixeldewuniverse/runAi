"use client";

import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AGENT_MAP } from "@/lib/agents";
import { api, timeAgo, usePoll } from "@/lib/client";
import { CONTENT_STATUS } from "@/lib/labels";
import type { ContentRow, OfficeData } from "@/lib/types";
import { OfficeFloor } from "./OfficeFloor";
import { Robot } from "./Robot";
import { Button, ErrorNote, Section } from "./ui";

export function OfficeView() {
  const { data, error } = usePoll<OfficeData>("/api/office", 2500);
  const router = useRouter();
  const [hint, setHint] = useState("");
  const [starting, setStarting] = useState(false);
  const [startErr, setStartErr] = useState<string | null>(null);

  async function startShift() {
    setStarting(true);
    setStartErr(null);
    try {
      const row = await api<ContentRow>("/api/content", { method: "POST", json: { hint } });
      router.push(`/content/${row.id}`);
    } catch (e) {
      setStartErr(e instanceof Error ? e.message : String(e));
      setStarting(false);
    }
  }

  const working = data?.agents.filter((a) => a.state === "working").length ?? 0;

  return (
    <div>
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="label">Pixeldew · runAI</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Kantor Agent</h1>
        </div>
        <p className="pb-1 text-right font-mono text-xs text-mute">
          {data ? (working ? `${working} agent bekerja` : "semua santai") : "memuat…"}
        </p>
      </header>

      {data && (!data.config.ai || data.config.store === "memory") && (
        <div className="mb-4 rounded-2xl border border-sun/60 bg-sun/15 px-4 py-3 text-sm">
          <b>Mode demo.</b>{" "}
          {!data.config.ai && "Belum ada API key AI — agent memakai jawaban contoh. "}
          {data.config.store === "memory" && "Supabase belum diatur — data hilang saat server restart. "}
          <Link href="/settings" className="underline">
            Lihat setelan
          </Link>
        </div>
      )}

      {error && <ErrorNote>{error}</ErrorNote>}

      {data && data.approvals.length > 0 && (
        <Section title={`Butuh keputusanmu (${data.approvals.length})`}>
          <ul className="space-y-2">
            {data.approvals.map((a) => (
              <li key={a.id}>
                <Link href={`/content/${a.id}`} className="card flex items-center gap-3 px-4 py-3 hover:border-ink/30">
                  <span className="ping size-2.5 shrink-0 rounded-full bg-sun" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{a.title ?? "Konten hari ini"}</span>
                    <span className="text-xs text-mute">{CONTENT_STATUS[a.status].label}</span>
                  </span>
                  <ArrowRight size={18} className="text-mute" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="mt-4">
        {data ? <OfficeFloor agents={data.agents} /> : <div className="card shimmer aspect-[4/5] sm:aspect-[16/11]" />}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-violet" />
            <h2 className="font-semibold">Shift konten hari ini</h2>
          </div>
          <p className="mt-1 text-sm text-mute">Scout cari tren, Strat siapkan 3 ide, kamu tinggal pilih.</p>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Arahan opsional, mis. bahas Tailwind v4"
            className="mt-3 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink/40"
          />
          {startErr && <p className="mt-2 text-sm text-danger">{startErr}</p>}
          <Button className="mt-3 w-full" onClick={startShift} loading={starting}>
            Mulai shift
          </Button>
        </div>

        <Link href="/brainstorm" className="card group flex flex-col p-4 hover:border-ink/30">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-tangerine" />
            <h2 className="font-semibold">Brainstorm project</h2>
          </div>
          <p className="mt-1 text-sm text-mute">
            Lempar ide mentah. Fasi, Reza, Kritik, Arka, dan Pim akan membedahnya jadi project brief.
          </p>
          <div className="mt-auto flex items-end justify-between pt-3">
            <div className="flex -space-x-2">
              {(["facilitator", "researcher", "critic", "architect", "pm"] as const).map((id) => (
                <Robot key={id} color={AGENT_MAP[id].color} size={26} mood="idle" />
              ))}
            </div>
            <ArrowRight size={18} className="text-mute transition group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {data && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ["Konten hari ini", data.stats.contentToday],
            ["Siap posting", data.stats.ready],
            ["Sudah posting", data.stats.published],
          ].map(([label, n]) => (
            <div key={label} className="card px-3 py-3">
              <p className="text-2xl font-bold">{n}</p>
              <p className="text-xs text-mute">{label}</p>
            </div>
          ))}
        </div>
      )}

      <Section title="Aktivitas">
        <ol className="card divide-y divide-line">
          {data?.events.length ? (
            data.events.map((e) => {
              const agent = e.agent_id in AGENT_MAP ? AGENT_MAP[e.agent_id as keyof typeof AGENT_MAP] : null;
              const href = e.ref_id ? `/${e.ref_type === "brainstorm" ? "brainstorm" : "content"}/${e.ref_id}` : null;
              const row = (
                <div className="flex items-start gap-3 px-4 py-2.5">
                  <span className="mt-0.5 w-5 shrink-0">
                    {agent ? (
                      <Robot color={agent.color} size={18} mood={e.kind === "error" ? "error" : "idle"} />
                    ) : (
                      <span className="mt-1 block size-2.5 rounded-sm bg-ink/30" />
                    )}
                  </span>
                  <p className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{agent?.name ?? (e.agent_id === "user" ? "Kamu" : "Sistem")}</span>{" "}
                    <span className={e.kind === "error" ? "text-danger" : "text-ink-2"}>{e.message}</span>
                  </p>
                  <span className="shrink-0 font-mono text-[10px] text-mute">{timeAgo(e.created_at)}</span>
                </div>
              );
              return <li key={e.id}>{href ? <Link href={href} className="block hover:bg-paper">{row}</Link> : row}</li>;
            })
          ) : (
            <li className="px-4 py-6 text-center text-sm text-mute">Belum ada aktivitas. Mulai shift pertama di atas.</li>
          )}
        </ol>
      </Section>
    </div>
  );
}
