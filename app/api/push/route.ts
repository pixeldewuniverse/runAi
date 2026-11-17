import { connection } from "next/server";
import { z } from "zod";
import { body, fail, ok } from "@/lib/api";
import { hasPush, removeSubscription, saveSubscription } from "@/lib/push";
import { db } from "@/lib/store";

export async function GET() {
  await connection();
  const devices = hasPush() ? (await db().list("push_subscriptions")).length : 0;
  return ok({ enabled: hasPush(), publicKey: process.env.VAPID_PUBLIC_KEY ?? null, devices });
}

const Sub = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(req: Request) {
  if (!hasPush()) return fail("Push belum diatur (VAPID key kosong)", 503);
  try {
    const { subscription } = z.object({ subscription: Sub }).parse(await body(req));
    await saveSubscription(subscription, req.headers.get("user-agent"));
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: Request) {
  const { endpoint } = await body<{ endpoint?: string }>(req);
  if (endpoint) await removeSubscription(endpoint);
  return ok({ ok: true });
}
