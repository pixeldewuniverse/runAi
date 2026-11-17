"use client";

import { Bell, BellOff, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Button } from "./ui";

type Info = { enabled: boolean; publicKey: string | null; devices: number };

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushToggle() {
  const [info, setInfo] = useState<Info | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser capability detection
    setSupported(ok);
    setNeedsInstall(ios && !standalone);
    api<Info>("/api/push").then(setInfo).catch(() => setInfo(null));
    if (ok) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => reg.pushManager.getSubscription())
        .then(setSub)
        .catch(() => undefined);
    }
  }, []);

  async function enable() {
    if (!info?.publicKey) return;
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") throw new Error("Izin notifikasi ditolak. Aktifkan lewat pengaturan perangkat.");
      const reg = await navigator.serviceWorker.ready;
      const s = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(info.publicKey),
      });
      await api("/api/push", { method: "POST", json: { subscription: s.toJSON() } });
      setSub(s);
      await api("/api/push/test", { method: "POST" });
      setMsg("Aktif! Notifikasi percobaan sudah dikirim.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!sub) return;
    setBusy(true);
    await api("/api/push", { method: "DELETE", json: { endpoint: sub.endpoint } }).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
    setSub(null);
    setMsg("Notifikasi dimatikan di perangkat ini.");
    setBusy(false);
  }

  if (supported === null || !info) return <div className="card shimmer h-24" />;

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-start gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${sub ? "bg-dew/25" : "bg-paper-2"}`}>
          {sub ? <Bell size={18} /> : <BellOff size={18} className="text-mute" />}
        </span>
        <div className="text-sm">
          <p className="font-medium">{sub ? "Notifikasi aktif di perangkat ini" : "Notifikasi ke HP"}</p>
          <p className="text-mute">
            Dikabari saat ide siap dipilih, script/video perlu disetujui, atau ada proses yang gagal.
          </p>
        </div>
      </div>

      {!info.enabled ? (
        <p className="rounded-xl bg-paper px-3 py-2 font-mono text-[11px] text-mute">
          Isi VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT di server. Buat key: npx web-push generate-vapid-keys
        </p>
      ) : needsInstall ? (
        <p className="flex items-start gap-2 rounded-xl bg-sun/20 px-3 py-2 text-sm">
          <Share size={16} className="mt-0.5 shrink-0" />
          Di iPhone, notifikasi hanya bisa dari app yang dipasang: tap Share → <b>Add to Home Screen</b>, lalu buka runAI dari Home Screen dan aktifkan di sini.
        </p>
      ) : !supported ? (
        <p className="text-sm text-mute">Browser ini tidak mendukung push notification.</p>
      ) : sub ? (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={disable} loading={busy}>
            Matikan
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => api("/api/push/test", { method: "POST" }).then(() => setMsg("Notifikasi percobaan dikirim."))}>
            Kirim notifikasi tes
          </Button>
        </div>
      ) : (
        <Button className="w-full" onClick={enable} loading={busy}>
          <Bell size={16} /> Aktifkan notifikasi
        </Button>
      )}
      {msg && <p className="text-sm text-ink-2">{msg}</p>}
      {info.enabled && info.devices > 0 && <p className="font-mono text-[11px] text-mute">{info.devices} perangkat terdaftar</p>}
    </div>
  );
}
