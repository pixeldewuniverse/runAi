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
  const baseStyles =
    "font-button rounded-md transition-all duration-200 flex items-center justify-center gap-2 font-semibold";

  const variants = {
    primary:
      "bg-brand-purple hover:bg-opacity-90 text-brand-white shadow-glow-purple hover:shadow-[0_0_50px_rgba(213,114,224,0.25)]",
    secondary:
      "bg-brand-teal hover:bg-opacity-90 text-brand-bg shadow-glow-teal hover:shadow-[0_0_50px_rgba(38,222,210,0.25)]",
    ghost:
      "bg-transparent border border-brand-border hover:border-brand-border-hover text-brand-white hover:bg-brand-surface",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-button",
    lg: "px-6 py-3 text-button h-[52px]",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
