"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export type Category =
  | "marketing_campaign"
  | "social_media"
  | "email_sequence"
  | "seo_content"
  | "ad_copy"
  | "content_calendar";

interface PromptInputProps {
  onSubmit: (prompt: string, category: Category) => void;
  loading?: boolean;
}

export function PromptInput({ onSubmit, loading = false }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<Category>("marketing_campaign");

  const categories: { value: Category; label: string }[] = [
    { value: "marketing_campaign", label: "Marketing Campaign" },
    { value: "social_media", label: "Social Media" },
    { value: "email_sequence", label: "Email Sequence" },
    { value: "seo_content", label: "SEO Content" },
    { value: "ad_copy", label: "Ad Copy" },
    { value: "content_calendar", label: "Content Calendar" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt, category);
    }
  };

  const charCount = prompt.length;
  const maxChars = 2000;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-brand-white mb-2">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.value}
              variant={category === cat.value ? "purple" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-brand-white mb-2">
          Your Prompt
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your business, product, target audience, goals, tone, and any specific requirements. The more detail you give, the better the output..."
          disabled={loading}
          maxLength={maxChars}
          className="min-h-[200px]"
        />
        <div className="flex justify-between items-center mt-2 text-xs text-brand-text-muted">
          <span></span>
          <span>
            {charCount} / {maxChars}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-gradient-to-r from-brand-purple to-brand-teal"
        disabled={loading || !prompt.trim()}
      >
        {loading ? "Generating..." : "Generate Now"}
      </Button>
    </form>
  );
}
