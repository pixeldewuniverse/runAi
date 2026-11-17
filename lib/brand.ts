import { z } from "zod";

export const BrandSchema = z.object({
  name: z.string(),
  handle: z.string(),
  niche: z.string(),
  audience: z.string(),
  language: z.string(),
  tone: z.string(),
  pillars: z.array(z.string()),
  avoid: z.array(z.string()),
  cta: z.string(),
  palette: z.object({
    background: z.string(),
    ink: z.string(),
    accents: z.array(z.string()),
  }),
  voice: z.object({
    provider: z.enum(["gemini", "openai", "elevenlabs"]),
    voiceId: z.string(),
  }),
});
export type Brand = z.infer<typeof BrandSchema>;

/** Starting profile for Pixeldew. Edit it from /settings. */
export const DEFAULT_BRAND: Brand = {
  name: "Pixeldew",
  handle: "@pixeldew",
  niche: "Web development, desain, dan pemanfaatan AI untuk freelancer & kreator",
  audience: "Developer, desainer, dan freelancer Indonesia usia 18–35 yang ingin kerja lebih cepat dan lebih rapi",
  language: "Bahasa Indonesia santai (boleh istilah teknis bahasa Inggris)",
  tone: "Santai, to the point, praktis, sedikit playful — seperti teman yang jago ngoding dan desain",
  pillars: ["Tips AI untuk kerja", "Web dev praktis", "Desain & branding", "Behind the scenes freelance"],
  avoid: ["Clickbait palsu", "Klaim penghasilan", "Menjelekkan tool/brand lain"],
  cta: "Follow @pixeldew buat tips harian",
  palette: {
    background: "#F4F2EC",
    ink: "#121218",
    accents: ["#2BD9B4", "#7C5CFF", "#FF7A45", "#FFC93C"],
  },
  voice: { provider: "gemini", voiceId: "Kore" },
};
