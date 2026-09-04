"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Product = { id: string; name: string; slug: string; price: number; image_url: string | null };
type Customization = { productId: string; productName: string; brideName: string; groomName: string; weddingDate: string; weddingTime: string; venue: string; language: string; religion: string; message: string };
const field = "mt-1.5 min-h-11 w-full rounded-xl border border-[#DCCFC8] bg-white px-3 text-sm outline-none focus:border-[#8B2E3F] focus:ring-2 focus:ring-[#8B2E3F]/10";

export default function CustomizePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productSlug, setProductSlug] = useState("");
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [form, setForm] = useState({ brideName: "", groomName: "", weddingDate: "", weddingTime: "", venue: "", language: "English", religion: "", message: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("product") || "";
    try {
      const customer = JSON.parse(localStorage.getItem("wedinvite-customer") || "null");
      if (customer) setContact({ name: customer.fullName || "", phone: customer.phone || "", email: customer.email || "" });
    } catch {}
    (async () => {
      const result = await supabase.from("products").select("id,name,slug,price,image_url").order("is_featured", { ascending: false }).order("name");
      if (result.error) { setError(result.error.message); return; }
      const rows = (result.data ?? []) as Product[];
      setProducts(rows);
      setProductSlug(rows.some((row) => row.slug === requested) ? requested : rows[0]?.slug ?? "");
      if (requested) {
        try {
          const saved = JSON.parse(localStorage.getItem("wedinvite-customization") || "null") as Customization | null;
          if (saved?.productId === requested) setForm({ brideName: saved.brideName, groomName: saved.groomName, weddingDate: saved.weddingDate, weddingTime: saved.weddingTime, venue: saved.venue, language: saved.language, religion: saved.religion, message: saved.message });
        } catch {}
      }
    })();
  }, []);

  const product = useMemo(() => products.find((row) => row.slug === productSlug) ?? null, [products, productSlug]);

  function localPayload(): Customization | null {
    if (!product) return null;
    return { productId: product.slug, productName: product.name, ...form };
  }

  function saveLocally() {
    setError(""); setSuccess("");
    if (!product || !form.brideName.trim() || !form.groomName.trim() || !form.weddingDate || !form.venue.trim()) { setError("Choose a product and complete bride, groom, wedding date and venue."); return; }
    const payload = localPayload(); if (!payload) return;
    localStorage.setItem("wedinvite-customization", JSON.stringify(payload));
    setSuccess("Customization saved to this device. It will be attached when you add this product to cart.");
    window.dispatchEvent(new Event("wedinvite-storage"));
  }

  async function submitRequest(e: FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");
    if (!product || !form.brideName.trim() || !form.groomName.trim() || !form.weddingDate || !form.venue.trim()) { setError("Complete the required invitation details first."); return; }
    const phone = contact.phone.replace(/\D/g, "");
    if (!contact.name.trim() || !/^[6-9]\d{9}$/.test(phone)) { setError("Enter your name and a valid 10-digit Indian mobile number before submitting."); return; }
    setSubmitting(true);
    const result = await supabase.rpc("submit_customization_request", { p_product_slug: product.slug, p_customer: { name: contact.name.trim(), phone, email: contact.email.trim() }, p_payload: form });
    setSubmitting(false);
    if (result.error) { setError(result.error.message); return; }
    const payload = localPayload(); if (payload) localStorage.setItem("wedinvite-customization", JSON.stringify(payload));
    const response = result.data as { request_number?: string };
    setSuccess(`Customization request ${response.request_number ?? ""} submitted. The admin dashboard can now review it.`);
  }

  return <main className="min-h-screen bg-[#FFFDF9] text-[#2B2523]"><section className="mx-auto max-w-[1300px] px-5 py-10 md:px-8 lg:px-12 lg:py-16">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B2E3F]">Personalize your invitation</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Wedding card customization</h1><p className="mt-3 max-w-2xl leading-7 text-[#756B67]">Choose a published product, enter the event details, preview the content, save it to your cart, or submit it directly to the design team.</p>
    {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}{success && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{success}</div>}
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
      <form onSubmit={submitRequest} className="space-y-6 rounded-3xl border border-[#E8DDD6] bg-white p-5 sm:p-6">
        <div><h2 className="text-lg font-black">Invitation details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-extrabold sm:col-span-2">Invitation design<select className={field} value={productSlug} onChange={(e) => setProductSlug(e.target.value)}><option value="">Choose a product</option>{products.map((row) => <option key={row.id} value={row.slug}>{row.name} · ₹{row.price}/card</option>)}</select></label>
          <label className="text-xs font-extrabold">Bride name<input className={field} value={form.brideName} onChange={(e) => setForm((p) => ({ ...p, brideName: e.target.value }))} /></label>
          <label className="text-xs font-extrabold">Groom name<input className={field} value={form.groomName} onChange={(e) => setForm((p) => ({ ...p, groomName: e.target.value }))} /></label>
          <label className="text-xs font-extrabold">Wedding date<input type="date" className={field} value={form.weddingDate} onChange={(e) => setForm((p) => ({ ...p, weddingDate: e.target.value }))} /></label>
          <label className="text-xs font-extrabold">Wedding time<input type="time" className={field} value={form.weddingTime} onChange={(e) => setForm((p) => ({ ...p, weddingTime: e.target.value }))} /></label>
          <label className="text-xs font-extrabold sm:col-span-2">Venue<input className={field} value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} /></label>
          <label className="text-xs font-extrabold">Language<input className={field} value={form.language} onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))} /></label>
          <label className="text-xs font-extrabold">Religion / tradition<input className={field} value={form.religion} onChange={(e) => setForm((p) => ({ ...p, religion: e.target.value }))} /></label>
          <label className="text-xs font-extrabold sm:col-span-2">Invitation message<textarea className={`${field} min-h-28 py-3`} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} /></label>
        </div></div>
        <div className="border-t border-[#EEE4DE] pt-5"><h2 className="font-black">Your contact details</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-extrabold">Name<input className={field} value={contact.name} onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))} /></label><label className="text-xs font-extrabold">Mobile<input className={field} inputMode="numeric" value={contact.phone} onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))} /></label><label className="text-xs font-extrabold sm:col-span-2">Email (optional)<input type="email" className={field} value={contact.email} onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))} /></label></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={saveLocally} className="min-h-12 rounded-xl border border-[#8B2E3F] text-sm font-extrabold text-[#8B2E3F]">Save for cart</button><button disabled={submitting} className="min-h-12 rounded-xl bg-[#8B2E3F] text-sm font-extrabold text-white disabled:opacity-60">{submitting ? "Submitting..." : "Submit to design team"}</button></div>
      </form>
      <aside className="h-fit rounded-3xl border border-[#E8DDD6] bg-[#F7ECE6] p-5 lg:sticky lg:top-24"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B2E3F]">Live content preview</p><div className="mt-4 min-h-[560px] rounded-[28px] border border-[#DCCFC8] bg-[#FFFDF9] p-7 text-center shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B3883A]">Wedding Invitation</p><h2 className="mt-16 text-3xl font-black text-[#8B2E3F]">{form.brideName || "Bride"}</h2><p className="my-2 text-sm font-bold text-[#B3883A]">&</p><h2 className="text-3xl font-black text-[#8B2E3F]">{form.groomName || "Groom"}</h2><p className="mx-auto mt-10 max-w-xs text-sm leading-7 text-[#756B67]">{form.message || "Together with their families, request the pleasure of your company on their special day."}</p><div className="mt-10 border-t border-[#E8DDD6] pt-6"><p className="font-black">{form.weddingDate ? new Date(`${form.weddingDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Wedding date"}</p><p className="mt-2 text-sm text-[#756B67]">{form.weddingTime || "Wedding time"}</p><p className="mt-3 text-sm font-bold">{form.venue || "Wedding venue"}</p></div></div>{product && <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-3 text-sm"><div><p className="font-black">{product.name}</p><p className="text-xs text-[#756B67]">Selected design</p></div><Link href={`/products/${product.slug}`} className="font-extrabold text-[#8B2E3F]">View →</Link></div>}</aside>
    </div>
  </section></main>;
}
