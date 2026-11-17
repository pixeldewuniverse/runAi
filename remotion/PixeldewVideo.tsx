import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { Robot } from "../components/Robot";
import type { RenderScene } from "../lib/types";

/* Fonts are self-hosted via @fontsource (loaded in app/layout.tsx for the
 * browser preview and in remotion/index.ts for the render worker). */
const SANS = '"Space Grotesk Variable", system-ui, sans-serif';
const MONO = '"JetBrains Mono Variable", ui-monospace, monospace';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/* TikTok/Reels safe area: keep content clear of the top bar, the right-hand
 * buttons and the caption/username block at the bottom. */
const SAFE = { left: 76, right: 150, top: 250, contentBottom: 1380, captionTop: 1440 };
const CONTENT_W = WIDTH - SAFE.left - SAFE.right;

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

/* ── Theme ───────────────────────────────────────────────────── */

interface Look {
  bg: string;
  fg: string;
  sub: string;
  card: string;
  cardFg: string;
  line: string;
  accent: string;
  /** Text color that reads on the accent color. */
  onAccent: string;
  capBg: string;
  capFg: string;
}

function luminance(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function lookFor(scene: RenderScene, brand: VideoBrand, index: number, total: number): Look {
  const ink = brand.palette.ink;
  const paper = brand.palette.background;
  const accent = scene.accent;
  const onAccent = luminance(accent) > 0.4 ? ink : "#FFFFFF";
  const theme = scene.theme ?? (index === 0 || index === total - 1 ? "dark" : "light");
  if (theme === "dark") {
    return { bg: ink, fg: paper, sub: `${paper}B3`, card: "#1F1F2A", cardFg: paper, line: `${paper}22`, accent, onAccent, capBg: paper, capFg: ink };
  }
  if (theme === "accent") {
    // On a full-color background, cards and highlights switch to ink/paper.
    const fg = onAccent;
    return {
      bg: accent,
      fg,
      sub: `${fg}CC`,
      card: ink,
      cardFg: paper,
      line: `${fg}33`,
      accent: fg === ink ? ink : paper,
      onAccent: fg === ink ? paper : ink,
      capBg: ink,
      capFg: paper,
    };
  }
  return { bg: paper, fg: ink, sub: `${ink}A6`, card: "#FFFFFF", cardFg: ink, line: `${ink}1A`, accent, onAccent, capBg: ink, capFg: "#FFFFFF" };
}

/** Mascot color that stays visible on the scene background. */
const mascotColor = (look: Look) => (look.accent === look.fg || look.accent === look.bg ? "#2BD9B4" : look.accent);

/* ── Composition ─────────────────────────────────────────────── */

export function PixeldewVideo({ scenes, brand }: VideoProps) {
  const starts = scenes.reduce<number[]>((acc, _s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + sceneFrames(scenes[i - 1])], []);
  return (
    <AbsoluteFill style={{ background: brand.palette.ink, fontFamily: SANS }}>
      {scenes[0]?.track_url ? <Audio src={scenes[0].track_url} /> : null}
      {scenes.map((scene, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={sceneFrames(scene)} name={`${i + 1}. ${scene.layout}`}>
          <SceneView scene={scene} brand={brand} index={i} total={scenes.length} />
          {scene.audio_url ? <Audio src={scene.audio_url} /> : null}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

function SceneView({ scene, brand, index, total }: { scene: RenderScene; brand: VideoBrand; index: number; total: number }) {
  const look = lookFor(scene, brand, index, total);
  const props = { scene, look, brand };
  const body = (() => {
    switch (scene.layout) {
      case "hook":
        return <Hook {...props} />;
      case "list":
        return <List {...props} />;
      case "steps":
        return <Steps {...props} />;
      case "code":
        return <Code {...props} />;
      case "stat":
        return <Stat {...props} />;
      case "compare":
        return <Compare {...props} />;
      case "chat":
        return <Chat {...props} />;
      case "tip":
        return <Tip {...props} />;
      case "cta":
        return <Cta {...props} />;
      default:
        return <Statement {...props} />;
    }
  })();

  return (
    <AbsoluteFill style={{ background: look.bg, color: look.fg }}>
      <Backdrop look={look} index={index} />
      <TopBar brand={brand} index={index} total={total} look={look} />
      {body}
      <Captions text={scene.voiceover} look={look} />
      {index > 0 && <Wipe color={look.accent} />}
    </AbsoluteFill>
  );
}

type LayoutProps = { scene: RenderScene; look: Look; brand: VideoBrand };

/* ── Shared pieces ───────────────────────────────────────────── */

function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 120 } });
}

function Rise({ delay = 0, children, style }: { delay?: number; children: ReactNode; style?: CSSProperties }) {
  const p = useEnter(delay);
  return <div style={{ ...style, opacity: p, transform: `translateY(${interpolate(p, [0, 1], [50, 0])}px)` }}>{children}</div>;
}

function PopIn({ delay, style, children }: { delay: number; style: CSSProperties; children: ReactNode }) {
  const p = useEnter(delay);
  return (
    <div style={style}>
      <div style={{ transform: `scale(${p})`, opacity: p, transformOrigin: "center bottom" }}>{children}</div>
    </div>
  );
}

/** Accent panel sliding away at the start of each scene. */
function Wipe({ color }: { color: string }) {
  const frame = useCurrentFrame();
  if (frame > 10) return null;
  const x = interpolate(frame, [0, 9], [0, -110], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: color, transform: `translateX(${x}%)` }} />;
}

/* Dot grid + a big soft accent shape (SVG — the in-browser renderer doesn't draw CSS radial gradients). */
function Backdrop({ look, index }: { look: Look; index: number }) {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 20;
  const corner = index % 2 === 0;
  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <pattern id={`pd-dots-${index}`} width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="18" cy="18" r="2" fill={look.fg} fillOpacity="0.09" />
          </pattern>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill={`url(#pd-dots-${index})`} />
        <circle cx={corner ? 980 + drift : 100 - drift} cy={corner ? 360 : 1560} r="320" fill={look.accent} fillOpacity="0.10" />
      </svg>
    </AbsoluteFill>
  );
}

