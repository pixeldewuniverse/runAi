/**
 * "Dewbot" — Pixeldew's agent mascot. A dew-drop shaped robot with a visor
 * and LED eyes. Pure SVG (no hooks) so it works in the app *and* in Remotion.
 */

export type RobotMood = "idle" | "working" | "waiting" | "error" | "happy";

interface Props {
  color: string;
  mood?: RobotMood;
  size?: number;
  /** 0..1 — eye openness, used by Remotion for frame-exact blinking. */
  blink?: number;
  className?: string;
  title?: string;
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + 255 * amt)));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function Robot({ color, mood = "idle", size = 64, blink = 1, className, title }: Props) {
  const id = `rb-${color.slice(1)}`;
  const eye = mood === "error" ? "#FF5A5A" : "#7DF9E3";
  const eyeH = Math.max(1.2, 9 * blink);

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className={className}
      role="img"
      aria-label={title ?? "agent"}
    >
      <defs>
        <radialGradient id={`${id}-body`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={shade(color, 0.35)} />
          <stop offset="55%" stopColor={color} />
          <stop offset="100%" stopColor={shade(color, -0.3)} />
        </radialGradient>
        <linearGradient id={`${id}-visor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#23232E" />
          <stop offset="100%" stopColor="#0B0B10" />
        </linearGradient>
      </defs>

      {/* shadow */}
      <ellipse cx="50" cy="114" rx="26" ry="4.5" fill="#000" opacity="0.12" />

      {/* antenna */}
      <line x1="50" y1="14" x2="50" y2="5" stroke={shade(color, -0.25)} strokeWidth="3" strokeLinecap="round" />
      <rect x="45.5" y="0.5" width="9" height="9" rx="2" fill={mood === "working" ? eye : shade(color, 0.2)} />

      {/* arms */}
      <rect
        x="9"
        y={mood === "happy" ? 50 : 66}
        width="12"
        height="26"
        rx="6"
        fill={shade(color, -0.12)}
        transform={mood === "happy" ? "rotate(-35 15 63)" : undefined}
      />
      <rect x="79" y="66" width="12" height="26" rx="6" fill={shade(color, -0.12)} />

      {/* dew-drop body */}
      <path
        d="M50 12 C 64 30, 86 46, 86 72 C 86 94, 70 108, 50 108 C 30 108, 14 94, 14 72 C 14 46, 36 30, 50 12 Z"
        fill={`url(#${id}-body)`}
      />
      {/* highlight */}
      <path d="M33 44 C 37 37, 42 32, 46 28" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* visor */}
      <rect x="24" y="52" width="52" height="28" rx="14" fill={`url(#${id}-visor)`} />

      {/* eyes */}
      {mood === "error" ? (
        <g stroke={eye} strokeWidth="3" strokeLinecap="round">
          <path d="M35 61 l7 8 M42 61 l-7 8" />
          <path d="M58 61 l7 8 M65 61 l-7 8" />
        </g>
      ) : mood === "idle" ? (
        <g stroke={eye} strokeWidth="3" strokeLinecap="round" opacity="0.85">
          <path d="M34 67 q4 3 8 0" fill="none" />
          <path d="M58 67 q4 3 8 0" fill="none" />
        </g>
      ) : mood === "happy" ? (
        <g stroke={eye} strokeWidth="3" strokeLinecap="round">
          <path d="M34 68 q4 -6 8 0" fill="none" />
          <path d="M58 68 q4 -6 8 0" fill="none" />
        </g>
      ) : (
        <g fill={eye} className="robot-eyes">
          <rect x="34" y={66 - eyeH / 2} width="8" height={eyeH} rx="4" />
          <rect x="58" y={66 - eyeH / 2} width="8" height={eyeH} rx="4" />
        </g>
      )}

      {/* belly pixel */}
      <rect x="45" y="88" width="10" height="5" rx="2" fill="#fff" opacity="0.35" />
    </svg>
  );
}
