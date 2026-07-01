import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-3xl
        border
        border-slate-800
        bg-[#111827]
        shadow-xl
        p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}