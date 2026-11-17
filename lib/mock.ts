import type { AgentId } from "./agents";

/* Demo outputs used when ANTHROPIC_API_KEY is not set. Shapes match lib/schemas.ts. */

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const IDEAS = [
  {
    title: "3 prompt yang bikin AI nulis kode lebih rapi",
    pillar: "Tips AI untuk kerja",
    hook: "Kode dari AI berantakan? Masalahnya di prompt kamu.",
    angle: "Kasih konteks stack, batasan, dan contoh output — hasilnya langsung beda.",
    key_points: ["Sebut stack & versi di awal prompt", "Tulis batasan: tanpa library tambahan", "Tempel contoh output yang diinginkan"],
    format: "List + potongan kode",
    why: "Masalah sehari-hari audiens, langsung bisa dipraktikkan.",
  },
  {
    title: "Tailwind v4: config pindah ke CSS",
    pillar: "Web dev praktis",
    hook: "File tailwind.config kamu sudah nggak wajib lagi.",
    angle: "Tunjukkan @theme di CSS dan kenapa ini mempercepat setup project.",
    key_points: ["@import tailwindcss menggantikan 3 directive", "Token warna ditulis di @theme", "Plugin dipasang lewat @plugin"],
    format: "Compare lama vs baru + kode",
    why: "Banyak yang masih bingung saat upgrade; konten evergreen.",
  },
  {
    title: "Cara kasih harga logo sebagai freelancer",
    pillar: "Behind the scenes freelance",
    hook: "Jangan pernah jual logo per jam.",
    angle: "Harga berdasarkan paket deliverable dan nilai bisnis klien.",
    key_points: ["Buat 3 paket: basic, standar, premium", "Hitung jumlah revisi & file final", "Tambah biaya lisensi untuk brand besar"],
    format: "Statement + list",
    why: "Topik yang selalu dicari freelancer pemula.",
  },
];

export function mockOutput(agent: AgentId, prompt: string): unknown {
  switch (agent) {
    case "scout":
      return {
        trends: [
          { topic: "AI coding agent makin umum dipakai freelancer", why_now: "Banyak rilis fitur agent minggu ini", angle: "Workflow nyata, bukan hype", source: "" },
          { topic: "Tailwind CSS v4 adopsi naik", why_now: "Template baru Next.js memakai v4", angle: "Panduan migrasi singkat", source: "" },
          { topic: "Harga jasa desain akhir tahun", why_now: "Musim budget klien Q4", angle: "Cara menyusun paket harga", source: "" },
        ],
      };
    case "strategist":
      return { ideas: IDEAS };
    case "scriptwriter":
    case "reviewer": {
      const revise = prompt.includes("REVISI");
      const script = {
        title: revise ? "3 prompt biar kode AI rapi (revisi)" : "3 prompt biar kode AI rapi",
        scenes: DEMO_SCRIPT,
        caption: "Prompt yang jelas = kode yang rapi. Simpan dulu, coba di project berikutnya 👇",
        hashtags: ["#webdev", "#ai", "#nextjs", "#freelancer", "#belajarcoding", "#tipsai"],
      };
      return agent === "reviewer"
        ? { score: 7, issues: ["Hook bisa lebih spesifik", "Scene 3 butuh contoh nyata"], script }
        : script;
    }
    case "director":
      return { scenes: DEMO_BOARD };
    case "publisher":
      return {
        caption: "Prompt yang jelas = kode yang rapi. Coba 3 trik ini di project kamu berikutnya 👇",
        hashtags: ["#webdev", "#ai", "#nextjs", "#freelancer", "#belajarcoding"],
        best_time_wib: "19.00–21.00",
        cover_title: "Prompt biar kode rapi",
      };
    case "facilitator":
      return {
        problem: "Freelancer kesulitan konsisten bikin konten sambil mengerjakan project klien.",
        users: "Freelancer developer/desainer solo",
        desired_outcome: "Konten harian jalan otomatis dengan kontrol kualitas minimal 5 menit per hari",
        assumptions: ["User mau konten faceless", "Platform utama TikTok"],
        questions: ["Berapa budget bulanan untuk API?", "Konten perlu persetujuan sebelum posting?", "Target jumlah posting per minggu?"],
      };
    case "researcher":
      return {
        comparables: [
          { name: "Tool penjadwal konten", what_they_do: "Jadwalkan posting multi-platform", lesson: "Kalender visual itu penting" },
          { name: "Generator video faceless", what_they_do: "Script + stok video + TTS", lesson: "Template brand membedakan dari konten generik" },
        ],
        gaps: ["Konten generik tanpa identitas brand", "Tidak ada alur approval yang nyaman di HP"],
        notes: "Data pembanding di mode demo bersifat contoh — jalankan dengan API key untuk riset sungguhan.",
      };
    case "critic":
      return {
        risks: [
          { risk: "Konten terasa generik", severity: "tinggi", mitigation: "Template visual khas + sudut pandang personal di setiap script" },
          { risk: "Biaya API membengkak", severity: "sedang", mitigation: "Batas harian per agent dan cache riset" },
          { risk: "Posting otomatis butuh review TikTok", severity: "sedang", mitigation: "Mulai dengan download + posting manual" },
        ],
        verdict: "Layak dikerjakan bila fokus ke kualitas template dan approval cepat.",
      };
    case "architect":
      return {
        mvp_features: [
          { feature: "Rantai agent konten (ide → script → storyboard)", effort_days: 3 },
          { feature: "Template video Remotion + render worker", effort_days: 4 },
          { feature: "Dashboard approval PWA", effort_days: 2 },
        ],
        later_features: ["Auto-post TikTok", "Analitik performa", "Image gen untuk B-roll"],
        stack: ["Next.js", "TypeScript", "Tailwind", "Supabase", "Remotion", "Railway"],
        architecture: "Next.js di Vercel menjalankan agent via Claude API dan menyimpan state di Supabase; worker Railway merender video dan mengunggah ke Supabase Storage.",
      };
    case "pm":
      return {
        title: "AI Content Office — MVP",
        summary: "Tim agent yang membuat satu video pendek per hari untuk brand, dengan approval di HP.",
        goals: ["Konsisten 5 video/minggu", "Waktu kerja user < 10 menit/hari"],
        success_metrics: ["Jumlah video terbit per minggu", "Rata-rata views 7 hari"],
        mvp_scope: ["Rantai agent konten", "Satu template video", "Approval di HP"],
        out_of_scope: ["Auto-post", "Multi-brand"],
        roadmap: [
          { week: "Minggu 1", focus: "Agent + database" },
          { week: "Minggu 2", focus: "Template video + worker" },
          { week: "Minggu 3", focus: "Uji coba harian + perbaikan prompt" },
        ],
        top_risks: ["Konten generik", "Biaya API"],
        first_step: "Isi profil brand dan jalankan rantai konten pertama.",
      };
    default:
      return { ideas: [pick(IDEAS)] };
  }
}