function TopBar({ brand, index, total, look }: { brand: VideoBrand; index: number; total: number; look: Look }) {
  return (
    <div style={{ position: "absolute", top: 120, left: SAFE.left, right: SAFE.left, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: look.fg }}>
        <span style={{ display: "inline-block", width: 18, height: 18, background: look.accent, marginRight: 14, verticalAlign: "middle" }} />
        {brand.name}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ width: i === index ? 40 : 14, height: 14, borderRadius: 7, background: i <= index ? look.fg : look.line }} />
        ))}
      </div>
    </div>
  );
}

function Captions({ text, look }: { text: string; look: Look }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const CHUNK = 4;
  const per = durationInFrames / words.length;
  const wordIdx = Math.min(words.length - 1, Math.floor(frame / per));
  const chunkIdx = Math.floor(wordIdx / CHUNK);
  const chunk = words.slice(chunkIdx * CHUNK, chunkIdx * CHUNK + CHUNK);
  const highlight = look.capBg === look.accent ? look.onAccent : look.capBg === look.fg ? mascotColor(look) : look.accent;

  return (
    <div style={{ position: "absolute", top: SAFE.captionTop, left: SAFE.left, right: SAFE.right, display: "flex", justifyContent: "center" }}>
      <div style={{ background: look.capBg, color: look.capFg, padding: "20px 32px", borderRadius: 26, fontSize: 46, fontWeight: 700, textAlign: "center", lineHeight: 1.25 }}>
        {chunk.map((w, i) => (
          <span key={i} style={{ color: chunkIdx * CHUNK + i === wordIdx ? highlight : look.capFg, marginRight: 12 }}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

function Headline({ text, size = 104, delay = 0, align = "left" }: { text: string; size?: number; delay?: number; align?: "left" | "center" }) {
  return (
    <Rise delay={delay}>
      <div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.03, letterSpacing: -2.5, textAlign: align }}>{text}</div>
    </Rise>
  );
}

function Body({ text, look, delay = 8, align = "left", size = 46 }: { text?: string; look: Look; delay?: number; align?: "left" | "center"; size?: number }) {
  if (!text) return null;
  return (
    <Rise delay={delay}>
      <div style={{ marginTop: 34, fontSize: size, fontWeight: 500, lineHeight: 1.3, color: look.sub, textAlign: align }}>{text}</div>
    </Rise>
  );
}

function Kicker({ text, look }: { text: string; look: Look }) {
  return (
    <Rise>
      <div style={{ display: "inline-block", marginBottom: 34, padding: "10px 22px", borderRadius: 999, background: look.accent, color: look.onAccent, fontFamily: MONO, fontSize: 28, letterSpacing: 4, textTransform: "uppercase" }}>
        {text}
      </div>
    </Rise>
  );
}

function Area({ children, top = SAFE.top + 70, center = false }: { children: ReactNode; top?: number; center?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        width: CONTENT_W,
        top,
        ...(center ? { bottom: HEIGHT - SAFE.contentBottom, display: "flex", flexDirection: "column", justifyContent: "center" } : {}),
      }}
    >
      {children}
    </div>
  );
}

/* ── Layouts ─────────────────────────────────────────────────── */

function Hook({ scene, look }: LayoutProps) {
  const frame = useCurrentFrame();
  const words = scene.headline.split(" ");
  const last = words.pop();
  return (
    <>
      <Area top={340}>
        <Kicker text="Tips hari ini" look={look} />
        <Rise delay={3}>
          <div style={{ fontSize: 136, fontWeight: 700, lineHeight: 1.0, letterSpacing: -4 }}>
            {words.join(" ")} <span style={{ color: mascotColor(look) }}>{last}</span>
          </div>
        </Rise>
        <Body text={scene.body} look={look} size={52} />
      </Area>
      <PopIn delay={10} style={{ position: "absolute", right: SAFE.right - 20, top: 980, transform: `translateY(${Math.sin(frame / 8) * 12}px)` }}>
        <Robot color={mascotColor(look)} mood="working" size={300} blink={frame % 75 < 4 ? 0.15 : 1} />
      </PopIn>
    </>
  );
}

function Statement({ scene, look }: LayoutProps) {
  return (
    <Area center>
      <Rise>
        <div style={{ width: 120, height: 20, background: look.accent, marginBottom: 44 }} />
      </Rise>
      <Headline text={scene.headline} size={112} delay={2} />
      <Body text={scene.body} look={look} size={52} />
    </Area>
  );
}

function List({ scene, look }: LayoutProps) {
  return (
    <Area center>
      <Headline text={scene.headline} size={92} />
      <Body text={scene.body} look={look} delay={4} size={42} />
      <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 22 }}>
        {scene.items.slice(0, 4).map((item, i) => (
          <Rise key={i} delay={10 + i * 10}>
            <div style={{ display: "flex", alignItems: "center", gap: 26, background: look.card, color: look.cardFg, borderRadius: 26, padding: "26px 30px", border: `2px solid ${look.line}` }}>
              <div style={{ width: 22, height: 22, flexShrink: 0, background: mascotColor(look), borderRadius: 5 }} />
              <div style={{ fontSize: 50, fontWeight: 600, lineHeight: 1.15 }}>{item}</div>
            </div>
          </Rise>
        ))}
      </div>
    </Area>
  );
}

