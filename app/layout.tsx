import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "runAI — Pixeldew Office", template: "%s · runAI" },
  description: "Kantor agent AI Pixeldew: konten harian dan brainstorming project.",
  appleWebApp: { capable: true, title: "runAI", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f4f2ec",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="antialiased">
      <body className="min-h-dvh">
        <Suspense fallback={null}>
          <Nav />
        </Suspense>
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 md:pb-12 md:pl-28">{children}</main>
      </body>
    </html>
  );
}
