import { after } from "next/server";
import { bearerOk } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { createContent, runIdeation } from "@/lib/pipeline/content";
import { sweepStale } from "@/lib/watchdog";

export const maxDuration = 300;

/** Called by Vercel Cron every morning (see vercel.json). Vercel sends
 *  `Authorization: Bearer $CRON_SECRET` automatically. */
export async function GET(req: Request) {
  if (!bearerOk(req, process.env.CRON_SECRET)) return fail("Unauthorized", 401);
  await sweepStale(true);
  const row = await createContent();
  after(() => runIdeation(row.id));
  return ok({ started: row.id });
}
