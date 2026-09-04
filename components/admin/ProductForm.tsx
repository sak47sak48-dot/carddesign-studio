"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Card, Notice, PageHeader } from "./AdminUI";

type Category = { id: string; name: string };
type ProductImage = { id: string; image_url: string; storage_path: string | null; alt_text: string | null; sort_order: number; is_primary: boolean };
type Variant = { id: string; name: string; sku: string | null; price: number | null; stock_quantity: number; attributes: Record<string, string>; is_active: boolean; sort_order: number };
type InventoryLog = { id: string; change_quantity: number; quantity_before: number; quantity_after: number; reason: string; created_at: string };

type ProductRecord = {
  id: string; name: string; slug: string; sku: string | null; description: string | null; category_id: string | null;
  price: number; compare_at_price: number | null; minimum_quantity: number; stock_quantity: number; low_stock_threshold: number;
  track_inventory: boolean; paper_type: string | null; card_size: string | null; printing_type: string | null; event_type: string | null;
  tradition: string | null; style: string | null; status: string; is_featured: boolean; is_active: boolean; published_at: string | null; updated_at: string;
};

const inputClass = "mt-1.5 min-h-11 w-full rounded-xl border border-[#DCCFC8] bg-white px-3 text-sm outline-none focus:border-[#8B2E3F] focus:ring-2 focus:ring-[#8B2E3F]/10";
const labelClass = "text-xs font-extrabold text-[#554D49]";

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function parseAttributes(value: string) {
  const result: Record<string, string> = {};
  value.split(",").map((part) => part.trim()).filter(Boolean).forEach((part) => {
    const [key, ...rest] = part.split("=");
    if (key?.trim() && rest.join("=").trim()) result[key.trim()] = rest.join("=").trim();
  });
  return result;
}
function stringifyAttributes(value: Record<string, string>) { return Object.entries(value ?? {}).map(([key, val]) => `${key}=${val}`).join(", "); }

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const max = 2200;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp", lastModified: Date.now() });
}

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const editing = Boolean(productId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dirty, setDirty] = useState(false);
  const [variantForm, setVariantForm] = useState({ name: "", sku: "", price: "", stock_quantity: "0", attributes: "", is_active: true });
  const [form, setForm] = useState({
    name: "", slug: "", sku: "", description: "", category_id: "", price: "", compare_at_price: "", cost_price: "",
    minimum_quantity: "100", stock_quantity: "0", low_stock_threshold: "10", track_inventory: true,
    paper_type: "", card_size: "", printing_type: "", event_type: "Wedding", tradition: "", style: "",
    status: "draft", is_featured: false, is_active: true, published_at: "",
  });

  useEffect(() => {
    let active = true;
    async function load() {
      const categoryResult = await supabase.from("categories").select("id,name").is("deleted_at", null).order("sort_order").order("name");
      if (active) setCategories((categoryResult.data ?? []) as Category[]);
      if (!productId) { if (active) setLoading(false); return; }

      const [productResult, imageResult, privateResult, variantResult, logResult] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).maybeSingle(),
        supabase.from("product_images").select("id,image_url,storage_path,alt_text,sort_order,is_primary").eq("product_id", productId).order("sort_order"),
        supabase.from("product_private").select("cost_price").eq("product_id", productId).maybeSingle(),
        supabase.from("product_variants").select("id,name,sku,price,stock_quantity,attributes,is_active,sort_order").eq("product_id", productId).order("sort_order"),
        supabase.from("inventory_logs").select("id,change_quantity,quantity_before,quantity_after,reason,created_at").eq("product_id", productId).order("created_at", { ascending: false }).limit(8),
      ]);
      if (!active) return;
      if (productResult.error || !productResult.data) setError(productResult.error?.message ?? "Product not found.");
      else {
        const p = productResult.data as ProductRecord;
        setForm({
          name: p.name ?? "", slug: p.slug ?? "", sku: p.sku ?? "", description: p.description ?? "", category_id: p.category_id ?? "",
          price: String(p.price ?? ""), compare_at_price: p.compare_at_price == null ? "" : String(p.compare_at_price), cost_price: privateResult.data?.cost_price == null ? "" : String(privateResult.data.cost_price),
          minimum_quantity: String(p.minimum_quantity ?? 100), stock_quantity: String(p.stock_quantity ?? 0), low_stock_threshold: String(p.low_stock_threshold ?? 10), track_inventory: p.track_inventory ?? true,
          paper_type: p.paper_type ?? "", card_size: p.card_size ?? "", printing_type: p.printing_type ?? "", event_type: p.event_type ?? "Wedding", tradition: p.tradition ?? "", style: p.style ?? "",
          status: p.status ?? "draft", is_featured: p.is_featured ?? false, is_active: p.is_active ?? true,
          published_at: p.published_at ? new Date(p.published_at).toISOString().slice(0, 16) : "",
        });
        setLastUpdated(p.updated_at ?? null);
        setImages((imageResult.data ?? []) as ProductImage[]);
        setVariants((variantResult.data ?? []) as unknown as Variant[]);
        setInventoryLogs((logResult.data ?? []) as InventoryLog[]);
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [productId]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) { if (!dirty) return; event.preventDefault(); event.returnValue = ""; }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) { setForm((prev) => ({ ...prev, [key]: value })); setDirty(true); }
  const primaryImage = useMemo(() => images.find((image) => image.is_primary) ?? images[0], [images]);

  async function save(event: FormEvent) {
    event.preventDefault(); setError(""); setSuccess("");
    if (!form.name.trim() || !form.slug.trim() || !form.sku.trim() || form.price === "" || Number(form.price) < 0) { setError("Name, slug, SKU and a valid price are required."); return; }
    if (form.compare_at_price && Number(form.compare_at_price) < Number(form.price)) { setError("Compare-at price should be greater than or equal to selling price."); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      name: form.name.trim(), slug: slugify(form.slug), sku: form.sku.trim().toUpperCase(), description: form.description.trim() || null,
      category_id: form.category_id || null, price: Number(form.price), compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      minimum_quantity: Math.max(1, Number(form.minimum_quantity) || 1), stock_quantity: Math.max(0, Number(form.stock_quantity) || 0),
      low_stock_threshold: Math.max(0, Number(form.low_stock_threshold) || 0), track_inventory: form.track_inventory,
      paper_type: form.paper_type.trim() || null, card_size: form.card_size.trim() || null, printing_type: form.printing_type.trim() || null,
      event_type: form.event_type.trim() || null, tradition: form.tradition.trim() || null, style: form.style.trim() || null,
      status: form.status, is_featured: form.is_featured, is_active: form.is_active,
      published_at: form.status === "published" ? (form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString()) : null,
      ...(editing ? {} : { created_by: user?.id ?? null }), image_url: primaryImage?.image_url ?? null,
    };
    const result = productId ? await supabase.from("products").update(payload).eq("id", productId).select("id,updated_at").single() : await supabase.from("products").insert(payload).select("id,updated_at").single();
    if (result.error) { setSaving(false); setError(result.error.message); return; }
    const savedProductId = result.data?.id ?? productId;
    if (savedProductId) {
      const privateResult = await supabase.from("product_private").upsert({ product_id: savedProductId, cost_price: form.cost_price ? Number(form.cost_price) : null }, { onConflict: "product_id" });
      if (privateResult.error) { setSaving(false); setError(privateResult.error.message); return; }
    }
    setSaving(false); setDirty(false); setLastUpdated(result.data?.updated_at ?? new Date().toISOString());
    setSuccess(editing ? "Product updated successfully." : "Product created successfully.");
    if (!productId && result.data?.id) router.replace(`/admin/products/${result.data.id}`);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    if (!productId) { setError("Save the product first, then upload images."); return; }
    setUploading(true); setError("");
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    for (const original of Array.from(files)) {
      if (!allowed.includes(original.type)) { setError("Only JPG, PNG and WebP images are allowed."); continue; }
      if (original.size > 15 * 1024 * 1024) { setError("Source images must be 15 MB or smaller before compression."); continue; }
      let file = original;
      try { file = await compressImage(original); } catch { file = original; }
      if (file.size > 6 * 1024 * 1024) { setError(`${original.name} is still larger than 6 MB after compression.`); continue; }
      const ext = file.type === "image/webp" ? "webp" : (file.name.split(".").pop()?.toLowerCase() || "jpg");
      const path = `products/${productId}/${crypto.randomUUID()}.${ext}`;
      const upload = await supabase.storage.from("catalog-images").upload(path, file, { upsert: false, cacheControl: "3600", contentType: file.type });
      if (upload.error) { setError(upload.error.message); continue; }
      const { data: publicUrl } = supabase.storage.from("catalog-images").getPublicUrl(path);
      const row = await supabase.from("product_images").insert({ product_id: productId, image_url: publicUrl.publicUrl, storage_path: path, alt_text: form.name || original.name, sort_order: images.length, is_primary: images.length === 0 }).select("id,image_url,storage_path,alt_text,sort_order,is_primary").single();
      if (row.data) {
        const next = [...images, row.data as ProductImage]; setImages(next);
        if (next.length === 1) await supabase.from("products").update({ image_url: publicUrl.publicUrl }).eq("id", productId);
      }
    }
    setUploading(false);
  }

  async function makePrimary(image: ProductImage) {
    if (!productId) return;
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
    const result = await supabase.from("product_images").update({ is_primary: true }).eq("id", image.id);
    if (!result.error) {
      await supabase.from("products").update({ image_url: image.image_url }).eq("id", productId);
      setImages((prev) => prev.map((item) => ({ ...item, is_primary: item.id === image.id })));
    }
  }

  async function updateAlt(image: ProductImage, altText: string) {
    const result = await supabase.from("product_images").update({ alt_text: altText.trim() || null }).eq("id", image.id);
    if (!result.error) setImages((prev) => prev.map((item) => item.id === image.id ? { ...item, alt_text: altText.trim() || null } : item));
  }

  async function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images]; [next[index], next[target]] = [next[target], next[index]];
    next.forEach((image, order) => { image.sort_order = order; });
    setImages([...next]);
    await Promise.all(next.map((image, order) => supabase.from("product_images").update({ sort_order: order }).eq("id", image.id)));
  }

  async function removeImage(image: ProductImage) {
    if (!confirm("Delete this image?")) return;
    if (image.storage_path) await supabase.storage.from("catalog-images").remove([image.storage_path]);
    await supabase.from("product_images").delete().eq("id", image.id);
    const next = images.filter((item) => item.id !== image.id).map((item, index) => ({ ...item, sort_order: index }));
    setImages(next);
    if (image.is_primary && next[0] && productId) await makePrimary(next[0]);
  }

  async function addVariant() {
    if (!productId) { setError("Save the product first, then add variants."); return; }
    if (!variantForm.name.trim()) { setError("Variant name is required."); return; }
    const result = await supabase.from("product_variants").insert({ product_id: productId, name: variantForm.name.trim(), sku: variantForm.sku.trim().toUpperCase() || null, price: variantForm.price ? Number(variantForm.price) : null, stock_quantity: Math.max(0, Number(variantForm.stock_quantity) || 0), attributes: parseAttributes(variantForm.attributes), is_active: variantForm.is_active, sort_order: variants.length }).select("id,name,sku,price,stock_quantity,attributes,is_active,sort_order").single();
    if (result.error) setError(result.error.message); else { setVariants((prev) => [...prev, result.data as unknown as Variant]); setVariantForm({ name: "", sku: "", price: "", stock_quantity: "0", attributes: "", is_active: true }); }
  }

  async function removeVariant(variant: Variant) {
    if (!confirm(`Delete variant ${variant.name}?`)) return;
    const result = await supabase.from("product_variants").delete().eq("id", variant.id);
    if (result.error) setError(result.error.message); else setVariants((prev) => prev.filter((item) => item.id !== variant.id));
  }

  if (loading) return <div className="rounded-2xl border border-[#E7DAD3] bg-white p-10 text-center text-sm text-[#756B67]">Loading product...</div>;

  return <div className="space-y-6">
    <PageHeader eyebrow="Catalog" title={editing ? "Edit product" : "Add product"} description="Manage customer-facing information, pricing, stock, variants, media and publication state." />
    {lastUpdated && <p className="-mt-4 text-xs font-semibold text-[#817672]">Last updated {new Date(lastUpdated).toLocaleString("en-IN")}</p>}
    {error && <Notice>{error}</Notice>}{success && <Notice kind="success">{success}</Notice>}

    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Card className="p-5 sm:p-6"><h2 className="text-lg font-black">Basic information</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className={labelClass}>Product name<input className={inputClass} value={form.name} onChange={(e) => { set("name", e.target.value); if (!editing && !form.slug) set("slug", slugify(e.target.value)); }} /></label>
          <label className={labelClass}>SKU<input className={inputClass} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="CDS-1001" /></label>
          <label className={labelClass}>Slug<input className={inputClass} value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} /></label>
          <label className={labelClass}>Category<select className={inputClass} value={form.category_id} onChange={(e) => set("category_id", e.target.value)}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className={`${labelClass} md:col-span-2`}>Description<textarea className={`${inputClass} min-h-32 py-3`} value={form.description} onChange={(e) => set("description", e.target.value)} /></label>
        </div></Card>

        <Card className="p-5 sm:p-6"><h2 className="text-lg font-black">Pricing</h2><div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className={labelClass}>Selling price (₹)<input type="number" min="0" step="0.01" className={inputClass} value={form.price} onChange={(e) => set("price", e.target.value)} /></label>
          <label className={labelClass}>Compare-at price<input type="number" min="0" step="0.01" className={inputClass} value={form.compare_at_price} onChange={(e) => set("compare_at_price", e.target.value)} /></label>
          <label className={labelClass}>Cost price (admin only)<input type="number" min="0" step="0.01" className={inputClass} value={form.cost_price} onChange={(e) => set("cost_price", e.target.value)} /></label>
        </div></Card>

        <Card className="p-5 sm:p-6"><h2 className="text-lg font-black">Inventory & card specifications</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className={labelClass}>Minimum order<input type="number" min="1" className={inputClass} value={form.minimum_quantity} onChange={(e) => set("minimum_quantity", e.target.value)} /></label>
          <label className={labelClass}>Stock quantity<input type="number" min="0" className={inputClass} value={form.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} /></label>
          <label className={labelClass}>Low stock threshold<input type="number" min="0" className={inputClass} value={form.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value)} /></label>
          <label className={labelClass}>Paper type<input className={inputClass} value={form.paper_type} onChange={(e) => set("paper_type", e.target.value)} placeholder="Premium matte" /></label>
          <label className={labelClass}>Card size<input className={inputClass} value={form.card_size} onChange={(e) => set("card_size", e.target.value)} placeholder="7 × 5 inch" /></label>
          <label className={labelClass}>Printing type<input className={inputClass} value={form.printing_type} onChange={(e) => set("printing_type", e.target.value)} placeholder="Digital print" /></label>
        </div><label className="mt-5 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.track_inventory} onChange={(e) => set("track_inventory", e.target.checked)} /> Track inventory for this product</label></Card>

        <Card className="p-5 sm:p-6"><h2 className="text-lg font-black">Event & style</h2><div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className={labelClass}>Event type<input className={inputClass} value={form.event_type} onChange={(e) => set("event_type", e.target.value)} /></label>
          <label className={labelClass}>Tradition<input className={inputClass} value={form.tradition} onChange={(e) => set("tradition", e.target.value)} placeholder="Muslim / Hindu / Christian" /></label>
          <label className={labelClass}>Style<input className={inputClass} value={form.style} onChange={(e) => set("style", e.target.value)} placeholder="Luxury / Minimal / Floral" /></label>
        </div></Card>

        <Card className="p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Product images</h2><p className="mt-1 text-xs text-[#756B67]">JPG, PNG or WebP. Images are compressed in-browser and stored in Supabase Storage.</p></div><label className="cursor-pointer rounded-xl border border-[#CDB7AB] bg-[#FFF9F6] px-4 py-2 text-xs font-extrabold text-[#8B2E3F]">{uploading ? "Compressing / uploading..." : "+ Upload images"}<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={uploading} onChange={(e) => uploadFiles(e.target.files)} /></label></div>
          {!editing && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">Save the product first to enable image upload.</p>}
          {images.length > 0 && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{images.map((image, index) => <div key={image.id} className="overflow-hidden rounded-xl border border-[#E7DAD3] bg-[#FCF8F5]"><div className="aspect-square bg-[#F1E5DF]"><img src={image.image_url} alt={image.alt_text ?? form.name} className="h-full w-full object-cover" /></div><div className="space-y-2 p-2"><input defaultValue={image.alt_text ?? ""} onBlur={(e) => updateAlt(image, e.target.value)} placeholder="Alt text" className="w-full rounded-lg border border-[#E3D7D0] bg-white px-2 py-1.5 text-[11px]"/><div className="grid grid-cols-2 gap-1"><button type="button" onClick={() => moveImage(index,-1)} disabled={index===0} className="rounded-lg bg-white py-1 text-[11px] font-black disabled:opacity-30">←</button><button type="button" onClick={() => moveImage(index,1)} disabled={index===images.length-1} className="rounded-lg bg-white py-1 text-[11px] font-black disabled:opacity-30">→</button></div><button type="button" onClick={() => makePrimary(image)} className={`w-full rounded-lg px-2 py-1.5 text-[11px] font-extrabold ${image.is_primary ? "bg-[#8B2E3F] text-white" : "bg-white text-[#8B2E3F]"}`}>{image.is_primary ? "Primary image" : "Set primary"}</button><button type="button" onClick={() => removeImage(image)} className="w-full rounded-lg bg-red-50 px-2 py-1.5 text-[11px] font-extrabold text-red-700">Delete</button></div></div>)}</div>}
        </Card>

        <Card className="p-5 sm:p-6"><div><h2 className="text-lg font-black">Variants</h2><p className="mt-1 text-xs text-[#756B67]">Optional variations such as paper, size, finish or box style.</p></div>{!editing && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">Save the product before adding variants.</p>}
          {variants.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-[#FCF8F5] text-[#817672]"><tr><th className="p-2">Variant</th><th className="p-2">SKU</th><th className="p-2">Price</th><th className="p-2">Stock</th><th className="p-2">Attributes</th><th className="p-2"></th></tr></thead><tbody className="divide-y divide-[#EEE4DE]">{variants.map((variant)=><tr key={variant.id}><td className="p-2 font-bold">{variant.name}</td><td className="p-2 font-mono">{variant.sku||"—"}</td><td className="p-2">{variant.price==null?"Base":`₹${variant.price}`}</td><td className="p-2">{variant.stock_quantity}</td><td className="p-2">{stringifyAttributes(variant.attributes)||"—"}</td><td className="p-2 text-right"><button type="button" onClick={()=>removeVariant(variant)} className="rounded-lg bg-red-50 px-2 py-1 font-bold text-red-700">Delete</button></td></tr>)}</tbody></table></div>}
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3"><input className={inputClass} placeholder="Variant name" value={variantForm.name} onChange={(e)=>setVariantForm(p=>({...p,name:e.target.value}))}/><input className={inputClass} placeholder="Variant SKU" value={variantForm.sku} onChange={(e)=>setVariantForm(p=>({...p,sku:e.target.value}))}/><input type="number" min="0" step="0.01" className={inputClass} placeholder="Override price" value={variantForm.price} onChange={(e)=>setVariantForm(p=>({...p,price:e.target.value}))}/><input type="number" min="0" className={inputClass} placeholder="Stock" value={variantForm.stock_quantity} onChange={(e)=>setVariantForm(p=>({...p,stock_quantity:e.target.value}))}/><input className={`${inputClass} md:col-span-2`} placeholder="Attributes e.g. Size=7x5, Finish=Foil" value={variantForm.attributes} onChange={(e)=>setVariantForm(p=>({...p,attributes:e.target.value}))}/></div><div className="mt-3 flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={variantForm.is_active} onChange={(e)=>setVariantForm(p=>({...p,is_active:e.target.checked}))}/> Active variant</label><button type="button" onClick={addVariant} disabled={!editing} className="rounded-xl border border-[#8B2E3F] px-4 py-2 text-xs font-extrabold text-[#8B2E3F] disabled:opacity-40">+ Add variant</button></div>
        </Card>

        {editing && <Card className="p-5 sm:p-6"><h2 className="text-lg font-black">Recent inventory log</h2>{inventoryLogs.length===0?<p className="mt-3 text-sm text-[#756B67]">No stock movements recorded yet.</p>:<div className="mt-4 space-y-2">{inventoryLogs.map((log)=><div key={log.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FCF8F5] p-3 text-xs"><div><p className="font-black capitalize">{log.reason.replaceAll("_"," ")}</p><p className="mt-0.5 text-[#817672]">{new Date(log.created_at).toLocaleString("en-IN")}</p></div><p className={`font-black ${log.change_quantity>=0?"text-emerald-700":"text-red-700"}`}>{log.change_quantity>=0?"+":""}{log.change_quantity} · {log.quantity_before} → {log.quantity_after}</p></div>)}</div>}</Card>}
      </div>

      <div className="space-y-6 xl:sticky xl:top-8 xl:self-start"><Card className="p-5"><h2 className="font-black">Publishing</h2><label className={`${labelClass} mt-4 block`}>Status<select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className={`${labelClass} mt-4 block`}>Publish date<input type="datetime-local" className={inputClass} value={form.published_at} onChange={(e) => set("published_at", e.target.value)} /></label><label className="mt-4 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active</label><label className="mt-3 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured</label><button disabled={saving} className="mt-5 min-h-12 w-full rounded-xl bg-[#8B2E3F] px-4 text-sm font-extrabold text-white disabled:opacity-60">{saving ? "Saving..." : editing ? "Save changes" : "Create product"}</button><button type="button" onClick={() => { if (!dirty || confirm("Discard unsaved changes?")) router.push("/admin/products"); }} className="mt-2 min-h-11 w-full rounded-xl border border-[#DCCFC8] bg-white text-sm font-bold">Cancel</button>{dirty && <p className="mt-3 text-center text-[11px] font-bold text-amber-700">You have unsaved changes.</p>}</Card></div>
    </form>
  </div>;
}
