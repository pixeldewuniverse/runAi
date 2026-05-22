import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full bg-brand-surface border border-brand-border rounded-md px-3 py-2 text-brand-white placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 focus:ring-offset-brand-bg transition-all resize-none ${className}`}
      {...props}
    />
  );
}
