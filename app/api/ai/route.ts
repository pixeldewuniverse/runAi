import { connection } from "next/server";
import { body, fail, ok } from "@/lib/api";
import { AiSettingsSchema, aiStatus, saveAiSettings } from "@/lib/ai/settings";

export async function GET() {
  await connection();
  return ok(await aiStatus());
}

export async function PUT(req: Request) {
  try {
    await saveAiSettings(AiSettingsSchema.parse(await body(req)));
    return ok(await aiStatus());
  } catch (err) {
    return fail(err);
  }
}
