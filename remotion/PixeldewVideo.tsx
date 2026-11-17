import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Html5Audio,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Robot } from "../components/Robot";
import type { RenderScene } from "../lib/types";

/* Fonts are self-hosted via @fontsource (loaded in app/layout.tsx for the
 * browser preview and in remotion/index.ts for the render worker). */
const SANS = '"Space Grotesk Variable", system-ui, sans-serif';
const MONO = '"JetBrains Mono Variable", ui-monospace, monospace';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export interface VideoBrand {
  name: string;
  handle: string;
  palette: { background: string; ink: string; accents: string[] };
}

export interface VideoProps {
  scenes: RenderScene[];
  brand: VideoBrand;
  [key: string]: unknown;
}

export const sceneFrames = (s: RenderScene) => Math.max(1, Math.round(s.seconds * FPS));
export const totalFrames = (scenes: RenderScene[]) =>
  Math.max(FPS, scenes.reduce((n, s) => n + sceneFrames(s), 0));

export function PixeldewVideo({ scenes, brand }: VideoProps) {
  const starts = scenes.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + sceneFrames(scenes[i - 1])], []);
  return (
    <AbsoluteFill style={{ background: brand.palette.background, color: brand.palette.ink, fontFamily: SANS }}>
      <DotGrid ink={brand.palette.ink} />
      {scenes.map((scene, i) => {
        const dur = sceneFrames(scene);
        return (
          <Sequence key={i} from={starts[i]} durationInFrames={dur} name={`${i + 1}. ${scene.layout}`}>
            <SceneView scene={scene} brand={brand} index={i} total={scenes.length} />
            {scene.audio_url ? <Html5Audio src={scene.audio_url} /> : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

/* ── Shared pieces ───────────────────────────────────────────── */

/* Dot grid as an SVG pattern (CSS radial-gradient isn't supported by the in-browser renderer). */
function DotGrid({ ink }: { ink: string }) {
  return (
    <AbsoluteFill style={{ opacity: 0.6 }}>
      <svg width="100%" height="100%">
        <defs>
          <pattern id="pd-dots" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="18" cy="18" r="2" fill={ink} fillOpacity="0.13" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pd-dots)" />
      </svg>
    </AbsoluteFill>
  );
}

function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
}

function TopBar({ brand, index, total, accent }: { brand: VideoBrand; index: number; total: number; accent: string }) {
  return (
    <div style={{ position: "absolute", top: 110, left: 80, right: 80, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 6, textTransform: "uppercase" }}>
        <span style={{ display: "inline-block", width: 18, height: 18, background: accent, marginRight: 14, verticalAlign: "middle" }} />
        {brand.name}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ width: i === index ? 46 : 16, height: 16, borderRadius: 8, background: i <= index ? brand.palette.ink : `${brand.palette.ink}33` }} />
        ))}
      </div>
    </div>
  );
}

