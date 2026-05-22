"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { PromptInput, type Category } from "@/components/features/PromptInput";
import { OutputViewer } from "@/components/features/OutputViewer";
import { LoadingState } from "@/components/features/LoadingState";
import { Card } from "@/components/ui/Card";
import type { GeneratedOutput } from "@/lib/types";

export default function GeneratePage() {
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (prompt: string, category: Category) => {
    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, category }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const data: GeneratedOutput = await response.json();
      setOutput(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 md:py-12">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Input */}
            <div className="space-y-4">
              <div>
                <h1 className="text-h2 font-bold mb-2">Generate Your Campaign</h1>
                <p className="text-body text-brand-text-muted">
                  Describe your business and goals in detail for the best results
                </p>
              </div>

              <Card glass>
                <PromptInput onSubmit={handleGenerate} loading={loading} />
              </Card>
            </div>

            {/* Right: Output */}
            <div className="space-y-4">
              <div>
                <h2 className="text-h2 font-bold mb-2">Your Results</h2>
                <p className="text-body text-brand-text-muted">
                  {loading
                    ? "Generating your marketing package..."
                    : output
                      ? "Your complete marketing package is ready"
                      : "Enter a prompt and click Generate to see results here"}
                </p>
              </div>

              <div>
                {error && (
                  <Card glass glow="orange" className="bg-red-500 bg-opacity-10">
                    <p className="text-brand-orange font-semibold">Error</p>
                    <p className="text-sm text-brand-orange mt-1">{error}</p>
                  </Card>
                )}

                {loading && <LoadingState />}

                {!loading && output && <OutputViewer output={output} />}

                {!loading && !output && !error && (
                  <Card glass className="text-center py-12">
                    <p className="text-brand-text-muted">
                      Your generated marketing package will appear here
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
