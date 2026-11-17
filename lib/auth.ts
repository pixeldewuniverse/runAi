/* Single-user passcode gate. Set APP_PASSCODE to enable (strongly recommended
 * in production — every agent run spends API credit). */

export const SESSION_COOKIE = "runai_session";

export async function sessionToken(passcode: string): Promise<string> {
  const data = new TextEncoder().encode(`runai:${passcode}:${process.env.SESSION_SALT ?? "pixeldew"}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** For machine endpoints: compare an `Authorization: Bearer <secret>` header. */
export function bearerOk(req: Request, secret: string | undefined) {
  if (!secret) return false;
  const h = req.headers.get("authorization") ?? "";
  return safeEqual(h, `Bearer ${secret}`);
}

/** Secret for the app calling its own internal endpoints (step chaining). */
export function internalSecret(): string | undefined {
  return (
    process.env.INTERNAL_SECRET ||
    process.env.CRON_SECRET ||
    process.env.APP_PASSCODE ||
    (process.env.NODE_ENV !== "production" ? "dev-internal" : undefined)
  );
}
