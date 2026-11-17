import { Suspense } from "react";
import { ContentDetail } from "@/components/ContentDetail";

export default function Page({ params }: PageProps<"/content/[id]">) {
  return (
    <Suspense fallback={<div className="card shimmer h-64" />}>
      <Resolved params={params} />
    </Suspense>
  );
}

async function Resolved({ params }: { params: PageProps<"/content/[id]">["params"] }) {
  const { id } = await params;
  return <ContentDetail id={id} />;
}
