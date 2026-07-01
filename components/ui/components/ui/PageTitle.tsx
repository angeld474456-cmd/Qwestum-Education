type PageTitleProps = {
  title: string;
  subtitle?: string;
};

export default function PageTitle({
  title,
  subtitle,
}: PageTitleProps) {
  return (
    <div>
      <h1 className="text-4xl font-black text-white">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-2 text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}