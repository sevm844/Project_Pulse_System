import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[#dfe8df] bg-white shadow-[0_1px_2px_rgba(31,42,36,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
