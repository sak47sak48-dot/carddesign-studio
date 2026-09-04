"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Card, EmptyState, Notice, PageHeader } from "../../../components/admin/AdminUI";

type Product = { id: string; name: string; sku: string | null; stock_quantity: number; low_stock_threshold: number; track_inventory: boolean };
type Log = { id: string; product_id: string; change_quantity: number; quantity_before: number; quantity_after: number; reason: string; note: string | null; created_at: string; products: { name: string } | null };

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState("");
  const [productId, setProductId] = useState("");
  const [change, setChange] = useState("");
  const [reason, setReason] = useState("manual_adjustment");
  const [note, setNote] = useState("");

  async function load() {
    const [p, l] = await Promise.all([
      supabase.from("products").select("id,name,sku,stock_quantity,low_stock_threshold,track_inventory").is("deleted_at", null).order("name"),
      supabase.from("inventory_logs").select("id,product_id,change_quantity,quantity_before,quantity_after,reason,note,created_at,products(name)").order("created_at", { ascending: false }).limit(100),
    ]);
    if (p.error) setError(p.error.message); else setProducts((p.data ?? []) as Product[]);
    setLogs((l.data ?? []) as unknown as Log[]);
  }
  useEffect(() => { load(); }, []);

  const tracked = useMemo(() => products.filter((p) => p.track_inventory), [products]);
  const low = useMemo(() => tracked.filter((p) => p.stock_quantity <= p.low_stock_threshold), [tracked]);

  async function adjust() {
    setError("");
    const amount = Number(change);
    if (!productId || !Number.isInteger(amount) || amount === 0) { setError("Select a product and enter a non-zero whole-number stock change."); return; }
    const result = await supabase.rpc("admin_adjust_inventory", { p_product_id: productId, p_change: amount, p_reason: reason, p_note: note || null });
    if (result.error) setError(result.error.message); else { setChange(""); setNote(""); load(); }
  }

  return <div className="space-y-6">
    <PageHeader eyebrow="Operations" title="Inventory" description="Track low-stock products and make atomic stock adjustments with an immutable movement log." />
    {error && <Notice>{error}</Notice>}
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="p-5"><h2 className="font-black">Adjust stock</h2><div className="mt-4 space-y-3"><select className="min-h-11 w-full rounded-xl border border-[#DCCFC8] px-3 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Select product</option>{tracked.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock_quantity})</option>)}</select><input type="number" className="min-h-11 w-full rounded-xl border border-[#DCCFC8] px-3 text-sm" value={change} onChange={(e) => setChange(e.target.value)} placeholder="Change, e.g. 50 or -10" /><select className="min-h-11 w-full rounded-xl border border-[#DCCFC8] px-3 text-sm" value={reason} onChange={(e) => setReason(e.target.value)}><option value="manual_adjustment">Manual adjustment</option><option value="stock_received">Stock received</option><option value="damaged">Damaged</option><option value="correction">Correction</option></select><textarea className="min-h-24 w-full rounded-xl border border-[#DCCFC8] p-3 text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" /><button onClick={adjust} className="min-h-11 w-full rounded-xl bg-[#8B2E3F] text-sm font-extrabold text-white">Apply adjustment</button></div></Card>
        <Card className="p-5"><p className="text-xs font-black uppercase tracking-wider text-[#B3883A]">Low stock</p><p className="mt-2 text-3xl font-black">{low.length}</p><div className="mt-4 space-y-2">{low.slice(0, 8).map((p) => <div key={p.id} className="rounded-xl bg-red-50 p-3"><p className="text-sm font-bold">{p.name}</p><p className="text-xs text-red-700">{p.stock_quantity} remaining · threshold {p.low_stock_threshold}</p></div>)}</div></Card>
      </div>
      <Card className="overflow-hidden">{logs.length === 0 ? <EmptyState title="No inventory movements" description="Stock adjustments will be recorded here." /> : <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-[#FCF8F5] text-[11px] uppercase tracking-wide text-[#817672]"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Change</th><th className="px-4 py-3">Before</th><th className="px-4 py-3">After</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Date</th></tr></thead><tbody className="divide-y divide-[#F0E7E2]">{logs.map((log) => <tr key={log.id}><td className="px-4 py-4 font-bold">{log.products?.name ?? "Product"}</td><td className={`px-4 py-4 font-black ${log.change_quantity > 0 ? "text-emerald-700" : "text-red-700"}`}>{log.change_quantity > 0 ? "+" : ""}{log.change_quantity}</td><td className="px-4 py-4">{log.quantity_before}</td><td className="px-4 py-4">{log.quantity_after}</td><td className="px-4 py-4 capitalize">{log.reason.replaceAll("_", " ")}</td><td className="px-4 py-4 text-xs text-[#756B67]">{new Date(log.created_at).toLocaleString("en-IN")}</td></tr>)}</tbody></table></div>}</Card>
    </div>
  </div>;
}
