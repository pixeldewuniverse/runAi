"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, timeAgo, usePoll } from "@/lib/client";
import { CONTENT_STATUS } from "@/lib/labels";
import type { ContentRow } from "@/lib/types";
import { Button, Chip, ErrorNote, PageTitle } from "./ui";

export function ContentList() {
  const { data, error } = usePoll<ContentRow[]>("/api/content", 4000);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const row = await api<ContentRow>("/api/content", { method: "POST", json: {} });
      router.push(`/content/${row.id}`);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle kicker="Content Studio" title="Konten">
        <Button onClick={start} loading={busy}>
          <Plus size={16} /> Shift baru
        </Button>
      </PageTitle>
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data ? (
        <div className="card shimmer h-40" />
      ) : data.length === 0 ? (
        <div className="card dot-floor px-6 py-14 text-center">
          <p className="font-medium">Belum ada konten.</p>
          <p className="mt-1 text-sm text-mute">Mulai shift — tim akan riset dan menyiapkan 3 ide untukmu.</p>
        </div>
      ) : (
        <ul className="card divide-y divide-line">
          {data.map((c) => {
            const s = CONTENT_STATUS[c.status];
            return (
              <li key={c.id}>
                <Link href={`/content/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-paper">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.title ?? "Ide sedang dicari…"}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-mute">{timeAgo(c.created_at)}</p>
                  </div>
                  <Chip tone={s.tone}>{s.label}</Chip>
                  <ChevronRight size={18} className="text-mute" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
