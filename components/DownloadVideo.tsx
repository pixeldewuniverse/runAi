"use client";

import { Download, Loader2, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import type { Brand } from "@/lib/brand";
import type { RenderScene } from "@/lib/types";
import { FPS, HEIGHT, PixeldewVideo, totalFrames, WIDTH } from "@/remotion/PixeldewVideo";
import { Button } from "./ui";

type Props = {
  scenes: RenderScene[];
  brand: Pick<Brand, "name" | "handle" | "palette">;
  fileName: string;
};

/**
 * Renders the video right here in the browser (WebCodecs) and offers it as a
 * file — no render server needed. Silent unless the scenes already have
 * voice-over (made by the render worker).
 */
export function DownloadVideo({ scenes, brand, fileName }: Props) {
  const [state, setState] = useState<"idle" | "rendering" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  async function render() {
    setState("rendering");
    setProgress(0);
    setError(null);
    abort.current = new AbortController();
    try {
      const { canRenderMediaOnWeb, renderMediaOnWeb } = await import("@remotion/web-renderer");
      const hasAudio = scenes.some((s) => s.audio_url || s.track_url);

      // Prefer MP4 (best for TikTok/IG and iPhone); fall back to WebM, and as a
      // last resort drop the audio if this browser can't encode it.
      const attempts: { container: "mp4" | "webm"; muted: boolean }[] = [
        { container: "mp4", muted: !hasAudio },
        { container: "webm", muted: !hasAudio },
        ...(hasAudio ? [{ container: "mp4" as const, muted: true }, { container: "webm" as const, muted: true }] : []),
      ];
      let container: "mp4" | "webm" = "mp4";
      let muted = !hasAudio;
      let check = await canRenderMediaOnWeb({ width: WIDTH, height: HEIGHT, container, muted });
      for (const a of attempts) {
        check = await canRenderMediaOnWeb({ width: WIDTH, height: HEIGHT, container: a.container, muted: a.muted });
        if (check.canRender) {
          container = a.container;
          muted = a.muted;
          break;
        }
      }
      if (hasAudio && muted) setNote("Browser ini tidak bisa menyimpan audio — video dibuat tanpa suara. Coba Chrome terbaru.");
      if (!check.canRender) {
        throw new Error(
          check.issues.find((i) => i.severity === "error")?.message ??
            "Browser ini tidak bisa membuat video. Coba Chrome/Safari versi terbaru.",
        );
      }

      const result = await renderMediaOnWeb({
        composition: {
          component: PixeldewVideo,
          id: "PixeldewVideo",
          width: WIDTH,
          height: HEIGHT,
          fps: FPS,
          durationInFrames: totalFrames(scenes),
          defaultProps: { scenes, brand },
        },
        inputProps: { scenes, brand },
        container,
        videoCodec: check.resolvedVideoCodec,
        audioCodec: muted ? null : check.resolvedAudioCodec,
        muted,
        videoBitrate: "high",
        signal: abort.current.signal,
        onProgress: (p) => setProgress(p.progress),
        // Free Remotion license: individuals and companies of up to 3 people.
        licenseKey: "free-license",
      });
      const blob = await result.getBlob();
      const f = new File([blob], `${fileName}.${container}`, { type: blob.type || `video/${container}` });
      setFile(f);
      setState("done");
      save(f);
    } catch (e) {
      if (abort.current?.signal.aborted) {
        setState("idle");
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
      setState("error");
    }
  }

  async function save(f: File) {
    // iPhone/iPad: the share sheet has "Save Video" to Photos.
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.canShare?.({ files: [f] }) && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ files: [f], title: f.name });
        return;
      } catch {
        /* user closed the sheet — fall back to a normal download */
      }
    }
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  if (state === "rendering") {
    return (
      <div className="card w-full max-w-[300px] space-y-2 p-3">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Membuat video… {Math.round(progress * 100)}%
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full bg-dew transition-[width]" style={{ width: `${Math.max(2, progress * 100)}%` }} />
        </div>
        <p className="text-xs text-mute">Biarkan layar tetap terbuka sampai selesai.</p>
        <button onClick={() => abort.current?.abort()} className="text-xs text-mute underline">
          Batalkan
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[300px] flex-col items-center gap-2">
      {state === "done" && file ? (
        <Button onClick={() => save(file)} className="w-full">
          <Share2 size={16} /> Simpan lagi ({(file.size / 1_048_576).toFixed(1)} MB)
        </Button>
      ) : (
        <Button onClick={render} className="w-full">
          <Download size={16} /> Buat & unduh video
        </Button>
      )}
      {state === "error" && <p className="text-center text-xs text-danger">{error}</p>}
      {note && <p className="text-center text-xs text-ink-2">{note}</p>}
      {!scenes.some((s) => s.audio_url || s.track_url) && (
        <p className="text-center text-xs text-mute">Video tanpa suara — isi GEMINI_API_KEY supaya Vox membuat voice-over otomatis.</p>
      )}
    </div>
  );
}
