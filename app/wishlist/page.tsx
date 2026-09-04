"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Product = { id: string; dbId: string; name: string; price: number; category: string; imageUrl: string | null; minimumOrder: number };
type CartItem = Product & { quantity: number };

function notifyStorageChange() { window.dispatchEvent(new Event("wedinvite-storage")); }

export default function WishlistPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    let saved: string[] = [];
    try { saved = JSON.parse(localStorage.getItem("wedinvite-wishlist") || "[]"); } catch { saved = []; }
    setIds(saved);
    if (saved.length === 0) { setLoading(false); return; }
    (async () => {
      const result = await supabase.from("products").select("id,name,slug,price,image_url,minimum_quantity,categories(name)").in("slug", saved);
      if (!result.error) setProducts((result.data ?? []).map((row) => ({ dbId: row.id, id: row.slug, name: row.name, price: Number(row.price), imageUrl: row.image_url, minimumOrder: Number(row.minimum_quantity || 100), category: (row.categories as unknown as {name:string}|null)?.name ?? "Wedding" })));
      setLoading(false);
    })();
  }, []);

  function remove(id: string) {
    const next = ids.filter((item) => item !== id); setIds(next); setProducts((rows) => rows.filter((row) => row.id !== id)); localStorage.setItem("wedinvite-wishlist", JSON.stringify(next)); notifyStorageChange();
  }

  function addToCart(product: Product) {
    let cart: CartItem[] = []; try { cart = JSON.parse(localStorage.getItem("wedinvite-cart") || "[]"); } catch { cart = []; }
    const existing = cart.find((item) => item.id === product.id); if (existing) existing.quantity += product.minimumOrder; else cart.push({ ...product, quantity: product.minimumOrder });
    localStorage.setItem("wedinvite-cart", JSON.stringify(cart)); notifyStorageChange(); setAdded(product.id); setTimeout(() => setAdded(null), 1200);
  }

  return <main className="min-h-screen bg-[#FFFDF9] text-[#2B2523]"><section className="mx-auto max-w-[1440px] px-5 py-10 md:px-8 lg:px-16 lg:py-16"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B2E3F]">Saved designs</p><h1 className="mt-2 text-4xl font-black tracking-tight">Your wishlist</h1><p className="mt-3 text-[#756B67]">Saved invitation slugs are matched against the live Supabase catalog.</p>
    {loading ? <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-80 animate-pulse rounded-3xl bg-[#F0E4DC]"/>)}</div> : products.length === 0 ? <div className="mt-10 rounded-3xl border border-[#E8DDD6] bg-white p-12 text-center"><div className="text-4xl">♡</div><h2 className="mt-4 text-xl font-black">No saved invitations</h2><p className="mt-2 text-sm text-[#756B67]">Save designs while browsing the catalog.</p><Link href="/products" className="mt-6 inline-flex rounded-xl bg-[#8B2E3F] px-6 py-3 text-sm font-extrabold text-white">Browse wedding cards</Link></div> : <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map(product=><article key={product.dbId} className="overflow-hidden rounded-3xl border border-[#E8DDD6] bg-white"><div className="relative aspect-[4/5] bg-[#F0E4DC]">{product.imageUrl?<img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-xs font-bold text-[#817672]">Product image</div>}<button onClick={()=>remove(product.id)} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl text-[#C94A4A] shadow">♥</button></div><div className="p-4"><p className="text-[10px] font-black uppercase tracking-wide text-[#8B2E3F]">{product.category}</p><Link href={`/products/${product.id}`} className="mt-1 block truncate font-black">{product.name}</Link><p className="mt-2 text-sm font-black">₹{product.price} / card</p><button onClick={()=>addToCart(product)} className="mt-3 min-h-10 w-full rounded-xl bg-[#8B2E3F] text-xs font-extrabold text-white">{added===product.id?"Added ✓":"Add to cart"}</button></div></article>)}</div>}
  </section></main>;
}
