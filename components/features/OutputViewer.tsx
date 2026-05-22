"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Copy, Download } from "lucide-react";

interface OutputSection {
  strategy: string;
  copy: string;
  calendar: string;
  ads: string;
  seo: string;
  social: string;
}

interface OutputViewerProps {
  output: OutputSection;
  loading?: boolean;
}

export function OutputViewer({ output, loading = false }: OutputViewerProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopied(section);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadOutput = (format: "txt" | "md") => {
    let content = Object.entries(output)
      .map(([key, value]) => `## ${key.toUpperCase()}\n\n${value}`)
      .join("\n\n---\n\n");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(content)
    );
    element.setAttribute(
      "download",
      `runai-output.${format === "txt" ? "txt" : "md"}`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const tabs = [
    {
      label: "Overview & Strategy",
      value: "strategy",
      content: (
        <div className="space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-md p-4 whitespace-pre-wrap text-brand-white text-sm leading-relaxed font-mono">
            {output.strategy}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(output.strategy, "strategy")}
          >
            <Copy className="w-4 h-4" />
            {copied === "strategy" ? "Copied!" : "Copy"}
          </Button>
        </div>
      ),
    },
    {
      label: "Copy & Headlines",
      value: "copy",
      content: (
        <div className="space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-md p-4 whitespace-pre-wrap text-brand-white text-sm leading-relaxed font-mono">
            {output.copy}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(output.copy, "copy")}
          >
            <Copy className="w-4 h-4" />
            {copied === "copy" ? "Copied!" : "Copy"}
          </Button>
        </div>
      ),
    },
    {
      label: "Content Calendar",
      value: "calendar",
      content: (
        <div className="space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-md p-4 whitespace-pre-wrap text-brand-white text-sm leading-relaxed font-mono">
            {output.calendar}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(output.calendar, "calendar")}
          >
            <Copy className="w-4 h-4" />
            {copied === "calendar" ? "Copied!" : "Copy"}
          </Button>
        </div>
      ),
    },
    {
      label: "Ad Briefs",
      value: "ads",
      content: (
        <div className="space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-md p-4 whitespace-pre-wrap text-brand-white text-sm leading-relaxed font-mono">
            {output.ads}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(output.ads, "ads")}
          >
            <Copy className="w-4 h-4" />
            {copied === "ads" ? "Copied!" : "Copy"}
          </Button>
        </div>
      ),
    },
    {
      label: "SEO Keywords",
      value: "seo",
      content: (
        <div className="space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-md p-4 whitespace-pre-wrap text-brand-white text-sm leading-relaxed font-mono">
            {output.seo}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(output.seo, "seo")}
          >
            <Copy className="w-4 h-4" />
            {copied === "seo" ? "Copied!" : "Copy"}
          </Button>
        </div>
      ),
    },
    {
      label: "Social Media Kit",
      value: "social",
      content: (
        <div className="space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-md p-4 whitespace-pre-wrap text-brand-white text-sm leading-relaxed font-mono">
            {output.social}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(output.social, "social")}
          >
            <Copy className="w-4 h-4" />
            {copied === "social" ? "Copied!" : "Copy"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => downloadOutput("txt")}
          disabled={loading}
        >
          <Download className="w-4 h-4" />
          Download TXT
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => downloadOutput("md")}
          disabled={loading}
        >
          <Download className="w-4 h-4" />
          Download MD
        </Button>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-md p-4">
        <Tabs tabs={tabs} defaultValue="strategy" />
      </div>
    </div>
  );
}
