"use client";

import { useState } from "react";
import { AGENT_MAP, ROOMS, type RoomId } from "@/lib/agents";
import type { AgentStatusRow } from "@/lib/types";
import { Robot } from "./Robot";

/* Room rectangles on the floor plan, in % of the floor box. */
const LAYOUT: Record<RoomId, { x: number; y: number; w: number; h: number; tint: string }> = {
  riset: { x: 0, y: 0, w: 38, h: 31, tint: "#FFC93C" },
  studio: { x: 40, y: 0, w: 60, h: 31, tint: "#7C5CFF" },
  brainstorm: { x: 0, y: 33, w: 60, h: 31, tint: "#2BD9B4" },
  render: { x: 62, y: 33, w: 38, h: 31, tint: "#FF7A45" },
  lounge: { x: 0, y: 66, w: 100, h: 34, tint: "#121218" },
};

/** Slot position for the n-th agent inside a room (grid that fills left→right). */
function slot(room: RoomId, i: number, count: number) {
  const r = LAYOUT[room];
  const cols = Math.max(1, Math.min(count, room === "lounge" ? 6 : room === "studio" || room === "brainstorm" ? 4 : 2));
  const rows = Math.ceil(count / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  const cx = r.x + (r.w / cols) * (col + 0.5);
  const cy = r.y + 8 + ((r.h - 8) / rows) * (row + 0.5);
  return { left: `${cx}%`, top: `${cy}%` };
}

export function OfficeFloor({ agents }: { agents: AgentStatusRow[] }) {
  const [focus, setFocus] = useState<string | null>(null);

  const byRoom = new Map<RoomId, AgentStatusRow[]>();
  for (const a of agents) byRoom.set(a.room, [...(byRoom.get(a.room) ?? []), a]);

  return (
    <div className="card dot-floor relative aspect-[4/5] w-full overflow-hidden p-2 sm:aspect-[16/11]">
      <div className="relative size-full">
        {ROOMS.map((room) => {
          const r = LAYOUT[room.id];
          const busy = (byRoom.get(room.id) ?? []).some((a) => a.state === "working");
          return (
            <div
              key={room.id}
              className="absolute rounded-2xl border transition-colors duration-500"
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
                width: `${r.w}%`,
                height: `${r.h}%`,
                background: `${r.tint}${busy ? "1f" : "10"}`,
                borderColor: `${r.tint}${busy ? "66" : "33"}`,
              }}
            >
              <div className="flex items-center gap-1.5 px-2.5 pt-2">
                <span className="size-2 rounded-[3px]" style={{ background: r.tint }} />
                <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-ink-2 sm:text-[11px]">
                  {room.label}
                </span>
              </div>
            </div>
          );
        })}

        {agents.map((a) => {
          const def = AGENT_MAP[a.id];
          const peers = byRoom.get(a.room) ?? [];
          const pos = slot(a.room, peers.indexOf(a), peers.length);
          const showBubble = a.state !== "idle" && a.task;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setFocus(focus === a.id ? null : a.id)}
              className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center outline-none"
              style={{ ...pos, transition: "left 1.4s cubic-bezier(.5,0,.3,1), top 1.4s cubic-bezier(.5,0,.3,1)" }}
              aria-label={`${def.name}, ${def.role}`}
            >
              {(showBubble || focus === a.id) && (
                <span
                  className={`absolute bottom-full mb-1 w-max max-w-[150px] rounded-xl px-2 py-1 text-left text-[10px] leading-tight shadow-sm ${
                    a.state === "error" ? "bg-danger text-white" : a.state === "waiting" ? "ping bg-sun text-ink" : "bg-ink text-paper"
                  }`}
                >
                  {focus === a.id && !showBubble ? `${def.role} · santai` : a.task}
                </span>
              )}
              <span className={a.state === "working" ? "bot-working" : a.state === "waiting" ? "bot-waiting" : "bot-idle"}>
                <Robot
                  color={def.color}
                  mood={a.state === "working" ? "working" : a.state === "error" ? "error" : a.state === "waiting" ? "waiting" : "idle"}
                  size={30}
                  title={def.name}
                />
              </span>
              <span className="mt-0.5 rounded-md bg-white/80 px-1 font-mono text-[9px] text-ink-2">{def.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
