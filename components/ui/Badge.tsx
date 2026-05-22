import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "purple" | "teal" | "orange" | "outline";
  children: React.ReactNode;
}

export function Badge({
  variant = "outline",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    purple: "bg-brand-purple bg-opacity-20 text-brand-purple border border-brand-purple border-opacity-30",
    teal: "bg-brand-teal bg-opacity-20 text-brand-teal border border-brand-teal border-opacity-30",
    orange: "bg-brand-orange bg-opacity-20 text-brand-orange border border-brand-orange border-opacity-30",
    outline:
      "bg-transparent border border-brand-border text-brand-text-muted hover:border-brand-border-hover",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-label font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
