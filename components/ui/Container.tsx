import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Container({ className = "", children, ...props }: ContainerProps) {
  return (
    <div
      className={`mx-auto max-w-[1440px] px-5 md:px-10 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
