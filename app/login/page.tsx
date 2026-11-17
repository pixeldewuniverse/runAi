"use client";

import { useState, type FormEvent } from "react";
import { Robot } from "@/components/Robot";
import { Button } from "@/components/ui";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } else {
      setErr((await res.json().catch(() => ({}))).error ?? "Gagal masuk");
      setBusy(false);
    }
  }

  return (
    <div className="dot-floor fixed inset-0 grid place-items-center px-6">
      <form onSubmit={submit} className="card w-full max-w-sm p-6 text-center">
        <div className="bot-idle mx-auto w-fit">
          <Robot color="#2BD9B4" size={72} mood="happy" />
        </div>
        <h1 className="mt-3 text-2xl font-bold">runAI</h1>
        <p className="text-sm text-mute">Kantor agent Pixeldew</p>
        <input
          type="password"
          autoFocus
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          className="mt-5 w-full rounded-xl border border-line bg-paper px-3 py-3 text-center outline-none focus:border-ink/40"
        />
        {err && <p className="mt-2 text-sm text-danger">{err}</p>}
        <Button type="submit" className="mt-3 w-full" loading={busy}>
          Masuk
        </Button>
      </form>
    </div>
  );
}
