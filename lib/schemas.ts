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
      on_screen: z.string(),
      seconds: z.number(),
    }),
  ),
  caption: z.string(),
  hashtags: z.array(z.string()),
});
export type Script = z.infer<typeof ScriptSchema>;

export const LAYOUTS = ["hook", "statement", "list", "code", "stat", "compare", "cta"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const StoryboardSceneSchema = z.object({
  layout: z.enum(LAYOUTS),
  headline: z.string().describe("Teks utama di layar, maks 8 kata"),
  items: z.array(z.string()).describe("Untuk list: 2-4 poin. Untuk compare: tepat 2 (A, B). Lainnya: kosong"),
  code: z.string().describe("Untuk layout code: potongan kode maks 6 baris. Lainnya: kosong"),
  stat: z.string().describe("Untuk layout stat: angka/nilai besar. Lainnya: kosong"),
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
