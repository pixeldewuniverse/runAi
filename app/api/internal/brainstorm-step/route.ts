import { after } from "next/server";
import { bearerOk, internalSecret } from "@/lib/auth";
import { body, fail, ok } from "@/lib/api";
import { runBrainstormStep } from "@/lib/pipeline/brainstorm";

export const maxDuration = 300;

/** Internal: runs one brainstorm agent, then chains to the next step. */
export async function POST(req: Request) {
  if (!bearerOk(req, internalSecret())) return fail("Unauthorized", 401);
  const { id, step } = await body<{ id?: string; step?: number }>(req);
  if (!id) return fail("id wajib");
  const origin = new URL(req.url).origin;
  after(() => runBrainstormStep(id, origin, step));
  return ok({ accepted: true });
}