function Steps({ scene, look }: LayoutProps) {
  const items = scene.items.slice(0, 4);
  return (
    <Area center>
      <Headline text={scene.headline} size={92} />
      <Body text={scene.body} look={look} delay={4} size={42} />
      <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((item, i) => (
          <Rise key={i} delay={10 + i * 12}>
            <div style={{ display: "flex", gap: 34 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 92, height: 92, flexShrink: 0, borderRadius: 46, background: look.accent, color: look.onAccent, fontFamily: MONO, fontSize: 44, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i + 1}
                </div>
                {i < items.length - 1 && <div style={{ width: 6, height: 44, background: look.line }} />}
              </div>
              <div style={{ paddingTop: 16, fontSize: 54, fontWeight: 600, lineHeight: 1.15 }}>{item}</div>
            </div>
          </Rise>
        ))}
      </div>
    </Area>
  );
}

function Code({ scene, look }: LayoutProps) {
  const frame = useCurrentFrame();
  const shown = scene.code.slice(0, Math.floor(Math.max(0, frame - 10) * 1.8));
  return (
    <Area center>
      <Headline text={scene.headline} size={88} />
      <Rise delay={4}>
        <div style={{ marginTop: 46, background: "#121218", borderRadius: 30, padding: "34px 40px", boxShadow: "0 30px 80px rgba(0,0,0,.28)", border: `2px solid ${look.line}` }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 26 }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <div key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />
            ))}
          </div>
          <pre style={{ margin: 0, fontFamily: MONO, fontSize: 38, lineHeight: 1.5, color: "#E8E8F0", whiteSpace: "pre-wrap" }}>
            {shown}
            <span style={{ background: mascotColor(look), color: "transparent" }}>_</span>
          </pre>
        </div>
      </Rise>
      <Body text={scene.body} look={look} delay={14} size={44} />
    </Area>
  );
}

function Stat({ scene, look }: LayoutProps) {
  const frame = useCurrentFrame();
  const m = scene.stat.match(/^([^\d]*)([\d.,]+)(.*)$/);
  let display = scene.stat || "—";
  if (m) {
    const target = parseFloat(m[2].replace(/\./g, "").replace(",", "."));
    if (!Number.isNaN(target)) {
      const v = interpolate(frame, [0, 30], [0, target], { extrapolateRight: "clamp" });
      display = `${m[1]}${Number.isInteger(target) ? Math.round(v).toLocaleString("id-ID") : v.toFixed(1)}${m[3]}`;
    }
  }
  return (
    <Area center>
      <Rise>
        <div style={{ fontSize: 300, fontWeight: 700, letterSpacing: -12, color: mascotColor(look), lineHeight: 0.95 }}>{display}</div>
      </Rise>
      <Headline text={scene.headline} size={80} delay={6} />
      <Body text={scene.body} look={look} delay={12} size={44} />
    </Area>
  );
}

