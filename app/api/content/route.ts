import { after, connection } from "next/server";
import { body, fail, ok } from "@/lib/api";
import { createContent, runIdeation } from "@/lib/pipeline/content";
import { db } from "@/lib/store";

export const maxDuration = 300;

export async function GET() {
  await connection();
  const rows = await db().list("contents", { order: { column: "created_at", ascending: false }, limit: 60 });
  return ok(rows);
}

/** Start a new content shift. Optional { hint } steers today's topic. */
export async function POST(req: Request) {
  try {
    const { hint } = await body<{ hint?: string }>(req);
    const row = await createContent(hint);
    after(() => runIdeation(row.id));
    return ok(row, { status: 201 });
  } catch (err) {
    return fail(err, 500);
  }
}