function Captions({ text, ink, accent }: { text: string; ink: string; accent: string }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const CHUNK = 4;
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += CHUNK) chunks.push(words.slice(i, i + CHUNK));
  const per = durationInFrames / words.length;
  const wordIdx = Math.min(words.length - 1, Math.floor(frame / per));
  const chunkIdx = Math.floor(wordIdx / CHUNK);
  const chunk = chunks[chunkIdx];

  return (
    <div style={{ position: "absolute", bottom: 260, left: 70, right: 70, display: "flex", justifyContent: "center" }}>
      <div style={{ background: ink, color: "#fff", padding: "22px 34px", borderRadius: 28, fontSize: 50, fontWeight: 700, textAlign: "center", lineHeight: 1.25, maxWidth: 900 }}>
        {chunk.map((w, i) => {
          const active = chunkIdx * CHUNK + i === wordIdx;
          return (
            <span key={i} style={{ color: active ? accent : "#fff", marginRight: 14 }}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Headline({ text, size = 120, delay = 0, align = "left" }: { text: string; size?: number; delay?: number; align?: "left" | "center" }) {
  const p = useEnter(delay);
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.02,
        letterSpacing: -3,
        textAlign: align,
        transform: `translateY(${interpolate(p, [0, 1], [60, 0])}px)`,
        opacity: p,
      }}
    >
      {text}
    </div>
  );
}

/* ── Scene layouts ───────────────────────────────────────────── */

function SceneView({ scene, brand, index, total }: { scene: RenderScene; brand: VideoBrand; index: number; total: number }) {
  const frame = useCurrentFrame();
  const ink = brand.palette.ink;
  const a = scene.accent;
  const blink = frame % 75 < 4 ? 0.15 : 1;
  const bob = Math.sin(frame / 8) * 10;

  const body = (() => {
    switch (scene.layout) {
      case "hook":
        return (
          <>
            <div style={{ position: "absolute", top: 380, left: 80, right: 80 }}>
              <Headline text={scene.headline} size={138} />
              <Underline color={a} />
            </div>
            <PopIn delay={6} style={{ position: "absolute", right: 70, bottom: 460, transform: `translateY(${bob}px)` }}>
              <Robot color={a} mood="working" size={330} blink={blink} />
            </PopIn>
          </>
        );
      case "statement":
        return (
          <div style={{ position: "absolute", top: 520, left: 80, right: 80 }}>
            <div style={{ width: 120, height: 22, background: a, marginBottom: 50 }} />
            <Headline text={scene.headline} size={124} />
          </div>
        );
      case "list":
        return (
          <div style={{ position: "absolute", top: 380, left: 80, right: 80 }}>
            <Headline text={scene.headline} size={96} />
            <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 34 }}>
              {scene.items.slice(0, 4).map((item, i) => (
                <ListItem key={i} n={i + 1} text={item} accent={a} ink={ink} delay={10 + i * 12} />
              ))}
            </div>
          </div>
        );
      case "code":
        return (
          <div style={{ position: "absolute", top: 360, left: 70, right: 70 }}>
            <Headline text={scene.headline} size={92} />
            <CodeCard code={scene.code} accent={a} />
          </div>
        );
      case "stat":
        return (
          <div style={{ position: "absolute", top: 460, left: 80, right: 80, textAlign: "center" }}>
            <Stat value={scene.stat || "—"} color={a} />
            <Headline text={scene.headline} size={80} delay={8} align="center" />
          </div>
        );
      case "compare":
        return (
          <div style={{ position: "absolute", top: 360, left: 70, right: 70 }}>
            <Headline text={scene.headline} size={92} />
            <div style={{ marginTop: 70, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
              {(scene.items.length ? scene.items : ["A", "B"]).slice(0, 2).map((it, i) => (
                <CompareCard key={i} label={i === 0 ? "Sebelum" : "Sesudah"} text={it} accent={i === 0 ? `${ink}` : a} delay={10 + i * 10} dark={i === 0} />
              ))}
            </div>
          </div>
        );
      case "cta":
        return (
          <>
            <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${bob}px)` }}>
              <Robot color={a} mood="happy" size={380} />
            </div>
            <div style={{ position: "absolute", top: 900, left: 80, right: 80, textAlign: "center" }}>
              <Headline text={scene.headline} size={104} align="center" delay={6} />
              <PopIn delay={14} style={{ marginTop: 40, fontFamily: MONO, fontSize: 46 }}>
                {brand.handle}
              </PopIn>
            </div>
          </>
        );
    }
  })();

  return (
    <AbsoluteFill>
      <TopBar brand={brand} index={index} total={total} accent={a} />
      {body}
      <Captions text={scene.voiceover} ink={ink} accent={a} />
    </AbsoluteFill>
  );
}

function PopIn({ delay, style, children }: { delay: number; style: CSSProperties; children: ReactNode }) {
  const p = useEnter(delay);
  return (
    <div style={style}>
      <div style={{ transform: `scale(${p})`, opacity: p, transformOrigin: "center bottom" }}>{children}</div>
    </div>
  );
}

function Underline({ color }: { color: string }) {
  const p = useEnter(8);
  return <div style={{ marginTop: 40, height: 26, width: `${p * 70}%`, background: color }} />;
}

function ListItem({ n, text, accent, ink, delay }: { n: number; text: string; accent: string; ink: string; delay: number }) {
  const p = useEnter(delay);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 30, opacity: p, transform: `translateX(${interpolate(p, [0, 1], [-60, 0])}px)` }}>
      <div style={{ width: 92, height: 92, flexShrink: 0, background: accent, color: ink, fontFamily: MONO, fontSize: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 18 }}>
        {n}
      </div>
      <div style={{ fontSize: 62, fontWeight: 500, lineHeight: 1.15 }}>{text}</div>
    </div>
  );
}

function CodeCard({ code, accent }: { code: string; accent: string }) {
  const frame = useCurrentFrame();
  const shown = code.slice(0, Math.floor(Math.max(0, frame - 10) * 1.6));
  const p = useEnter(4);
  return (
    <div style={{ marginTop: 60, background: "#121218", borderRadius: 34, padding: "40px 46px", boxShadow: "0 30px 80px rgba(0,0,0,.25)", transform: `scale(${interpolate(p, [0, 1], [0.92, 1])})`, opacity: p }}>
      <div style={{ display: "flex", gap: 14, marginBottom: 30 }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />
        ))}
      </div>
      <pre style={{ margin: 0, fontFamily: MONO, fontSize: 42, lineHeight: 1.5, color: "#E8E8F0", whiteSpace: "pre-wrap" }}>
        {shown}
        <span style={{ background: accent, color: accent }}>_</span>
      </pre>
    </div>
  );
}

function Stat({ value, color }: { value: string; color: string }) {
  const frame = useCurrentFrame();
  const m = value.match(/^([^\d]*)([\d.,]+)(.*)$/);
  let display = value;
  if (m) {
    const target = parseFloat(m[2].replace(/\./g, "").replace(",", "."));
    if (!Number.isNaN(target)) {
      const v = interpolate(frame, [0, 30], [0, target], { extrapolateRight: "clamp" });
      display = `${m[1]}${Number.isInteger(target) ? Math.round(v).toLocaleString("id-ID") : v.toFixed(1)}${m[3]}`;
    }
  }
  return <div style={{ fontSize: 300, fontWeight: 700, letterSpacing: -10, color, lineHeight: 1 }}>{display}</div>;
}

function CompareCard({ label, text, accent, delay, dark }: { label: string; text: string; accent: string; delay: number; dark: boolean }) {
  const p = useEnter(delay);
  return (
    <div style={{ background: dark ? "#121218" : accent, color: dark ? "#fff" : "#121218", borderRadius: 34, padding: 44, minHeight: 560, opacity: p, transform: `translateY(${interpolate(p, [0, 1], [80, 0])}px)` }}>
      <div style={{ fontFamily: MONO, fontSize: 32, textTransform: "uppercase", letterSpacing: 4, opacity: 0.7 }}>{label}</div>
      <div style={{ marginTop: 30, fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>{text}</div>
    </div>
  );
}
