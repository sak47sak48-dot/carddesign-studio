"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Product = {
  dbId: string;
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  paperType: string;
  size: string;
  printing: string;
  minimumOrder: number;
  stockQuantity: number;
  trackInventory: boolean;
  imageUrl: string | null;
};

type ProductImage = { id: string; image_url: string; alt_text: string | null; is_primary: boolean };
type Customization = { productId: string; productName: string; brideName: string; groomName: string; weddingDate: string; weddingTime: string; venue: string; language: string; religion: string; message: string };
type CartItem = Product & { quantity: number; customization?: Customization };

function notifyStorageChange() { window.dispatchEvent(new Event("wedinvite-storage")); }

export default function ProductDetailsPage() {
  const params = useParams();
  const slug = Array.isArray(params.id) ? params.id[0] : params.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [customization, setCustomization] = useState<Customization | null>(null);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try { setWishlist(JSON.parse(localStorage.getItem("wedinvite-wishlist") || "[]")); } catch { setWishlist([]); }
    try {
      const saved = JSON.parse(localStorage.getItem("wedinvite-customization") || "null") as Customization | null;
      setCustomization(saved?.productId === slug ? saved : null);
    } catch { setCustomization(null); }

    (async () => {
      setLoading(true);
      const result = await supabase.from("products").select("id,name,slug,price,description,paper_type,card_size,printing_type,minimum_quantity,stock_quantity,track_inventory,image_url,categories(name)").eq("slug", slug).maybeSingle();
      if (result.error || !result.data) {
        setError(result.error?.message ?? "Product not found."); setLoading(false); return;
      }
      const row = result.data;
      const mapped: Product = {
        dbId: row.id, id: row.slug, name: row.name, price: Number(row.price), category: (row.categories as unknown as {name:string}|null)?.name ?? "Wedding",
        description: row.description ?? "A premium wedding invitation from carddesign.studio.", paperType: row.paper_type ?? "Premium card stock", size: row.card_size ?? "Custom size", printing: row.printing_type ?? "Premium print", minimumOrder: Number(row.minimum_quantity || 100), stockQuantity: Number(row.stock_quantity || 0), trackInventory: Boolean(row.track_inventory), imageUrl: row.image_url,
      };
      setProduct(mapped); setQuantity(mapped.minimumOrder);
      const imageResult = await supabase.from("product_images").select("id,image_url,alt_text,is_primary").eq("product_id", row.id).order("sort_order");
      const imageRows = (imageResult.data ?? []) as ProductImage[];
      setImages(imageRows);
      setSelectedImage(imageRows.find((image) => image.is_primary)?.image_url ?? imageRows[0]?.image_url ?? mapped.imageUrl);
      setLoading(false);
    })();
  }, [slug]);

  const isSaved = product ? wishlist.includes(product.id) : false;
  const estimatedTotal = useMemo(() => product ? product.price * quantity : 0, [product, quantity]);

  function toggleWishlist() {
    if (!product) return;
    const updated = isSaved ? wishlist.filter((id) => id !== product.id) : [...wishlist, product.id];
    setWishlist(updated); localStorage.setItem("wedinvite-wishlist", JSON.stringify(updated)); notifyStorageChange();
  }

  function addToCart() {
    if (!product) return;
    let cart: CartItem[] = [];
    try { cart = JSON.parse(localStorage.getItem("wedinvite-cart") || "[]"); } catch { cart = []; }
    const existing = cart.find((item) => item.id === product.id);
    if (existing) { existing.quantity = quantity; if (customization) existing.customization = customization; }
    else cart.push({ ...product, quantity, ...(customization ? { customization } : {}) });
    localStorage.setItem("wedinvite-cart", JSON.stringify(cart)); notifyStorageChange(); setAdded(true); window.setTimeout(() => setAdded(false), 1400);
  }

  if (loading) return <main className="flex min-h-[70vh] items-center justify-center bg-[#FFFDF9]"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#E7DAD3] border-t-[#8B2E3F]"/><p className="mt-4 text-sm text-[#756B67]">Loading invitation...</p></div></main>;
  if (error || !product) return <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-20 text-center"><h1 className="text-3xl font-black">Invitation not found</h1><p className="mt-3 text-[#756B67]">{error}</p><Link href="/products" className="mt-6 inline-flex rounded-xl bg-[#8B2E3F] px-5 py-3 text-sm font-extrabold text-white">Back to products</Link></main>;

  const quantityOptions = [1,2,3,5,10].map((multiplier) => product.minimumOrder * multiplier);
  const stockBlocked = product.trackInventory && product.stockQuantity < quantity;

  return <main className="bg-[#FFFDF9] text-[#2B2523]">
    <div className="mx-auto max-w-[1440px] px-5 py-6 md:px-8 lg:px-16"><Link href="/products" className="text-sm font-bold text-[#8B2E3F]">← All wedding cards</Link></div>
    <section className="mx-auto grid max-w-[1440px] gap-8 px-5 pb-16 md:px-8 lg:grid-cols-2 lg:gap-14 lg:px-16">
      <div><div className="aspect-[4/5] overflow-hidden rounded-[28px] bg-[#F0E4DC]">{selectedImage ? <img src={selectedImage} alt={product.name} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-sm font-bold text-[#817672]">Product image will appear here</div>}</div>{images.length>1&&<div className="mt-3 grid grid-cols-5 gap-2">{images.map(image=><button key={image.id} onClick={()=>setSelectedImage(image.image_url)} className={`aspect-square overflow-hidden rounded-xl border-2 ${selectedImage===image.image_url?"border-[#8B2E3F]":"border-transparent"}`}><img src={image.image_url} alt={image.alt_text??product.name} className="h-full w-full object-cover"/></button>)}</div>}</div>
      <div className="lg:py-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B2E3F]">{product.category} collection</p><h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{product.name}</h1><p className="mt-4 text-2xl font-black">₹{product.price} <span className="text-sm font-semibold text-[#817672]">per card</span></p><p className="mt-5 max-w-xl leading-7 text-[#756B67]">{product.description}</p>
        <div className="mt-7 grid grid-cols-3 gap-3">{[["Paper",product.paperType],["Size",product.size],["Printing",product.printing]].map(([label,value])=><div key={label} className="rounded-2xl border border-[#E8DDD6] bg-white p-3"><p className="text-[10px] font-black uppercase tracking-wide text-[#A09691]">{label}</p><p className="mt-1 text-xs font-bold sm:text-sm">{value}</p></div>)}</div>
        <div className="mt-7 rounded-2xl border border-[#E8DDD6] bg-white p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wide text-[#817672]">Order quantity</p><p className="mt-1 text-sm text-[#756B67]">Minimum {product.minimumOrder} cards</p></div><select value={quantity} onChange={(e)=>setQuantity(Number(e.target.value))} className="min-h-11 rounded-xl border border-[#DCCFC8] px-3 font-bold">{quantityOptions.map(q=><option key={q} value={q}>{q}</option>)}</select></div><div className="mt-4 flex items-center justify-between border-t border-[#EEE6E0] pt-4"><span className="text-sm font-bold text-[#756B67]">Estimated cards total</span><span className="text-xl font-black">₹{estimatedTotal.toLocaleString("en-IN")}</span></div>{stockBlocked&&<p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">Only {product.stockQuantity} units are currently available.</p>}</div>
        {customization&&<div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-black text-emerald-800">Customization saved</p><p className="mt-1 text-xs text-emerald-700">{customization.brideName} & {customization.groomName}</p></div>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><Link href={`/customize?product=${product.id}`} className="flex min-h-12 items-center justify-center rounded-xl border border-[#8B2E3F] px-4 text-sm font-extrabold text-[#8B2E3F]">Customize invitation</Link><button onClick={addToCart} disabled={stockBlocked} className="min-h-12 rounded-xl bg-[#8B2E3F] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{added?"Added to cart ✓":"Add to cart"}</button></div>
        <button onClick={toggleWishlist} className="mt-3 min-h-11 w-full rounded-xl border border-[#DCCFC8] bg-white text-sm font-bold">{isSaved?"♥ Saved to wishlist":"♡ Save to wishlist"}</button>
      </div>
    </section>
  </main>;
}
