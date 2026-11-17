import type { AgentId } from "./agents";

/* Demo outputs used when ANTHROPIC_API_KEY is not set. Shapes match lib/schemas.ts. */

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const IDEAS = [
  {
    title: "3 prompt yang bikin AI nulis kode lebih rapi",
    pillar: "Tips AI untuk kerja",
    hook: "Kode dari AI berantakan? Masalahnya di prompt kamu.",
    angle: "Kasih konteks stack, batasan, dan contoh output — hasilnya langsung beda.",
    format: "List + potongan kode",
    why: "Masalah sehari-hari audiens, langsung bisa dipraktikkan.",
  },
  {
    title: "Tailwind v4: config pindah ke CSS",
    pillar: "Web dev praktis",
    hook: "File tailwind.config kamu sudah nggak wajib lagi.",
    angle: "Tunjukkan @theme di CSS dan kenapa ini mempercepat setup project.",
    format: "Compare lama vs baru + kode",
    why: "Banyak yang masih bingung saat upgrade; konten evergreen.",
  },
  {
    title: "Cara kasih harga logo sebagai freelancer",
    pillar: "Behind the scenes freelance",
    hook: "Jangan pernah jual logo per jam.",
    angle: "Harga berdasarkan paket deliverable dan nilai bisnis klien.",
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
    case "scriptwriter": {
      const revise = prompt.includes("REVISI");
      return {
        title: revise ? "3 prompt biar kode AI rapi (revisi)" : "3 prompt biar kode AI rapi",
        scenes: [
          { voiceover: "Kode dari AI berantakan? Masalahnya bukan di AI-nya, tapi di prompt kamu.", on_screen: "Kode AI berantakan?", seconds: 4 },
          { voiceover: "Satu. Sebutkan stack kamu. Next.js, TypeScript, Tailwind. Biar AI nggak nebak.", on_screen: "1. Sebut stack-nya", seconds: 6 },
          { voiceover: "Dua. Kasih batasan. Misalnya, jangan pakai library tambahan.", on_screen: "2. Kasih batasan", seconds: 5 },
          { voiceover: "Tiga. Tunjukkan contoh output yang kamu mau. AI paling jago meniru pola.", on_screen: "3. Kasih contoh", seconds: 6 },
          { voiceover: "Simpan video ini, dan follow Pixeldew buat tips harian.", on_screen: "Follow @pixeldew", seconds: 4 },
        ],
        caption: "Prompt yang jelas = kode yang rapi. Coba 3 trik ini di project kamu berikutnya 👇",
        hashtags: ["#webdev", "#ai", "#nextjs", "#freelancer", "#belajarcoding", "#tipsai"],
      };
    }
    case "director":
      return {
        scenes: [
          { layout: "hook", headline: "Kode AI berantakan?", items: [], code: "", stat: "", accent: "#FF7A45" },
          { layout: "code", headline: "Sebut stack-nya", items: [], code: "Stack: Next.js 16, TS,\nTailwind v4.\nTulis komponen Button.", stat: "", accent: "#2BD9B4" },
          { layout: "statement", headline: "Kasih batasan yang jelas", items: [], code: "", stat: "", accent: "#7C5CFF" },
          { layout: "list", headline: "Kasih contoh output", items: ["Format file", "Gaya penamaan", "Struktur folder"], code: "", stat: "", accent: "#FFC93C" },
          { layout: "cta", headline: "Follow @pixeldew", items: [], code: "", stat: "", accent: "#2BD9B4" },
        ],
      };
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
