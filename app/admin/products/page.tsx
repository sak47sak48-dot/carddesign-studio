"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Card, EmptyState, Notice, PageHeader, StatusBadge } from "../../../components/admin/AdminUI";

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  track_inventory: boolean;
  status: string;
  is_active: boolean;
  is_featured: boolean;
  image_url: string | null;
  updated_at: string;
  categories: { name: string } | null;
};

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function AdminProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  async function load() {
    setLoading(true); setError("");
    const result = await supabase
      .from("products")
      .select("id,name,slug,sku,price,stock_quantity,track_inventory,status,is_active,is_featured,image_url,updated_at,categories(name)")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    if (result.error) setError(result.error.message);
    setRows((result.data ?? []) as unknown as Product[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((row) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || `${row.name} ${row.sku ?? ""} ${row.slug}`.toLowerCase().includes(q);
    const matchesStatus = status === "all" || row.status === status;
    return matchesSearch && matchesStatus;
  }), [rows, search, status]);

  async function toggleActive(row: Product) {
    const result = await supabase.from("products").update({ is_active: !row.is_active }).eq("id", row.id);
    if (result.error) setError(result.error.message); else load();
  }

  async function toggleFeatured(row: Product) {
    const result = await supabase.from("products").update({ is_featured: !row.is_featured }).eq("id", row.id);
    if (result.error) setError(result.error.message); else load();
  }

  async function duplicate(row: Product) {
    const source = await supabase.from("products").select("*").eq("id", row.id).single();
    if (source.error || !source.data) { setError(source.error?.message ?? "Unable to duplicate product."); return; }
    const { id, created_at, updated_at, deleted_at, ...data } = source.data;
    const suffix = Date.now().toString().slice(-5);
    const result = await supabase.from("products").insert({
      ...data,
      name: `${data.name} Copy`,
      slug: `${data.slug}-copy-${suffix}`,
      sku: `${data.sku ?? "COPY"}-${suffix}`,
      status: "draft",
      is_active: false,
      published_at: null,
    });
    if (result.error) setError(result.error.message); else load();
  }

  async function softDelete(row: Product) {
    if (!confirm(`Archive ${row.name}? Historical orders will remain intact.`)) return;
    const result = await supabase.from("products").update({ deleted_at: new Date().toISOString(), is_active: false, status: "archived" }).eq("id", row.id);
    if (result.error) setError(result.error.message); else load();
  }

  async function bulk(action: "publish" | "hide" | "archive") {
    if (!selected.length) return;
    if (action === "archive" && !confirm(`Archive ${selected.length} selected products?`)) return;
    const patch = action === "publish"
      ? { status: "published", is_active: true, published_at: new Date().toISOString() }
      : action === "hide"
      ? { is_active: false }
      : { deleted_at: new Date().toISOString(), is_active: false, status: "archived" };
    const result = await supabase.from("products").update(patch).in("id", selected);
    if (result.error) setError(result.error.message); else { setSelected([]); load(); }
  }

  function exportCsv() {
    const header = ["Name", "SKU", "Slug", "Category", "Price", "Stock", "Status", "Active", "Featured"];
    const body = filtered.map((row) => [row.name, row.sku ?? "", row.slug, row.categories?.name ?? "", row.price, row.stock_quantity, row.status, row.is_active, row.is_featured]);
    const csv = [header, ...body].map((record) => record.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "products.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Catalog" title="Products" description="Search, publish, feature, duplicate, edit and soft-delete invitation products." action={<Link href="/admin/products/new" className="inline-flex min-h-11 items-center rounded-xl bg-[#8B2E3F] px-5 text-sm font-extrabold text-white">+ Add product</Link>} />
      {error && <Notice>{error}</Notice>}

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, SKU or slug..." className="min-h-11 rounded-xl border border-[#DCCFC8] px-4 text-sm outline-none focus:border-[#8B2E3F]" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-11 rounded-xl border border-[#DCCFC8] px-3 text-sm"><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
          <button onClick={exportCsv} className="min-h-11 rounded-xl border border-[#DCCFC8] bg-white px-4 text-sm font-extrabold">Export CSV</button>
        </div>
        {selected.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#FCF5F1] p-3 text-xs"><span className="font-black">{selected.length} selected</span><button onClick={() => bulk("publish")} className="rounded-lg bg-white px-3 py-2 font-bold">Publish</button><button onClick={() => bulk("hide")} className="rounded-lg bg-white px-3 py-2 font-bold">Hide</button><button onClick={() => bulk("archive")} className="rounded-lg bg-red-50 px-3 py-2 font-bold text-red-700">Archive</button></div>}
      </Card>

      <Card className="overflow-hidden">
        {loading ? <div className="p-12 text-center text-sm text-[#756B67]">Loading products...</div> : filtered.length === 0 ? <EmptyState title="No products found" description="Create your first product or adjust the current search filters." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-[#FCF8F5] text-[11px] uppercase tracking-wide text-[#817672]"><tr><th className="px-4 py-3"><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={(e) => setSelected(e.target.checked ? filtered.map((row) => row.id) : [])} /></th><th className="px-4 py-3">Product</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Flags</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-[#F0E7E2]">
                {filtered.map((row) => <tr key={row.id} className="hover:bg-[#FFFDFC]"><td className="px-4 py-4"><input type="checkbox" checked={selected.includes(row.id)} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id))} /></td><td className="px-4 py-4"><div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded-lg bg-[#F0E4DC]">{row.image_url && <img src={row.image_url} alt="" className="h-full w-full object-cover" />}</div><div><p className="font-black">{row.name}</p><p className="mt-0.5 text-xs text-[#756B67]">/{row.slug}</p></div></div></td><td className="px-4 py-4 font-mono text-xs">{row.sku || "—"}</td><td className="px-4 py-4">{row.categories?.name ?? "—"}</td><td className="px-4 py-4 font-bold">{money.format(Number(row.price))}</td><td className="px-4 py-4"><span className={row.track_inventory && row.stock_quantity <= 10 ? "font-black text-red-700" : "font-bold"}>{row.track_inventory ? row.stock_quantity : "Not tracked"}</span></td><td className="px-4 py-4"><StatusBadge value={row.status} /></td><td className="px-4 py-4"><div className="flex gap-1">{row.is_active && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">Active</span>}{row.is_featured && <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">Featured</span>}</div></td><td className="px-4 py-4"><div className="flex justify-end gap-1"><Link href={`/admin/products/${row.id}`} className="rounded-lg border border-[#DCCFC8] px-2.5 py-1.5 text-xs font-bold">Edit</Link><button onClick={() => toggleActive(row)} className="rounded-lg border border-[#DCCFC8] px-2.5 py-1.5 text-xs font-bold">{row.is_active ? "Hide" : "Show"}</button><button onClick={() => toggleFeatured(row)} className="rounded-lg border border-[#DCCFC8] px-2.5 py-1.5 text-xs font-bold">★</button><button onClick={() => duplicate(row)} className="rounded-lg border border-[#DCCFC8] px-2.5 py-1.5 text-xs font-bold">Copy</button><button onClick={() => softDelete(row)} className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700">Archive</button></div></td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
