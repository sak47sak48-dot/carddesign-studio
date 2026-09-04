"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card, EmptyState, Notice, PageHeader, StatusBadge } from "./AdminUI";

type Row = Record<string, unknown> & { id: string; status: string; created_at: string };

type Column = { key: string; label: string; render?: (row: Row) => React.ReactNode };

export default function StatusTablePage({
  eyebrow,
  title,
  description,
  table,
  select,
  statuses,
  columns,
}: {
  eyebrow: string;
  title: string;
  description: string;
  table: string;
  select: string;
  statuses: string[];
  columns: Column[];
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    const result = await supabase.from(table).select(select).order("created_at", { ascending: false });
    if (result.error) setError(result.error.message); else setRows((result.data ?? []) as unknown as Row[]);
  }
  useEffect(() => { load(); }, [table, select]);

  const filtered = useMemo(() => rows.filter((row) => {
    const matchesStatus = filter === "all" || row.status === filter;
    const matchesSearch = !search.trim() || JSON.stringify(row).toLowerCase().includes(search.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  }), [rows, search, filter]);

  async function updateStatus(id: string, status: string) {
    const result = await supabase.from(table).update({ status }).eq("id", id);
    if (result.error) setError(result.error.message); else load();
  }

  return <div className="space-y-6">
    <PageHeader eyebrow={eyebrow} title={title} description={description} />
    {error && <Notice>{error}</Notice>}
    <Card className="p-4"><div className="grid gap-3 md:grid-cols-[1fr_220px]"><input className="min-h-11 rounded-xl border border-[#DCCFC8] px-4 text-sm" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} /><select className="min-h-11 rounded-xl border border-[#DCCFC8] px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></div></Card>
    <Card className="overflow-hidden">{filtered.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} found`} description="New records will appear here automatically." /> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#FCF8F5] text-[11px] uppercase tracking-wide text-[#817672]"><tr>{columns.map((column) => <th key={column.key} className="px-4 py-3">{column.label}</th>)}<th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr></thead><tbody className="divide-y divide-[#F0E7E2]">{filtered.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.key} className="px-4 py-4">{column.render ? column.render(row) : String(row[column.key] ?? "—")}</td>)}<td className="px-4 py-4"><div className="flex items-center gap-2"><StatusBadge value={row.status} /><select value={row.status} onChange={(e) => updateStatus(row.id, e.target.value)} className="min-h-9 rounded-lg border border-[#DCCFC8] px-2 text-xs">{statuses.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></div></td><td className="px-4 py-4 text-xs text-[#756B67]">{new Date(row.created_at).toLocaleString("en-IN")}</td></tr>)}</tbody></table></div>}</Card>
  </div>;
}
