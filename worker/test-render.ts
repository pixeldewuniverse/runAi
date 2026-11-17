/* Local smoke test: renders the demo storyboard to ./out/demo.mp4 (no TTS, no upload). */
import { mkdir } from "node:fs/promises";
import { DEFAULT_BRAND } from "../lib/brand";
import { DEMO_SCENES } from "../remotion/demo";
import { renderVideo } from "./render";

await mkdir("out", { recursive: true });
console.time("render");
await renderVideo(DEMO_SCENES, DEFAULT_BRAND, "out/demo.mp4");
console.timeEnd("render");
console.log("→ worker/out/demo.mp4");
