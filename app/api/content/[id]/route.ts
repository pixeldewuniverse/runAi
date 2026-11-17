import { after, connection } from "next/server";
import { z } from "zod";
import { body, fail, ok } from "@/lib/api";
import {
  approveFinal,
  approveScript,
  markPublished,
  pickIdea,
  rejectContent,
  requestRevision,
  retryContent,
  runIdeation,
  runProduction,
  runScripting,
} from "@/lib/pipeline/content";
import { IdeaSchema } from "@/lib/schemas";
import { db } from "@/lib/store";

export const maxDuration = 300;

export async function GET(_req: Request, ctx: RouteContext<"/api/content/[id]">) {
  await connection();
  const { id } = await ctx.params;
  const row = await db().get("contents", id);
  return row ? ok(row) : fail("Konten tidak ditemukan", 404);
}

const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pick"), index: z.number().int().optional(), custom: IdeaSchema.optional() }),
  z.object({ action: z.literal("revise"), note: z.string().min(3) }),
  z.object({ action: z.literal("approve_script") }),
  z.object({ action: z.literal("approve_final") }),
  z.object({ action: z.literal("published") }),
  z.object({ action: z.literal("reject") }),
  z.object({ action: z.literal("retry") }),
]);

export async function POST(req: Request, ctx: RouteContext<"/api/content/[id]">) {
  const { id } = await ctx.params;
  try {
    const a = Action.parse(await body(req));
    switch (a.action) {
      case "pick": {
        const row = await pickIdea(id, { index: a.index, custom: a.custom });
        after(() => runScripting(id));
        return ok(row);
      }
      case "revise": {
        const row = await requestRevision(id, a.note);
        after(() => runScripting(id));
        return ok(row);
      }
      case "approve_script": {
        const row = await approveScript(id);
        after(() => runProduction(id));
        return ok(row);
      }
      case "approve_final":
        return ok(await approveFinal(id));
      case "published":
        return ok(await markPublished(id));
      case "reject":
        return ok(await rejectContent(id));
      case "retry": {
        const status = await retryContent(id);
        if (status === "researching") after(() => runIdeation(id));
        if (status === "scripting") after(() => runScripting(id));
        if (status === "rendering") after(() => runProduction(id));
        return ok({ status });
      }
    }
  } catch (err) {
    return fail(err);
  }
}
