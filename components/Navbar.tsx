"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type CartItem = {
  id: string;
  quantity: number;
};

type Category = {
  id: string;
  name: string;
};

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brandName, setBrandName] = useState("carddesign.studio");

  function updateCounts() {
    try {
      const wishlist = JSON.parse(
        localStorage.getItem("wedinvite-wishlist") || "[]"
      ) as string[];

      setWishlistCount(wishlist.length);
    } catch {
      setWishlistCount(0);
    }

    try {
      const cart = JSON.parse(
        localStorage.getItem("wedinvite-cart") || "[]"
      ) as CartItem[];

      setCartCount(cart.length);
    } catch {
      setCartCount(0);
    }
  }

  useEffect(() => {
    updateCounts();

    const storageHandler = () => updateCounts();

    window.addEventListener("storage", storageHandler);
    window.addEventListener("wedinvite-storage", storageHandler);
    window.addEventListener("focus", storageHandler);

    (async () => {
      const [categoryResult, settingResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id,name")
          .eq("show_in_navigation", true)
          .order("sort_order")
          .limit(5),

        supabase
          .from("site_settings")
          .select("value")
          .eq("key", "business")
          .maybeSingle(),
      ]);

      if (!categoryResult.error) {
        setCategories(
          (categoryResult.data ?? []) as Category[]
        );
      }

      if (!settingResult.error) {
        const value = settingResult.data?.value as {
          brand_name?: string;
        } | null;

        if (value?.brand_name) {
          setBrandName(value.brand_name);
        }
      }
    })();

    return () => {
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener(
        "wedinvite-storage",
        storageHandler
      );
      window.removeEventListener("focus", storageHandler);
    };
  }, []);

  const close = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#EDE7DF] bg-[#FFFDF9]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 sm:px-5 md:px-8 lg:px-12 xl:px-16">
          {/* LOGO */}
          <Link
            href="/"
            onClick={close}
            aria-label={`${brandName} home`}
            className="flex shrink-0 items-center"
          >
            <Image
              src="/carddesign-logo.png"
              alt={brandName}
              width={330}
              height={90}
              priority
              className="h-auto w-[150px] object-contain sm:w-[175px] md:w-[190px] lg:w-[205px]"
            />
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-5 xl:gap-6 lg:flex">
            <Link
              href="/"
              className="text-sm font-bold text-[#514946] transition hover:text-[#8B2E3F]"
            >
              Home
            </Link>

            <Link
              href="/products"
              className="text-sm font-bold text-[#514946] transition hover:text-[#8B2E3F]"
            >
              Wedding Cards
            </Link>

            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${encodeURIComponent(
                  category.name
                )}`}
                className="text-sm font-bold text-[#514946] transition hover:text-[#8B2E3F]"
              >
                {category.name}
              </Link>
            ))}

            <Link
              href="/track-order"
              className="text-sm font-bold text-[#514946] transition hover:text-[#8B2E3F]"
            >
              Track Order
            </Link>
          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="hidden items-center gap-1 lg:flex">
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-xl transition hover:bg-[#FFF1F2]"
            >
              ♡

              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#8B2E3F] px-1 text-[10px] font-black text-white">
                  {wishlistCount > 99
                    ? "99+"
                    : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              aria-label="Shopping Cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-lg transition hover:bg-[#FFF1F2]"
            >
              🛒

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#8B2E3F] px-1 text-[10px] font-black text-white">
                  {cartCount > 99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/profile"
              className="ml-1 flex h-11 items-center rounded-full border border-[#E4D8D1] px-4 text-sm font-bold text-[#514946] transition hover:border-[#8B2E3F] hover:text-[#8B2E3F]"
            >
              Account
            </Link>
          </div>

          {/* MOBILE ACTIONS */}
          <div className="flex shrink-0 items-center gap-0.5 lg:hidden">
            <Link
              href="/wishlist"
              onClick={close}
              aria-label="Wishlist"
              className="relative flex h-10 w-10 items-center justify-center text-xl"
            >
              ♡

              {wishlistCount > 0 && (
                <span className="absolute right-0 top-0 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8B2E3F] px-1 text-[9px] font-black text-white">
                  {wishlistCount > 99
                    ? "99+"
                    : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              onClick={close}
              aria-label="Shopping Cart"
              className="relative flex h-10 w-10 items-center justify-center"
            >
              🛒

              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8B2E3F] px-1 text-[9px] font-black text-white">
                  {cartCount > 99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() =>
                setMobileOpen((value) => !value)
              }
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-[#E4D8D1] text-lg text-[#514946] transition hover:border-[#8B2E3F] hover:text-[#8B2E3F]"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="absolute inset-0 bg-black/25"
          />

          <div className="absolute right-0 top-0 h-full w-[min(86vw,360px)] overflow-y-auto bg-[#FFFDF9] p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#E8DDD6] pb-5">
              <Link
                href="/"
                onClick={close}
                aria-label={`${brandName} home`}
                className="min-w-0"
              >
                <Image
                  src="/carddesign-logo.png"
                  alt={brandName}
                  width={300}
                  height={82}
                  className="h-auto w-[170px] object-contain"
                />
              </Link>

              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E4D8D1] text-2xl leading-none text-[#514946]"
              >
                ×
              </button>
            </div>

            <nav className="mt-5 grid gap-1">
              <Link
                href="/"
                onClick={close}
                className="rounded-xl px-3 py-3 text-sm font-bold text-[#514946] transition hover:bg-[#F7EFEB] hover:text-[#8B2E3F]"
              >
                Home
              </Link>

              <Link
                href="/products"
                onClick={close}
                className="rounded-xl px-3 py-3 text-sm font-bold text-[#514946] transition hover:bg-[#F7EFEB] hover:text-[#8B2E3F]"
              >
                Wedding Cards
              </Link>

              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${encodeURIComponent(
                    category.name
                  )}`}
                  onClick={close}
                  className="rounded-xl px-3 py-3 text-sm font-bold text-[#514946] transition hover:bg-[#F7EFEB] hover:text-[#8B2E3F]"
                >
                  {category.name}
                </Link>
              ))}

              <Link
                href="/track-order"
                onClick={close}
                className="rounded-xl px-3 py-3 text-sm font-bold text-[#514946] transition hover:bg-[#F7EFEB] hover:text-[#8B2E3F]"
              >
                Track Order
              </Link>

              <Link
                href="/wishlist"
                onClick={close}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-[#514946] transition hover:bg-[#F7EFEB] hover:text-[#8B2E3F]"
              >
                <span>Wishlist</span>

                {wishlistCount > 0 && (
                  <span className="rounded-full bg-[#8B2E3F] px-2 py-0.5 text-[10px] font-black text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                onClick={close}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-[#514946] transition hover:bg-[#F7EFEB] hover:text-[#8B2E3F]"
              >
                <span>Cart</span>

                {cartCount > 0 && (
                  <span className="rounded-full bg-[#8B2E3F] px-2 py-0.5 text-[10px] font-black text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                href="/profile"
                onClick={close}
                className="rounded-xl px-3 py-3 text-sm font-bold text-[#514946] transition hover:bg-[#F7EFEB] hover:text-[#8B2E3F]"
              >
                Account
              </Link>
            </nav>

            <div className="mt-6 border-t border-[#E8DDD6] pt-5">
              <Link
                href="/whatsapp-support"
                onClick={close}
                className="flex min-h-11 items-center justify-center rounded-xl bg-[#8B2E3F] px-4 text-sm font-extrabold text-white transition hover:bg-[#712433]"
              >
                WhatsApp Support
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}