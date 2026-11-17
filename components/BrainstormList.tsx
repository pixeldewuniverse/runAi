"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AGENT_MAP } from "@/lib/agents";
import { api, timeAgo, usePoll } from "@/lib/client";
import { BRAINSTORM_STATUS } from "@/lib/labels";
import type { BrainstormRow } from "@/lib/types";
import { Robot } from "./Robot";
import { Button, Chip, ErrorNote, PageTitle, Section } from "./ui";

export function BrainstormList() {
  const { data, error } = usePoll<BrainstormRow[]>("/api/brainstorm", 5000);
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setErr(null);
    try {
      const row = await api<BrainstormRow>("/api/brainstorm", { method: "POST", json: { idea } });
      router.push(`/brainstorm/${row.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle kicker="Ruang Brainstorm" title="Bedah ide project" />

      <div className="card p-4">
        <div className="mb-3 flex items-center gap-1">
          {(["facilitator", "researcher", "critic", "architect", "pm"] as const).map((id) => (
            <span key={id} className="flex flex-col items-center">
              <Robot color={AGENT_MAP[id].color} size={30} mood="idle" />
            </span>
          ))}
          <span className="ml-2 text-xs text-mute">Fasi · Reza · Kritik · Arka · Pim</span>
        </div>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={5}
          placeholder="Ceritakan ide mentahmu. Mis: aplikasi booking trip Labuan Bajo untuk agen lokal, bisa bayar DP, admin bisa atur jadwal kapal…"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink/40"
        />
        {err && <p className="mt-2 text-sm text-danger">{err}</p>}
        <Button className="mt-3 w-full" onClick={start} loading={busy} disabled={idea.trim().length < 10}>
          Mulai brainstorm
        </Button>
      </div>

      <Section title="Sesi sebelumnya">
        {error && <ErrorNote>{error}</ErrorNote>}
        {data && data.length === 0 && <p className="text-sm text-mute">Belum ada sesi.</p>}
        {data && data.length > 0 && (
          <ul className="card divide-y divide-line">
            {data.map((b) => {
              const s = BRAINSTORM_STATUS[b.status];
              return (
                <li key={b.id}>
                  <Link href={`/brainstorm/${b.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-paper">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{b.title}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-mute">{timeAgo(b.created_at)}</p>
                    </div>
                    <Chip tone={s.tone}>{s.label}</Chip>
                    <ChevronRight size={18} className="text-mute" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
