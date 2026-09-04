"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Card, EmptyState, Notice, PageHeader, StatusBadge } from "../../../components/admin/AdminUI";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_amount: number;
  payment_method: string | null;
  payment_status: string;
  order_status: string;
  tracking_number: string | null;
  courier_name: string | null;
  refund_status: string;
  created_at: string;
};

type OrderItem = { id: string; product_name: string; quantity: number; unit_price: number; line_total: number; bride_name: string | null; groom_name: string | null };
type History = { id: string; status: string; note: string | null; created_at: string };

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const statuses = ["placed", "confirmed", "designing", "proof_sent", "printing", "ready", "shipped", "delivered", "cancelled"];
const payments = ["pending", "paid", "failed", "refunded", "partially_refunded"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    const result = await supabase.from("orders").select("id,order_number,customer_name,customer_email,customer_phone,address,city,state,pincode,total_amount,payment_method,payment_status,order_status,tracking_number,courier_name,refund_status,created_at").order("created_at", { ascending: false });
    if (result.error) setError(result.error.message); else setOrders((result.data ?? []) as Order[]);
  }
  useEffect(() => { load(); }, []);

  async function open(order: Order) {
    setSelected(order); setError("");
    const [itemResult, historyResult, adminResult] = await Promise.all([
      supabase.from("order_items").select("id,product_name,quantity,unit_price,line_total,bride_name,groom_name").eq("order_id", order.id),
      supabase.from("order_status_history").select("id,status,note,created_at").eq("order_id", order.id).order("created_at"),
      supabase.from("order_admin").select("admin_notes").eq("order_id", order.id).maybeSingle(),
    ]);
    setItems((itemResult.data ?? []) as OrderItem[]);
    setHistory((historyResult.data ?? []) as History[]);
    setAdminNote(adminResult.data?.admin_notes ?? "");
  }

  async function updateField(field: "order_status" | "payment_status" | "refund_status", value: string) {
    if (!selected) return;
    if (field === "order_status") {
      const result = await supabase.rpc("admin_set_order_status", { p_order_id: selected.id, p_status: value, p_note: null });
      if (result.error) { setError(result.error.message); return; }
    } else {
      const result = await supabase.from("orders").update({ [field]: value }).eq("id", selected.id);
      if (result.error) { setError(result.error.message); return; }
    }
    const next = { ...selected, [field]: value } as Order;
    setSelected(next);
    await load();
    await open(next);
  }

  async function saveShipping() {
    if (!selected) return;
    const result = await supabase.from("orders").update({ tracking_number: selected.tracking_number || null, courier_name: selected.courier_name || null }).eq("id", selected.id);
    if (result.error) setError(result.error.message); else load();
  }

  async function saveNote() {
    if (!selected) return;
    const result = await supabase.from("order_admin").upsert({ order_id: selected.id, admin_notes: adminNote }, { onConflict: "order_id" });
    if (result.error) setError(result.error.message);
  }

  const filtered = useMemo(() => orders.filter((order) => {
    const q = search.toLowerCase().trim();
    return (!q || `${order.order_number} ${order.customer_name} ${order.customer_phone}`.toLowerCase().includes(q)) && (filter === "all" || order.order_status === filter);
  }), [orders, search, filter]);

  return <div className="space-y-6">
    <PageHeader eyebrow="Sales" title="Orders" description="Manage fulfilment, payment state, tracking, refunds, order timeline and private admin notes." />
    {error && <Notice>{error}</Notice>}
    <Card className="p-4"><div className="grid gap-3 md:grid-cols-[1fr_220px]"><input className="min-h-11 rounded-xl border border-[#DCCFC8] px-4 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, customer or phone..." /><select className="min-h-11 rounded-xl border border-[#DCCFC8] px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All order statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div></Card>
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.5fr)_500px]">
      <Card className="overflow-hidden">{filtered.length === 0 ? <EmptyState title="No orders found" description="Customer orders will appear here after checkout writes to Supabase." /> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#FCF8F5] text-[11px] uppercase tracking-wide text-[#817672]"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Fulfilment</th><th className="px-4 py-3">Date</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-[#F0E7E2]">{filtered.map((order) => <tr key={order.id}><td className="px-4 py-4 font-black text-[#8B2E3F]">{order.order_number}</td><td className="px-4 py-4"><p className="font-bold">{order.customer_name}</p><p className="text-xs text-[#756B67]">{order.customer_phone}</p></td><td className="px-4 py-4 font-bold">{money.format(Number(order.total_amount))}</td><td className="px-4 py-4"><StatusBadge value={order.payment_status} /></td><td className="px-4 py-4"><StatusBadge value={order.order_status} /></td><td className="px-4 py-4 text-xs text-[#756B67]">{new Date(order.created_at).toLocaleString("en-IN")}</td><td className="px-4 py-4 text-right"><button onClick={() => open(order)} className="rounded-lg border border-[#DCCFC8] px-3 py-2 text-xs font-extrabold">View</button></td></tr>)}</tbody></table></div>}</Card>

      <Card className="overflow-hidden 2xl:sticky 2xl:top-8 2xl:self-start">{!selected ? <EmptyState title="Select an order" description="Choose an order to view its items, customer address, timeline and controls." /> : <div>
        <div className="border-b border-[#EEE4DE] p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-[#B3883A]">Order detail</p><h2 className="mt-1 text-xl font-black">{selected.order_number}</h2></div><button onClick={() => setSelected(null)} className="text-xl">×</button></div><p className="mt-2 text-sm font-bold">{selected.customer_name} · {selected.customer_phone}</p><p className="mt-1 text-xs leading-5 text-[#756B67]">{selected.address}, {selected.city}, {selected.state} {selected.pincode}</p></div>
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-extrabold">Order status<select value={selected.order_status} onChange={(e) => updateField("order_status", e.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#DCCFC8] px-2">{statuses.map((s) => <option key={s}>{s}</option>)}</select></label><label className="text-xs font-extrabold">Payment<select value={selected.payment_status} onChange={(e) => updateField("payment_status", e.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#DCCFC8] px-2">{payments.map((s) => <option key={s}>{s}</option>)}</select></label></div>
          <div><p className="text-xs font-black uppercase tracking-wider text-[#817672]">Items</p><div className="mt-2 space-y-2">{items.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-[#FCF8F5] p-3 text-sm"><div><p className="font-bold">{item.product_name}</p><p className="text-xs text-[#756B67]">Qty {item.quantity}{item.bride_name || item.groom_name ? ` · ${item.bride_name ?? ""} & ${item.groom_name ?? ""}` : ""}</p></div><p className="font-black">{money.format(Number(item.line_total))}</p></div>)}</div></div>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-extrabold">Courier<input className="mt-1.5 min-h-10 w-full rounded-lg border border-[#DCCFC8] px-2" value={selected.courier_name ?? ""} onChange={(e) => setSelected({ ...selected, courier_name: e.target.value })} /></label><label className="text-xs font-extrabold">Tracking no.<input className="mt-1.5 min-h-10 w-full rounded-lg border border-[#DCCFC8] px-2" value={selected.tracking_number ?? ""} onChange={(e) => setSelected({ ...selected, tracking_number: e.target.value })} /></label></div><button onClick={saveShipping} className="w-full rounded-lg border border-[#8B2E3F] py-2 text-xs font-extrabold text-[#8B2E3F]">Save shipping</button>
          <label className="block text-xs font-extrabold">Refund status<select value={selected.refund_status} onChange={(e) => updateField("refund_status", e.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#DCCFC8] px-2"><option>none</option><option>requested</option><option>processing</option><option>partial</option><option>refunded</option><option>rejected</option></select></label>
          <label className="block text-xs font-extrabold">Private admin note<textarea className="mt-1.5 min-h-24 w-full rounded-lg border border-[#DCCFC8] p-3 text-sm" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} /></label><button onClick={saveNote} className="w-full rounded-lg bg-[#8B2E3F] py-2.5 text-xs font-extrabold text-white">Save admin note</button>
          <div><p className="text-xs font-black uppercase tracking-wider text-[#817672]">Timeline</p><div className="mt-3 space-y-3">{history.length === 0 ? <p className="text-xs text-[#756B67]">No status history recorded yet.</p> : history.map((row) => <div key={row.id} className="border-l-2 border-[#D7B98E] pl-3"><p className="text-sm font-bold capitalize">{row.status.replaceAll("_", " ")}</p><p className="text-[11px] text-[#817672]">{new Date(row.created_at).toLocaleString("en-IN")}</p>{row.note && <p className="mt-1 text-xs text-[#756B67]">{row.note}</p>}</div>)}</div></div>
        </div>
      </div>}</Card>
    </div>
  </div>;
}
