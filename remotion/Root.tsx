import { Composition } from "remotion";
import { DEFAULT_BRAND } from "../lib/brand";
import { DEMO_SCENES } from "./demo";
import { FPS, HEIGHT, PixeldewVideo, totalFrames, WIDTH, type VideoProps } from "./PixeldewVideo";

/** Composition entry used by the render worker. */
export function RemotionRoot() {
  return (
    <Composition
      id="PixeldewVideo"
      component={PixeldewVideo}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={totalFrames(DEMO_SCENES)}
      defaultProps={{ scenes: DEMO_SCENES, brand: DEFAULT_BRAND } satisfies VideoProps}
      calculateMetadata={({ props }) => ({ durationInFrames: totalFrames(props.scenes) })}
    />
  );
}
