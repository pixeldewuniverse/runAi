import { after, connection } from "next/server";
import { z } from "zod";
import { body, fail, ok } from "@/lib/api";
import { closeBrainstorm, getTranscript, replyBrainstorm, retryBrainstorm, runBrainstormStep } from "@/lib/pipeline/brainstorm";
import { sweepStale } from "@/lib/watchdog";
import { db } from "@/lib/store";

export const maxDuration = 300;

export async function GET(_req: Request, ctx: RouteContext<"/api/brainstorm/[id]">) {
  await connection();
  const { id } = await ctx.params;
  await sweepStale();
  const session = await db().get("brainstorms", id);
  if (!session) return fail("Sesi tidak ditemukan", 404);
  return ok({ session, messages: await getTranscript(id) });
}

const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reply"), text: z.string().min(2) }),
  z.object({ action: z.literal("retry") }),
  z.object({ action: z.literal("close") }),
]);

export async function POST(req: Request, ctx: RouteContext<"/api/brainstorm/[id]">) {
  const { id } = await ctx.params;
  const origin = new URL(req.url).origin;
  try {
    const a = Action.parse(await body(req));
    if (a.action === "close") return ok(await closeBrainstorm(id));
    if (a.action === "reply") {
      const row = await replyBrainstorm(id, a.text);
      after(() => runBrainstormStep(id, origin, 0));
      return ok(row);
    }
    const row = await retryBrainstorm(id);
    after(() => runBrainstormStep(id, origin));
    return ok(row);
  } catch (err) {
    return fail(err);
  }
}
