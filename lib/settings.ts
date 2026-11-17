import "server-only";
import { BrandSchema, DEFAULT_BRAND, type Brand } from "./brand";
import { db, now } from "./store";

export async function getBrand(): Promise<Brand> {
  const row = await db().get("settings", "brand");
  const parsed = BrandSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : DEFAULT_BRAND;
}

export async function saveBrand(brand: Brand) {
  await db().upsert("settings", { key: "brand", value: brand, updated_at: now() });
}

export function brandContext(b: Brand): string {
  return `PROFIL BRAND
Nama: ${b.name} (${b.handle})
Niche: ${b.niche}
Audiens: ${b.audience}
Bahasa: ${b.language}
Tone: ${b.tone}
Pilar konten: ${b.pillars.join("; ")}
Hindari: ${b.avoid.join("; ")}
CTA standar: ${b.cta}
Palet aksen: ${b.palette.accents.join(", ")}`;
}
