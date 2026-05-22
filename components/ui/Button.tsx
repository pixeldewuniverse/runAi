import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "text-button rounded-md transition-all duration-200 inline-flex items-center justify-center gap-2 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-brand-purple text-white shadow-glow-purple hover:brightness-110 hover:shadow-[0_0_50px_rgba(213,114,224,0.3)]",
    secondary:
      "bg-brand-teal text-black shadow-glow-teal hover:brightness-110 hover:shadow-[0_0_50px_rgba(38,222,210,0.3)]",
    ghost:
      "bg-transparent border border-brand-border hover:border-brand-border-hover text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm min-h-[36px]",
    md: "px-4 py-2.5 min-h-[44px]",
    lg: "px-6 py-3 h-[52px]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
