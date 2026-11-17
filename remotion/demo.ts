import type { RenderScene } from "../lib/types";

export const DEMO_SCENES: RenderScene[] = [
  { layout: "hook", headline: "Kode AI berantakan?", voiceover: "Kode dari AI berantakan? Masalahnya bukan di AI-nya, tapi di prompt kamu.", on_screen: "", seconds: 4, items: [], code: "", stat: "", accent: "#FF7A45" },
  { layout: "code", headline: "Sebut stack-nya", voiceover: "Satu. Sebutkan stack kamu, biar AI nggak nebak.", on_screen: "", seconds: 5, items: [], code: "Stack: Next.js 16, TS,\nTailwind v4.\nBuat komponen Button.", stat: "", accent: "#2BD9B4" },
  { layout: "list", headline: "Kasih contoh output", voiceover: "Tunjukkan contoh output yang kamu mau. AI paling jago meniru pola.", on_screen: "", seconds: 5, items: ["Format file", "Gaya penamaan", "Struktur folder"], code: "", stat: "", accent: "#FFC93C" },
  { layout: "stat", headline: "lebih sedikit revisi", voiceover: "Hasilnya, revisi jauh lebih sedikit.", on_screen: "", seconds: 3, items: [], code: "", stat: "3x", accent: "#7C5CFF" },
  { layout: "cta", headline: "Follow buat tips harian", voiceover: "Follow Pixeldew buat tips harian.", on_screen: "", seconds: 3, items: [], code: "", stat: "", accent: "#2BD9B4" },
];
