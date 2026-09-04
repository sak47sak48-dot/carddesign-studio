"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Customization = {
  productId: string;
  productName: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  weddingTime: string;
  venue: string;
  language: string;
  religion: string;
  message: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  customization?: Customization;
};

type Customer = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
  instructions: string;
};

type PaymentMethod = "cod" | "upi" | "payment_link";

type OrderResult = {
  id: string;
  order_number: string;
  access_token: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_status: string;
  order_status: string;
};

function notifyStorageChange() {
  window.dispatchEvent(new Event("wedinvite-storage"));
}

export default function PaymentPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [loaded, setLoaded] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem("wedinvite-cart") || "[]")); } catch { setCart([]); }
    try { setCustomer(JSON.parse(localStorage.getItem("wedinvite-customer") || "null")); } catch { setCustomer(null); }
    setLoaded(true);
  }, []);

  const clientEstimate = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0), [cart]);

  async function placeOrder() {
    if (!customer || cart.length === 0 || placingOrder) return;
    setPlacingOrder(true);
    setError("");

    const { data, error: rpcError } = await supabase.rpc("create_checkout_order", {
      p_customer: customer,
      p_items: cart.map((item) => ({ id: item.id, quantity: item.quantity, customization: item.customization ?? {} })),
      p_payment_method: paymentMethod,
    });

    if (rpcError) {
      setError(rpcError.message);
      setPlacingOrder(false);
      return;
    }

    const order = data as OrderResult;
    const savedOrder = {
      id: order.order_number,
      databaseId: order.id,
      accessToken: order.access_token,
      customer,
      paymentMethod,
      summary: { subtotal: Number(order.subtotal), delivery: Number(order.delivery_fee), total: Number(order.total_amount) },
      items: cart,
      status: order.order_status,
      paymentStatus: order.payment_status,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("wedinvite-last-order", JSON.stringify(savedOrder));
    const existing = (() => { try { return JSON.parse(localStorage.getItem("wedinvite-orders") || "[]"); } catch { return []; } })();
    localStorage.setItem("wedinvite-orders", JSON.stringify([savedOrder, ...existing].slice(0, 20)));
    localStorage.removeItem("wedinvite-cart");
    localStorage.removeItem("wedinvite-order-summary");
    notifyStorageChange();
    window.location.href = "/order-success";
  }

  if (!loaded) return <main className="min-h-screen bg-[#FFFDF9]" />;

  if (!customer || cart.length === 0) {
    return <main className="min-h-screen bg-[#FFFDF9]"><section className="mx-auto max-w-2xl px-5 py-20 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F8ECEE] text-2xl">!</div><h1 className="mt-5 text-3xl font-black">Checkout information missing</h1><p className="mt-3 text-[#756B67]">Return to checkout and confirm your delivery details before placing the order.</p><Link href="/checkout" className="mt-6 inline-flex rounded-xl bg-[#8B2E3F] px-6 py-3 text-sm font-extrabold text-white">Return to checkout</Link></section></main>;
  }

  return <main className="min-h-screen bg-[#FFFDF9] text-[#2B2523]">
    <section className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 lg:px-12 lg:py-16">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B2E3F]">Secure checkout</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Choose payment method</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[#756B67]">Your final amount is recalculated inside Supabase from current product prices. The browser total is never trusted.</p>

      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          {[
            ["cod", "Cash on Delivery", "Place the order now. Payment stays pending until your team confirms collection."],
            ["upi", "UPI / QR confirmation", "Create a pending order. Your team can share the verified business UPI/QR through WhatsApp."],
            ["payment_link", "Secure payment link", "Create a pending order and send the customer a gateway-hosted payment link later."],
          ].map(([value, title, description]) => <button key={value} onClick={() => setPaymentMethod(value as PaymentMethod)} className={`w-full rounded-2xl border p-5 text-left ${paymentMethod === value ? "border-[#8B2E3F] bg-[#FFF7F8] ring-2 ring-[#8B2E3F]/10" : "border-[#E7DAD3] bg-white"}`}><div className="flex items-start gap-3"><span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${paymentMethod === value ? "border-[#8B2E3F]" : "border-[#BDAEA7]"}`}>{paymentMethod === value && <span className="h-2.5 w-2.5 rounded-full bg-[#8B2E3F]" />}</span><div><p className="font-black">{title}</p><p className="mt-1 text-sm leading-6 text-[#756B67]">{description}</p></div></div></button>)}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Payment safety:</strong> card number and CVV fields were removed. Real card/UPI payment collection should happen only inside a PCI-compliant payment gateway such as Razorpay/Stripe after gateway credentials are configured.</div>
        </div>

        <aside className="h-fit rounded-2xl border border-[#E7DAD3] bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-lg font-black">Order summary</h2>
          <div className="mt-4 space-y-3 border-b border-[#EEE4DE] pb-4">{cart.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 text-sm"><div><p className="font-bold">{item.name}</p><p className="text-xs text-[#756B67]">{item.quantity} cards</p></div><p className="font-black">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p></div>)}</div>
          <div className="mt-4 flex items-center justify-between"><span className="text-sm font-bold text-[#756B67]">Browser estimate</span><span className="text-xl font-black">₹{clientEstimate.toLocaleString("en-IN")}</span></div>
          <p className="mt-2 text-[11px] leading-5 text-[#817672]">Delivery fee and final total are validated by the server-side checkout function.</p>
          <button disabled={placingOrder} onClick={placeOrder} className="mt-5 min-h-12 w-full rounded-xl bg-[#8B2E3F] px-4 text-sm font-extrabold text-white disabled:opacity-60">{placingOrder ? "Creating secure order..." : "Place order"}</button>
          <Link href="/checkout" className="mt-2 flex min-h-11 items-center justify-center rounded-xl border border-[#DCCFC8] text-sm font-bold">Back to delivery details</Link>
        </aside>
      </div>
    </section>
  </main>;
}
