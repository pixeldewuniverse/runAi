import type { Metadata } from "next";
import { SettingsView } from "@/components/SettingsView";

export const metadata: Metadata = { title: "Setelan" };

export default function Page() {
  return <SettingsView />;
}
