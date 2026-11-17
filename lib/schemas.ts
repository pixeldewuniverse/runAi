import { z } from "zod";

/* Output schemas for every agent. Kept free of min/max constraints so they
 * stay compatible with Claude structured outputs; counts are enforced in the
 * prompts and trimmed in code. */

export const TrendsSchema = z.object({
  trends: z.array(
    z.object({
      topic: z.string(),
      why_now: z.string(),
      angle: z.string(),
      source: z.string().describe("URL atau nama sumber, kosong jika dari pengetahuan umum"),
    }),
  ),
});
export type Trends = z.infer<typeof TrendsSchema>;

export const IdeaSchema = z.object({
  title: z.string(),
  pillar: z.string(),
  hook: z.string(),
  angle: z.string(),
  key_points: z.array(z.string()).describe("3-5 poin isi KONKRET yang akan diajarkan (langkah, tool, angka, contoh)"),
  format: z.string(),
  why: z.string(),
});
export type Idea = z.infer<typeof IdeaSchema>;

export const IdeasSchema = z.object({ ideas: z.array(IdeaSchema) });

export const ScriptSchema = z.object({
  title: z.string(),
  scenes: z.array(
    z.object({
      voiceover: z.string(),
      on_screen: z.string().describe("Judul layar, maks 7 kata"),
      detail: z.string().describe("Info pendukung di layar: contoh, angka, perintah, atau penjelasan singkat (maks 18 kata)"),
      seconds: z.number(),
    }),
  ),
  caption: z.string(),
  hashtags: z.array(z.string()),
});
export type Script = z.infer<typeof ScriptSchema>;

export const ReviewSchema = z.object({
  score: z.number().describe("Nilai 1-10 untuk seberapa informatif & menarik script awal"),
  issues: z.array(z.string()),
  script: ScriptSchema,
});

export const LAYOUTS = ["hook", "statement", "list", "steps", "code", "stat", "compare", "chat", "tip", "cta"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const THEMES = ["light", "dark", "accent"] as const;
export type Theme = (typeof THEMES)[number];

export const StoryboardSceneSchema = z.object({
  layout: z.enum(LAYOUTS),
  theme: z.enum(THEMES).describe("light = kertas terang, dark = latar gelap, accent = latar warna aksen penuh"),
  headline: z.string().describe("Teks utama di layar, maks 7 kata"),
  body: z.string().describe("Teks pendukung 1-2 baris (maks 18 kata). Kosong untuk hook/cta jika tidak perlu"),
  items: z.array(z.string()).describe("list/steps: 2-4 poin pendek. compare: poin kolom A. chat: [pertanyaan/prompt, jawaban AI]. Lainnya: kosong"),
  items_b: z.array(z.string()).describe("compare: poin kolom B. Lainnya: kosong"),
  labels: z.array(z.string()).describe("compare: 2 label kolom, mis. [\"Salah\", \"Benar\"]. Lainnya: kosong"),
  code: z.string().describe("code: potongan kode/perintah maks 6 baris. Lainnya: kosong"),
  stat: z.string().describe("stat: angka/nilai besar, mis. 3x, 70%, 10 menit. Lainnya: kosong"),
  accent: z.string().describe("Warna aksen hex dari palet brand"),
});
export type StoryboardScene = z.infer<typeof StoryboardSceneSchema>;

export const StoryboardSchema = z.object({ scenes: z.array(StoryboardSceneSchema) });
export type Storyboard = z.infer<typeof StoryboardSchema>;

export const PublishSchema = z.object({
  caption: z.string(),
  hashtags: z.array(z.string()),
  best_time_wib: z.string(),
  cover_title: z.string(),
});
export type PublishPlan = z.infer<typeof PublishSchema>;

/* ── Brainstorm ─────────────────────────────────────────────── */

export const FacilitatorSchema = z.object({
  problem: z.string(),
  users: z.string(),
  desired_outcome: z.string(),
  assumptions: z.array(z.string()),
  questions: z.array(z.string()),
});

export const ResearchSchema = z.object({
  comparables: z.array(z.object({ name: z.string(), what_they_do: z.string(), lesson: z.string() })),
  gaps: z.array(z.string()),
  notes: z.string(),
});

export const CritiqueSchema = z.object({
  risks: z.array(
    z.object({ risk: z.string(), severity: z.enum(["rendah", "sedang", "tinggi"]), mitigation: z.string() }),
  ),
  verdict: z.string(),
});

export const ArchitectureSchema = z.object({
  mvp_features: z.array(z.object({ feature: z.string(), effort_days: z.number() })),
  later_features: z.array(z.string()),
  stack: z.array(z.string()),
  architecture: z.string(),
});

export const BriefSchema = z.object({
  title: z.string(),
  summary: z.string(),
  goals: z.array(z.string()),
  success_metrics: z.array(z.string()),
  mvp_scope: z.array(z.string()),
  out_of_scope: z.array(z.string()),
  roadmap: z.array(z.object({ week: z.string(), focus: z.string() })),
  top_risks: z.array(z.string()),
  first_step: z.string(),
});
export type Brief = z.infer<typeof BriefSchema>;
