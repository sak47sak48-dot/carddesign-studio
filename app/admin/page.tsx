"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card, EmptyState, Notice, PageHeader, StatusBadge } from "../../components/admin/AdminUI";

type Stats = {
  products: number;
  orders: number;
  customers: number;
  revenue: number;
  lowStock: number;
  pendingCustomizations: number;
};

type RecentOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  created_at: string;
};

type TopProduct = { product_name: string; quantity: number; revenue: number };

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, customers: 0, revenue: 0, lowStock: 0, pendingCustomizations: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const [products, orders, customers, paidOrders, recent, lowStock, customizations, items] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
        supabase.from("orders").select("id,order_number,customer_name,total_amount,order_status,payment_status,created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("products").select("*", { count: "exact", head: true }).lte("stock_quantity", 10).eq("track_inventory", true).is("deleted_at", null),
        supabase.from("customization_requests").select("*", { count: "exact", head: true }).in("status", ["new", "in_review"]),
        supabase.from("order_items").select("product_name,quantity,line_total"),
      ]);

      const firstError = [products.error, orders.error, customers.error, paidOrders.error, recent.error].find(Boolean);
      if (firstError) setError(firstError.message);

      const aggregate = new Map<string, TopProduct>();
      for (const row of items.data ?? []) {
        const current = aggregate.get(row.product_name) ?? { product_name: row.product_name, quantity: 0, revenue: 0 };
        current.quantity += Number(row.quantity || 0);
        current.revenue += Number(row.line_total || 0);
        aggregate.set(row.product_name, current);
      }

      setStats({
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        customers: customers.count ?? 0,
        revenue: (paidOrders.data ?? []).reduce((sum, row) => sum + Number(row.total_amount || 0), 0),
        lowStock: lowStock.count ?? 0,
        pendingCustomizations: customizations.count ?? 0,
      });
      setRecentOrders((recent.data ?? []) as RecentOrder[]);
      setTopProducts([...aggregate.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5));
      setLoading(false);
    }

    load();
  }, []);

  const maxTop = useMemo(() => Math.max(...topProducts.map((item) => item.quantity), 1), [topProducts]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Business dashboard"
        description="Live operational data from Supabase. Revenue counts only orders marked as paid."
        action={<Link href="/admin/products/new" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#8B2E3F] px-5 text-sm font-extrabold text-white hover:bg-[#742536]">+ Add product</Link>}
      />

      {error && <Notice>{error}. If this is your first run, apply the included Supabase migration first.</Notice>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        {[
          ["Products", stats.products, "Catalog"],
          ["Orders", stats.orders, "All time"],
          ["Customers", stats.customers, "Profiles"],
          ["Paid revenue", money.format(stats.revenue), "Collected"],
          ["Low stock", stats.lowStock, "≤ 10 units"],
          ["Customizations", stats.pendingCustomizations, "Need action"],
        ].map(([label, value, helper]) => (
          <Card key={label as string} className="p-4 sm:p-5">
            <p className="text-xs font-bold text-[#756B67]">{label}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-[#2B2523]">{loading ? "—" : value}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#A09691]">{helper}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.8fr)]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#EEE4DE] px-5 py-4">
            <div><h2 className="font-black">Recent orders</h2><p className="text-xs text-[#756B67]">Newest checkout activity</p></div>
            <Link href="/admin/orders" className="text-xs font-extrabold text-[#8B2E3F]">View all →</Link>
          </div>
          {recentOrders.length === 0 ? <EmptyState title="No orders yet" description="Orders created by the production checkout will appear here." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#FCF8F5] text-[11px] uppercase tracking-wide text-[#817672]"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th></tr></thead>
                <tbody className="divide-y divide-[#F0E7E2]">
                  {recentOrders.map((order) => <tr key={order.id} className="hover:bg-[#FFFDFC]"><td className="px-5 py-4 font-extrabold text-[#8B2E3F]">{order.order_number}</td><td className="px-5 py-4 font-semibold">{order.customer_name}</td><td className="px-5 py-4">{money.format(Number(order.total_amount))}</td><td className="px-5 py-4"><StatusBadge value={order.payment_status} /></td><td className="px-5 py-4"><StatusBadge value={order.order_status} /></td><td className="px-5 py-4 text-[#756B67]">{new Date(order.created_at).toLocaleDateString("en-IN")}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-black">Top sellers</h2><p className="text-xs text-[#756B67]">By quantity sold</p></div><Link href="/admin/products" className="text-xs font-extrabold text-[#8B2E3F]">Catalog →</Link></div>
          <div className="mt-5 space-y-5">
            {topProducts.length === 0 ? <p className="rounded-xl bg-[#FCF8F5] p-4 text-sm text-[#756B67]">Sales data will appear after order items are recorded.</p> : topProducts.map((item, index) => (
              <div key={item.product_name}>
                <div className="flex items-center justify-between gap-3 text-sm"><p className="truncate font-bold">{index + 1}. {item.product_name}</p><p className="shrink-0 text-xs font-bold text-[#756B67]">{item.quantity} sold</p></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F1E5DF]"><div className="h-full rounded-full bg-[#8B2E3F]" style={{ width: `${Math.max(8, (item.quantity / maxTop) * 100)}%` }} /></div>
                <p className="mt-1 text-[11px] text-[#A09691]">{money.format(item.revenue)} item value</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Add invitation card", "/admin/products/new", "Create product, pricing, stock and images"],
          ["Review orders", "/admin/orders", "Update fulfilment and payment status"],
          ["Manage homepage", "/admin/banners", "Publish promotional banners"],
          ["Check customizations", "/admin/customization-requests", "Review customer design requests"],
        ].map(([title, href, description]) => <Link key={href} href={href} className="rounded-2xl border border-[#E7DAD3] bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-[#CDB7AB]"><p className="font-black">{title}</p><p className="mt-2 text-sm leading-6 text-[#756B67]">{description}</p><p className="mt-4 text-xs font-extrabold text-[#8B2E3F]">Open →</p></Link>)}
      </div>
    </div>
  );
}
