import { after, connection } from "next/server";
import { z } from "zod";
import { body, fail, ok } from "@/lib/api";
import { closeBrainstorm, getTranscript, replyBrainstorm, runBrainstormRound } from "@/lib/pipeline/brainstorm";
import { db } from "@/lib/store";

export const maxDuration = 300;

export async function GET(_req: Request, ctx: RouteContext<"/api/brainstorm/[id]">) {
  await connection();
  const { id } = await ctx.params;
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
  try {
    const a = Action.parse(await body(req));
    if (a.action === "close") return ok(await closeBrainstorm(id));
    if (a.action === "reply") {
      const row = await replyBrainstorm(id, a.text);
      after(() => runBrainstormRound(id));
      return ok(row);
    }
    const row = await db().update("brainstorms", id, { status: "running", error: null });
    after(() => runBrainstormRound(id));
    return ok(row);
  } catch (err) {
    return fail(err);
  }
}
