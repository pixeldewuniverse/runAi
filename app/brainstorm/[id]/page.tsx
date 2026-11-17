import { Suspense } from "react";
import { BrainstormRoom } from "@/components/BrainstormRoom";

export default function Page({ params }: PageProps<"/brainstorm/[id]">) {
  return (
    <Suspense fallback={<div className="card shimmer h-64" />}>
      <Resolved params={params} />
    </Suspense>
  );
}

async function Resolved({ params }: { params: PageProps<"/brainstorm/[id]">["params"] }) {
  const { id } = await params;
  return <BrainstormRoom id={id} />;
}
