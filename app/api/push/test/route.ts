import { fail, ok } from "@/lib/api";
import { hasPush, notify } from "@/lib/push";

export async function POST() {
  if (!hasPush()) return fail("Push belum diatur (VAPID key kosong)", 503);
  const sent = await notify({ title: "runAI", body: "Notifikasi aktif — tim akan mengabari saat butuh keputusanmu 👋", url: "/" });
  return ok({ sent });
}
