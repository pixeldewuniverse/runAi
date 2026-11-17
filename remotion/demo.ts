import { DEMO_BOARD, DEMO_SCRIPT } from "../lib/mock";
import type { RenderScene } from "../lib/types";

/** Demo storyboard (same as the app's demo mode) for previews and test renders. */
export const DEMO_SCENES: RenderScene[] = DEMO_SCRIPT.map((s, i) => ({
  voiceover: s.voiceover,
  on_screen: s.on_screen,
  seconds: s.seconds,
  ...(DEMO_BOARD[i] as Omit<RenderScene, "voiceover" | "on_screen" | "seconds">),
}));
