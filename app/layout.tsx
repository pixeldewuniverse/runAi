import type { Metadata, Viewport } from "next";
import { League_Spartan } from "next/font/google";
import "./globals.css";

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RunAI - AI Marketing Generator",
  description:
    "Generate complete marketing campaigns, copy, strategy, and assets from a single detailed prompt.",
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={leagueSpartan.variable}>
      <body className="bg-brand-bg text-brand-white antialiased">
        {children}
      </body>
    </html>
  );
}
