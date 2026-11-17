import { bearerOk } from "@/lib/auth";
import { body, fail, ok } from "@/lib/api";
import { handleRenderCallback, type RenderCallback } from "@/lib/render";

/** The Railway render worker reports progress here. */
export async function POST(req: Request) {
  if (!bearerOk(req, process.env.RENDER_WORKER_SECRET)) return fail("Unauthorized", 401);
  try {
    await handleRenderCallback(await body<RenderCallback>(req));
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
