"use client";

import { Player } from "@remotion/player";
import type { Brand } from "@/lib/brand";
import type { RenderScene } from "@/lib/types";
import { FPS, HEIGHT, PixeldewVideo, totalFrames, WIDTH } from "@/remotion/PixeldewVideo";

/** Browser preview of the exact composition the render worker uses. */
export function VideoPreview({ scenes, brand }: { scenes: RenderScene[]; brand: Pick<Brand, "name" | "handle" | "palette"> }) {
  return (
    <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[22px] border border-line bg-ink shadow-lg">
      <Player
        component={PixeldewVideo}
        inputProps={{ scenes, brand }}
        durationInFrames={totalFrames(scenes)}
        fps={FPS}
        compositionWidth={WIDTH}
        compositionHeight={HEIGHT}
        style={{ width: "100%", aspectRatio: "9 / 16" }}
        controls
        loop
        initialFrame={20}
        acknowledgeRemotionLicense
      />
    </div>
  );
}
