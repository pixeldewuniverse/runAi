import type { Metadata } from "next";
import { BrainstormList } from "@/components/BrainstormList";

export const metadata: Metadata = { title: "Brainstorm" };

export default function Page() {
  return <BrainstormList />;
}
