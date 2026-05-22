"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

const loadingMessages = [
  "Analyzing your prompt...",
  "Building campaign structure...",
  "Generating copy variants...",
  "Creating content calendar...",
  "Developing SEO strategy...",
  "Crafting social media kit...",
  "Finalizing output...",
];

export function LoadingState() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <Card glass glow="purple" className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-brand-purple rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-brand-text-muted text-sm">
              {loadingMessages[currentMessageIndex]}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-brand-text-muted">Progress</span>
              <span className="text-xs text-brand-purple font-semibold">
                {Math.round(((currentMessageIndex + 1) / loadingMessages.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-brand-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-purple to-brand-teal transition-all duration-300"
                style={{
                  width: `${((currentMessageIndex + 1) / loadingMessages.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {[0, 1, 2].map((i) => (
        <Card key={i} glass className="p-4">
          <div className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-brand-surface via-brand-border to-brand-surface rounded animate-pulse" />
            <div className="h-4 bg-gradient-to-r from-brand-surface via-brand-border to-brand-surface rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gradient-to-r from-brand-surface via-brand-border to-brand-surface rounded animate-pulse w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );
}
