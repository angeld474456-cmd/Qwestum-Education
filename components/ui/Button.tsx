type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export default function Button({
  children,
  variant = "primary",
}: ButtonProps) {
  if (variant === "secondary") {
    return (
      <button className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-medium backdrop-blur transition hover:border-violet-500 hover:bg-white/10">
        {children}
      </button>
    );
  }

  return (
    <button className="rounded-2xl bg-violet-600 px-8 py-4 text-lg font-semibold transition duration-300 hover:scale-105 hover:bg-violet-500">
      {children}
    </button>
  );
}