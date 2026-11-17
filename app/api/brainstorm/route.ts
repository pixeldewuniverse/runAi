import { after, connection } from "next/server";
import { z } from "zod";
import { body, fail, ok } from "@/lib/api";
import { createBrainstorm, runBrainstormRound } from "@/lib/pipeline/brainstorm";
import { db } from "@/lib/store";

export const maxDuration = 300;

export async function GET() {
  await connection();
  return ok(await db().list("brainstorms", { order: { column: "created_at", ascending: false }, limit: 50 }));
}

export async function POST(req: Request) {
  try {
    const { idea } = z.object({ idea: z.string().min(10, "Ceritakan idenya minimal 10 karakter") }).parse(await body(req));
    const row = await createBrainstorm(idea);
    after(() => runBrainstormRound(row.id));
    return ok(row, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}