function CompareCol({ label, items, good, delay, look }: { label: string; items: string[]; good: boolean; delay: number; look: Look }) {
  return (
    <Rise delay={delay} style={{ flex: 1 }}>
      <div style={{ height: "100%", borderRadius: 30, padding: "34px 30px", background: good ? look.accent : look.card, color: good ? look.onAccent : look.cardFg, border: good ? "none" : `2px solid ${look.line}` }}>
        <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 4, textTransform: "uppercase", opacity: 0.75 }}>{label}</div>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 22 }}>
          {items.slice(0, 4).map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 14, fontSize: 42, fontWeight: 600, lineHeight: 1.2 }}>
              <span style={{ flexShrink: 0, fontWeight: 700 }}>{good ? "✓" : "✗"}</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </Rise>
  );
}

function Compare({ scene, look }: LayoutProps) {
  const [la, lb] = scene.labels?.length === 2 ? scene.labels : ["Sebelum", "Sesudah"];
  const a = scene.items.length ? scene.items : ["—"];
  const b = scene.items_b?.length ? scene.items_b : ["—"];
  return (
    <Area center>
      <Headline text={scene.headline} size={88} />
      <Body text={scene.body} look={look} delay={4} size={42} />
      <div style={{ marginTop: 48, display: "flex", gap: 22, alignItems: "stretch" }}>
        <CompareCol label={la} items={a} good={false} delay={8} look={look} />
        <CompareCol label={lb} items={b} good delay={16} look={look} />
      </div>
    </Area>
  );
}

function Chat({ scene, look }: LayoutProps) {
  const frame = useCurrentFrame();
  const [q = "", a = ""] = scene.items;
  const typed = a.slice(0, Math.floor(Math.max(0, frame - 22) * 2.2));
  return (
    <Area center>
      <Headline text={scene.headline} size={84} />
      <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 28 }}>
        <Rise delay={6} style={{ alignSelf: "flex-end", maxWidth: "88%" }}>
          <div style={{ background: look.fg, color: look.bg, borderRadius: "34px 34px 8px 34px", padding: "28px 34px", fontSize: 40, lineHeight: 1.3, fontWeight: 500 }}>{q}</div>
        </Rise>
        <Rise delay={16} style={{ display: "flex", gap: 18, alignItems: "flex-end", maxWidth: "94%" }}>
          <div style={{ flexShrink: 0 }}>
            <Robot color={mascotColor(look)} mood="working" size={84} />
          </div>
          <div style={{ background: look.card, color: look.cardFg, border: `2px solid ${look.line}`, borderRadius: "34px 34px 34px 8px", padding: "28px 34px", fontSize: 40, lineHeight: 1.3, fontWeight: 500, minHeight: 110 }}>
            {typed || "…"}
          </div>
        </Rise>
      </div>
      <Body text={scene.body} look={look} delay={20} size={40} />
    </Area>
  );
}

function Tip({ scene, look }: LayoutProps) {
  const frame = useCurrentFrame();
  return (
    <Area center>
      <Rise>
        <div style={{ position: "relative", background: look.card, color: look.cardFg, borderRadius: 40, padding: "70px 50px 56px", boxShadow: "0 30px 80px rgba(0,0,0,.18)" }}>
          <div style={{ position: "absolute", top: -150, right: 30, transform: `translateY(${Math.sin(frame / 9) * 8}px)` }}>
            <Robot color="#7C5CFF" mood="happy" size={170} />
          </div>
          <div style={{ display: "inline-block", padding: "8px 20px", borderRadius: 999, background: look.cardFg, color: look.card, fontFamily: MONO, fontSize: 26, letterSpacing: 4 }}>PRO TIP</div>
          <div style={{ marginTop: 30, fontSize: 92, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{scene.headline}</div>
          {scene.body ? <div style={{ marginTop: 28, fontSize: 46, lineHeight: 1.3, opacity: 0.78 }}>{scene.body}</div> : null}
        </div>
      </Rise>
    </Area>
  );
}

function Cta({ scene, look, brand }: LayoutProps) {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${Math.sin(frame / 8) * 12}px)` }}>
        <Robot color={mascotColor(look)} mood="happy" size={340} />
      </div>
      <div style={{ position: "absolute", top: 830, left: SAFE.left, right: SAFE.left, textAlign: "center" }}>
        <Headline text={scene.headline} size={100} align="center" delay={6} />
        <PopIn delay={14} style={{ marginTop: 44, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "18px 40px", borderRadius: 999, background: look.accent, color: look.onAccent, fontFamily: MONO, fontSize: 44, fontWeight: 700 }}>{brand.handle}</div>
        </PopIn>
        <Body text={scene.body || "Simpan video ini biar nggak lupa"} look={look} delay={20} align="center" size={40} />
      </div>
    </>
  );
}
