import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import { continueRender, delayRender, registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// Make sure the self-hosted fonts are ready before the first frame is captured.
const fontsHandle = delayRender("Loading fonts");
Promise.all([
  document.fonts.load('700 120px "Space Grotesk Variable"'),
  document.fonts.load('500 40px "JetBrains Mono Variable"'),
])
  .catch(() => undefined)
  .finally(() => continueRender(fontsHandle));

registerRoot(RemotionRoot);
