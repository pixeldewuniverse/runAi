import type { BrainstormRow, ContentStatus } from "./types";

export const CONTENT_STATUS: Record<ContentStatus, { label: string; tone: "work" | "you" | "done" | "bad" }> = {
  researching: { label: "Riset tren", tone: "work" },
  awaiting_pick: { label: "Pilih ide", tone: "you" },
  scripting: { label: "Menulis script", tone: "work" },
  awaiting_script: { label: "Review script", tone: "you" },
  rendering: { label: "Produksi video", tone: "work" },
  awaiting_final: { label: "Review video", tone: "you" },
  ready: { label: "Siap posting", tone: "done" },
  published: { label: "Sudah diposting", tone: "done" },
  rejected: { label: "Dibatalkan", tone: "bad" },
  failed: { label: "Gagal", tone: "bad" },
};

export const BRAINSTORM_STATUS: Record<BrainstormRow["status"], { label: string; tone: "work" | "you" | "done" | "bad" }> = {
  running: { label: "Tim berdiskusi", tone: "work" },
  awaiting_user: { label: "Brief siap", tone: "you" },
  done: { label: "Selesai", tone: "done" },
  failed: { label: "Gagal", tone: "bad" },
};

export const TONE_CLASS = {
  work: "bg-violet/12 text-violet",
  you: "bg-sun/30 text-ink",
  done: "bg-dew/20 text-ink",
  bad: "bg-danger/12 text-danger",
} as const;

export const STEPS: { key: string; label: string; statuses: ContentStatus[] }[] = [
  { key: "riset", label: "Riset", statuses: ["researching"] },
  { key: "ide", label: "Ide", statuses: ["awaiting_pick"] },
  { key: "script", label: "Script", statuses: ["scripting", "awaiting_script"] },
  { key: "video", label: "Video", statuses: ["rendering", "awaiting_final"] },
  { key: "posting", label: "Posting", statuses: ["ready", "published"] },
];
