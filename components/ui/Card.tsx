import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glass?: boolean;
  glow?: "purple" | "teal" | "orange" | null;
}

export function Card({
  className = "",
  children,
  glass = true,
  glow = null,
  ...props
}: CardProps) {
  const glassStyles = glass
    ? "bg-brand-surface backdrop-blur-glass border border-brand-border"
    : "";

  const glowMap = {
    purple: "shadow-glow-purple",
    teal: "shadow-glow-teal",
    orange: "shadow-glow-orange",
  };

  return (
    <div
      className={`rounded-md p-5 transition-all duration-300 ${glassStyles} ${glow ? glowMap[glow] : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
