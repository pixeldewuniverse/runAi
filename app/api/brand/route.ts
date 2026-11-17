import { connection } from "next/server";
import { body, fail, ok } from "@/lib/api";
import { BrandSchema } from "@/lib/brand";
import { getBrand, saveBrand } from "@/lib/settings";

export async function GET() {
  await connection();
  return ok(await getBrand());
}

export async function PUT(req: Request) {
  try {
    const brand = BrandSchema.parse(await body(req));
    await saveBrand(brand);
    return ok(brand);
  } catch (err) {
    return fail(err);
  }
}
