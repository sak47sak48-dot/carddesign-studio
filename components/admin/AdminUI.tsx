"use client";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B3883A]">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#2B2523] sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-[#756B67]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#E7DAD3] bg-white shadow-sm ${className}`}>{children}</section>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5EBE6] text-xl text-[#8B2E3F]">◇</div>
      <h3 className="mt-4 font-black text-[#2B2523]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#756B67]">{description}</p>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const positive = ["active", "paid", "delivered", "approved", "published", "confirmed", "completed", "in_stock"].includes(normalized);
  const negative = ["cancelled", "failed", "rejected", "inactive", "out_of_stock"].includes(normalized);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold capitalize ${positive ? "bg-emerald-50 text-emerald-700" : negative ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function Notice({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : kind === "info" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-red-200 bg-red-50 text-red-800";
  return <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${styles}`}>{children}</div>;
}
