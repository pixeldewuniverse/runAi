# runAI — Kantor Agent Pixeldew

Kantor berisi tim agent AI yang **membuat konten harian** (dari riset tren sampai video jadi) dan **membantu brainstorming project**. Kamu cukup memberi keputusan dari HP: pilih ide, setujui script, setujui video.

```
Content Studio
  Scout (tren) ─▶ Strat (3 ide) ─▶ [kamu pilih] ─▶ Scripty (script) ─▶ Dira (storyboard)
  ─▶ [kamu setujui / minta revisi] ─▶ Pubby (caption) ─▶ Vox (voice-over) ─▶ Edi (render)
  ─▶ [kamu setujui video] ─▶ siap posting

Ruang Brainstorm
  Ide mentahmu ─▶ Fasi (rumuskan masalah) ─▶ Reza (riset) ─▶ Kritik (risiko)
  ─▶ Arka (solusi teknis) ─▶ Pim (project brief) ─▶ [kamu balas] ─▶ putaran berikutnya
```

## Stack

| Bagian | Teknologi |
| --- | --- |
| App + agent | Next.js 16 (App Router, Cache Components), TypeScript, Tailwind v4, PWA |
| AI | Claude API (`@anthropic-ai/sdk`) dengan structured output + web search |
| Data | Supabase (Postgres + Storage). Tanpa Supabase → in-memory untuk demo lokal |
| Video | Remotion: komposisi yang sama dipakai untuk preview di browser & render MP4 |
| Render worker | Node + Remotion renderer + TTS (OpenAI / ElevenLabs), di Railway |
| Jadwal | Vercel Cron, setiap hari 06.07 WIB (`vercel.json`) |

## Jalankan lokal (mode demo)

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Tanpa API key, agent memakai jawaban contoh supaya seluruh alur bisa dicoba. Isi `.env.local` (lihat `.env.example`) untuk memakai Claude sungguhan.

## Deploy

### 1. Supabase
1. Buat project baru di supabase.com.
2. Buka **SQL Editor**, jalankan berurutan `supabase/migrations/0001_init.sql` lalu `0002_reliability_push.sql`.
3. Catat `Project URL` dan `service_role key` (Settings → API).

### 2. App di Vercel
1. Import repo ini di Vercel.
2. Isi environment variables:
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_PASSCODE`: passcode login (wajib di production, karena setiap run memakai kredit API)
   - `CRON_SECRET`: string acak; Vercel otomatis mengirimnya ke `/api/cron/daily`
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: untuk notifikasi. Buat sekali dengan `npx web-push generate-vapid-keys`, `VAPID_SUBJECT` = `mailto:email-kamu`
3. Deploy. Buka di iPhone → Share → **Add to Home Screen**.
4. Buka runAI dari Home Screen → **Setelan → Aktifkan notifikasi** (iOS 16.4+).

### 3. Render worker di Railway (opsional, untuk MP4 bersuara)
1. New Project → Deploy from GitHub repo ini.
2. Settings → **Root Directory**: `/`. **Config file**: `worker/railway.json` (Dockerfile `worker/Dockerfile`).
3. Variables: `RENDER_WORKER_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `OPENAI_API_KEY` **atau** `ELEVENLABS_API_KEY`.
4. Generate domain, lalu di Vercel isi `RENDER_WORKER_URL=https://<domain-railway>` dan `RENDER_WORKER_SECRET` yang sama.

Tanpa worker, alur tetap jalan: video dipreview di browser (tanpa suara), tapi tidak ada file MP4 untuk diunduh.

Tes render lokal: `cd worker && npm install && npm run test:render` → `worker/out/demo.mp4`.

## Struktur

```
app/                 halaman (Kantor, Konten, Brainstorm, Setelan, Login) + API routes
  api/content        mulai shift, pilih ide, revisi, approve, dll
  api/brainstorm     sesi brainstorm & balasan
  api/cron/daily     dipanggil Vercel Cron tiap pagi
  api/render/callback  laporan progres dari render worker
components/          UI (OfficeFloor = denah kantor, Robot = maskot "Dewbot")
lib/agents.ts        daftar agent, ruangan, dan system prompt masing-masing
lib/schemas.ts       format JSON output tiap agent (zod)
lib/pipeline/        alur konten & brainstorm
lib/llm.ts           pemanggil Claude (+ mode demo)
lib/store.ts         data layer Supabase / memori
remotion/            template video Pixeldew (dipakai app & worker)
worker/              render worker Railway
supabase/migrations  skema database
```

## Mengubah perilaku agent

- **Gaya & identitas brand**: halaman **Setelan** (disimpan di database, dipakai semua agent).
- **Peran & instruksi agent**: `lib/agents.ts`.
- **Format output**: `lib/schemas.ts`.
- **Tampilan video**: `remotion/PixeldewVideo.tsx` (layout: hook, statement, list, code, stat, compare, cta). Hasilnya langsung terlihat di preview halaman konten.

## Ketahanan

- **Watchdog**: konten/brainstorm yang tidak ada kemajuan (8 menit untuk langkah agent, 25 menit untuk render) otomatis ditandai gagal dan kamu dapat notifikasi. Tombol **Coba lagi** melanjutkan dari langkah yang terhenti, bukan dari awal.
- **Brainstorm per langkah**: tiap agent berjalan di request terpisah (berantai lewat `/api/internal/brainstorm-step`), jadi satu putaran tidak kena batas waktu 5 menit Vercel.
- **Render tahan restart**: data job disimpan di `render_jobs.payload`. Saat worker restart/redeploy, job yang belum selesai dilanjutkan otomatis. Hasil render yang datang terlambat tetap diterima.

## Catatan

- Posting otomatis ke TikTok belum ada. Itu butuh TikTok Content Posting API yang harus lolos review TikTok dulu. Sementara: unduh MP4 dan salin caption dari halaman konten.
- Konten buatan AI yang realistis wajib diberi label AI di TikTok.
