"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Product = {
  dbId: string;
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string | null;
  minimumOrder: number;
  isFeatured: boolean;
};

type CartItem = Product & { quantity: number; customization?: Record<string, unknown> };
type SortOption = "recommended" | "low-high" | "high-low";

function notifyStorageChange() { window.dispatchEvent(new Event("wedinvite-storage")); }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState(500);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [addedProduct, setAddedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryFromUrl = params.get("category");
    if (categoryFromUrl) setSelectedCategory(categoryFromUrl);
    try { setWishlist(JSON.parse(localStorage.getItem("wedinvite-wishlist") || "[]")); } catch { setWishlist([]); }

    (async () => {
      setLoading(true);
      const [productResult, categoryResult] = await Promise.all([
        supabase.from("products").select("id,name,slug,price,minimum_quantity,image_url,is_featured,categories(name)").order("is_featured", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("categories").select("name").eq("is_active", true).order("sort_order").order("name"),
      ]);
      if (productResult.error) setError(productResult.error.message);
      else setProducts((productResult.data ?? []).map((row) => ({
        dbId: row.id,
        id: row.slug,
        name: row.name,
        price: Number(row.price),
        category: (row.categories as unknown as { name: string } | null)?.name ?? "Other",
        imageUrl: row.image_url,
        minimumOrder: Number(row.minimum_quantity || 100),
        isFeatured: Boolean(row.is_featured),
      })));
      if (!categoryResult.error) setCategories(["All", ...(categoryResult.data ?? []).map((row) => row.name)]);
      setLoading(false);
    })();
  }, []);

  function updateCategory(category: string) {
    setSelectedCategory(category);
    const url = new URL(window.location.href);
    if (category === "All") url.searchParams.delete("category"); else url.searchParams.set("category", category);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  function toggleWishlist(productId: string) {
    const updated = wishlist.includes(productId) ? wishlist.filter((id) => id !== productId) : [...wishlist, productId];
    setWishlist(updated); localStorage.setItem("wedinvite-wishlist", JSON.stringify(updated)); notifyStorageChange();
  }

  function addToCart(product: Product) {
    let cart: CartItem[] = [];
    try { cart = JSON.parse(localStorage.getItem("wedinvite-cart") || "[]"); } catch { cart = []; }
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += product.minimumOrder; else cart.push({ ...product, quantity: product.minimumOrder });
    localStorage.setItem("wedinvite-cart", JSON.stringify(cart)); notifyStorageChange();
    setAddedProduct(product.id); window.setTimeout(() => setAddedProduct(null), 1300);
  }

  const visible = useMemo(() => {
    let rows = products.filter((product) => (selectedCategory === "All" || product.category === selectedCategory) && product.price <= maxPrice && product.name.toLowerCase().includes(search.trim().toLowerCase()));
    if (sortBy === "low-high") rows = [...rows].sort((a, b) => a.price - b.price);
    if (sortBy === "high-low") rows = [...rows].sort((a, b) => b.price - a.price);
    return rows;
  }, [products, selectedCategory, maxPrice, search, sortBy]);

  return (
    <main className="min-h-screen bg-[#FFFDF9] text-[#2B2523]">
      <section className="border-b border-[#EEE6E0] bg-[#F8F0EB]">
        <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-8 lg:px-16 lg:py-16">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B2E3F]">Wedding invitation catalog</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">Find the card that feels like your celebration.</h1>
          <p className="mt-4 max-w-2xl leading-7 text-[#756B67]">Browse published designs managed directly from the carddesign.studio admin dashboard.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 lg:px-16 lg:py-12">
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load the live catalog: {error}</div>}
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-[#E8DDD6] bg-white p-5 lg:sticky lg:top-24">
            <h2 className="font-black">Filters</h2>
            <label className="mt-5 block text-xs font-extrabold">Search<input value={search} onChange={(e) => setSearch(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#DDD0C9] px-3 text-sm" placeholder="Search cards..." /></label>
            <div className="mt-5"><p className="text-xs font-extrabold">Category</p><div className="mt-2 grid gap-1">{categories.map((category) => <button key={category} onClick={() => updateCategory(category)} className={`rounded-xl px-3 py-2 text-left text-sm font-bold ${selectedCategory === category ? "bg-[#8B2E3F] text-white" : "hover:bg-[#F7EFEB]"}`}>{category}</button>)}</div></div>
            <label className="mt-5 block text-xs font-extrabold">Maximum price: ₹{maxPrice}<input type="range" min="100" max="500" step="10" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="mt-3 w-full" /></label>
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold text-[#756B67]">{loading ? "Loading products..." : `${visible.length} products`}</p><select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="min-h-11 rounded-xl border border-[#DDD0C9] bg-white px-3 text-sm font-bold"><option value="recommended">Recommended</option><option value="low-high">Price: low to high</option><option value="high-low">Price: high to low</option></select></div>
            {loading ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{Array.from({length:8}).map((_,i)=><div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-[#E8DDD6] bg-white"><div className="aspect-[4/5] bg-[#F0E4DC]"/><div className="space-y-3 p-4"><div className="h-4 rounded bg-[#F0E4DC]"/><div className="h-4 w-2/3 rounded bg-[#F0E4DC]"/></div></div>)}</div> : visible.length === 0 ? <div className="rounded-2xl border border-[#E8DDD6] bg-white p-12 text-center"><h2 className="font-black">No products found</h2><p className="mt-2 text-sm text-[#756B67]">Adjust the filters or publish products from the admin dashboard.</p></div> : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{visible.map((product) => <article key={product.dbId} className="group overflow-hidden rounded-2xl border border-[#E8DDD6] bg-white shadow-sm"><div className="relative aspect-[4/5] overflow-hidden bg-[#F0E4DC]">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center px-4 text-center text-xs font-bold text-[#8B7D76]">Product image will appear here</div>}<button onClick={() => toggleWishlist(product.id)} aria-label="Toggle wishlist" className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-xl shadow ${wishlist.includes(product.id) ? "text-[#C94A4A]" : "text-[#6B6258]"}`}>{wishlist.includes(product.id) ? "♥" : "♡"}</button>{product.isFeatured && <span className="absolute left-2 top-2 rounded-full bg-[#8B2E3F] px-2.5 py-1 text-[10px] font-extrabold text-white">Featured</span>}</div><div className="p-3 sm:p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-[#8B2E3F]">{product.category}</p><Link href={`/products/${product.id}`} className="mt-1 block truncate font-black hover:text-[#8B2E3F]">{product.name}</Link><p className="mt-1 text-sm font-black">₹{product.price} <span className="text-[10px] font-semibold text-[#8B7D76]">/ card</span></p><div className="mt-3 grid gap-2 sm:grid-cols-2"><Link href={`/products/${product.id}`} className="flex min-h-10 items-center justify-center rounded-xl border border-[#D8C7BE] px-2 text-xs font-extrabold text-[#8B2E3F]">View</Link><button onClick={() => addToCart(product)} className="min-h-10 rounded-xl bg-[#8B2E3F] px-2 text-xs font-extrabold text-white">{addedProduct === product.id ? "Added ✓" : "Add to cart"}</button></div></div></article>)}</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