const DEMO_SCRIPT = [
  { voiceover: "Kode dari AI sering berantakan. Masalahnya bukan di AI-nya, tapi di prompt kamu.", on_screen: "Kode AI berantakan?", detail: "", seconds: 4 },
  { voiceover: "Tujuh puluh persen revisi yang aku lakukan datang dari prompt yang terlalu singkat.", on_screen: "Prompt pendek = revisi", detail: "Dari 20 project terakhir, revisi turun drastis setelah prompt dirapikan", seconds: 4 },
  { voiceover: "Satu. Sebut stack dan versinya di awal, biar AI nggak nebak.", on_screen: "Sebut stack & versi", detail: "Next.js 16, TypeScript, Tailwind v4", seconds: 5 },
  { voiceover: "Dua. Kasih batasan yang jelas. Misalnya, jangan pakai library tambahan.", on_screen: "Kasih batasan", detail: "Tanpa library baru, maksimal 80 baris", seconds: 5 },
  { voiceover: "Bedanya kelihatan banget. Prompt asal-asalan versus prompt yang lengkap.", on_screen: "Asal vs lengkap", detail: "", seconds: 5 },
  { voiceover: "Tiga. Tempel contoh output yang kamu mau. AI paling jago meniru pola.", on_screen: "Kasih contoh output", detail: "Format file, gaya penamaan, struktur folder", seconds: 5 },
  { voiceover: "Coba sekarang: buka chat AI, tulis stack, batasan, dan contoh. Lalu bandingkan hasilnya.", on_screen: "Coba sekarang", detail: "Stack + batasan + contoh = kode rapi", seconds: 5 },
  { voiceover: "Simpan video ini dan follow Pixeldew buat tips harian.", on_screen: "Follow @pixeldew", detail: "", seconds: 3 },
];

const E = { body: "", items: [] as string[], items_b: [] as string[], labels: [] as string[], code: "", stat: "" };
export const DEMO_BOARD = [
  { ...E, layout: "hook", theme: "dark", headline: "Kode AI berantakan?", body: "3 trik prompt biar hasilnya rapi", accent: "#FF7A45" },
  { ...E, layout: "stat", theme: "light", headline: "revisi karena prompt pendek", body: "Dari 20 project terakhir", stat: "70%", accent: "#7C5CFF" },
  { ...E, layout: "chat", theme: "light", headline: "Sebut stack & versi", items: ["Pakai Next.js 16, TypeScript, Tailwind v4. Buat komponen Button.", "Siap! Ini Button dengan varian primary & ghost, typed props, dan kelas Tailwind v4."], accent: "#2BD9B4" },
  { ...E, layout: "tip", theme: "accent", headline: "Kasih batasan", body: "Tanpa library baru, maksimal 80 baris, pakai server component.", accent: "#FFC93C" },
  { ...E, layout: "compare", theme: "light", headline: "Asal vs lengkap", labels: ["Asal", "Lengkap"], items: ["buat button", "hasil acak"], items_b: ["stack + versi", "batasan jelas", "contoh output"], accent: "#2BD9B4" },
  { ...E, layout: "steps", theme: "dark", headline: "Kasih contoh output", items: ["Format file", "Gaya penamaan", "Struktur folder"], accent: "#7C5CFF" },
  { ...E, layout: "code", theme: "light", headline: "Template prompt", code: "Stack: Next.js 16 + TS\nBatasan: tanpa library baru\nContoh: <tempel kode>\nTugas: buat Button", body: "Simpan dan pakai ulang", accent: "#FF7A45" },
  { ...E, layout: "cta", theme: "dark", headline: "Follow buat tips harian", accent: "#2BD9B4" },
];
export { DEMO_SCRIPT };
