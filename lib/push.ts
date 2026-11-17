import "server-only";
import { sendNotification, setVapidDetails } from "web-push";
import { db, now, uid } from "./store";
import type { PushSubscriptionRow } from "./types";

/*
 * Web Push for the installed PWA (iPhone: iOS 16.4+, after "Add to Home Screen").
 * Generate keys once with `npx web-push generate-vapid-keys` and set
 * VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT (mailto:you@domain).
 */

export const hasPush = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configured = false;
function setup() {
  if (configured) return;
  setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@pixeldew.xyz",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export async function saveSubscription(sub: PushSubscriptionRow["subscription"], userAgent: string | null) {
  const existing = await db().list("push_subscriptions", { eq: { endpoint: sub.endpoint } });
  if (existing[0]) return existing[0];
  return db().insert("push_subscriptions", {
    id: uid(),
    endpoint: sub.endpoint,
    subscription: sub,
    user_agent: userAgent,
    created_at: now(),
  });
}

export async function removeSubscription(endpoint: string) {
  const rows = await db().list("push_subscriptions", { eq: { endpoint } });
  for (const r of rows) await deleteRow(r.id);
}

const deleteRow = (id: string) => db().remove("push_subscriptions", id);

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Send to every subscribed device. Never throws — notifications are best-effort. */
export async function notify(msg: PushMessage): Promise<number> {
  if (!hasPush()) return 0;
  try {
    setup();
    const subs = await db().list("push_subscriptions");
    let sent = 0;
    await Promise.all(
      subs.map(async (s) => {
        try {
          await sendNotification(s.subscription, JSON.stringify(msg), { TTL: 60 * 60 * 6, urgency: "high" });
          sent++;
        } catch (err) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await deleteRow(s.id); // device unsubscribed
          else console.error("push failed", code, err);
        }
      }),
    );
    return sent;
  } catch (err) {
    console.error("notify", err);
    return 0;
  }
}
