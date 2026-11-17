import type { Metadata } from "next";
import { ContentList } from "@/components/ContentList";

export const metadata: Metadata = { title: "Konten" };

export default function Page() {
  return <ContentList />;
}
