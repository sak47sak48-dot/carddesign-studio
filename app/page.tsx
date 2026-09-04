"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  categories: {
    name: string;
  } | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomepage() {
      setLoading(true);

      try {
        const now = new Date().toISOString();

        const [
          productResult,
          categoryResult,
          bannerResult,
        ] = await Promise.all([
          supabase
            .from("products")
            .select(
              "id,name,slug,price,image_url,categories(name)"
            )
            .eq("is_featured", true)
            .eq("is_active", true)
            .eq("status", "published")
            .is("deleted_at", null)
            .order("updated_at", {
              ascending: false,
            })
            .limit(8),

          supabase
            .from("categories")
            .select(
              "id,name,slug,description,image_url"
            )
            .eq("show_on_homepage", true)
            .eq("is_active", true)
            .is("deleted_at", null)
            .order("sort_order", {
              ascending: true,
            })
            .limit(6),

          supabase
            .from("banners")
            .select(
              "id,title,subtitle,image_url,cta_label,cta_url,starts_at,ends_at"
            )
            .eq("position", "hero")
            .eq("is_active", true)
            .or(
              `starts_at.is.null,starts_at.lte.${now}`
            )
            .or(
              `ends_at.is.null,ends_at.gte.${now}`
            )
            .order("sort_order", {
              ascending: true,
            })
            .limit(3),
        ]);

        if (productResult.error) {
          console.error(
            "Failed to load homepage products:",
            productResult.error
          );
        } else {
          setProducts(
            (productResult.data ?? []) as unknown as Product[]
          );
        }

        if (categoryResult.error) {
          console.error(
            "Failed to load homepage categories:",
            categoryResult.error
          );
        } else {
          setCategories(
            (categoryResult.data ?? []) as Category[]
          );
        }

        if (bannerResult.error) {
          console.error(
            "Failed to load homepage banners:",
            bannerResult.error
          );

          setBanners([]);
        } else {
          setBanners(
            (bannerResult.data ?? []) as Banner[]
          );
        }
      } catch (error) {
        console.error(
          "Failed to load homepage:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    void loadHomepage();
  }, []);

  const hero = banners[0];

  return (
    <main className="overflow-hidden bg-[#FFFDF9] text-[#2B2523]">
      {/* HERO */}
      <section className="relative border-b border-[#EEE4DE] bg-[#F7ECE6]">
        {hero?.image_url && (
          <img
            src={hero.image_url}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        )}

        <div className="relative mx-auto grid max-w-[1440px] gap-10 px-5 py-16 md:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-16 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B3883A]">
              Wedding invitations, thoughtfully made
            </p>

            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.03] tracking-[-0.04em] md:text-6xl lg:text-7xl">
              {hero?.title ||
                "Invitations designed for the way you celebrate."}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#6F6560] md:text-lg">
              {hero?.subtitle ||
                "Discover premium wedding cards, customize every important detail, and order printing from one simple experience."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={
                  hero?.cta_url || "/products"
                }
                className="inline-flex min-h-12 items-center rounded-full bg-[#8B2E3F] px-7 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#742536]"
              >
                {hero?.cta_label ||
                  "Explore wedding cards"}
              </Link>

              <Link
                href="/customize"
                className="inline-flex min-h-12 items-center rounded-full border border-[#BFA79B] bg-white/70 px-7 text-sm font-extrabold text-[#8B2E3F]"
              >
                Start customization
              </Link>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-[36px] border border-white/70 bg-[#EBD9CF] shadow-xl shadow-[#8B2E3F]/5 lg:min-h-[520px]">
            {hero?.image_url ? (
              <img
                src={hero.image_url}
                alt={hero.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center p-10 text-center text-sm font-bold text-[#8B7D76] lg:min-h-[520px]">
                No active homepage banner.
                Upload or enable one from Admin →
                Homepage Banners.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-16">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B2E3F]">
              Shop by collection
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Invitations for every celebration
            </h2>

            <p className="mt-3 leading-7 text-[#756B67]">
              Explore wedding invitation
              collections designed for different
              traditions, styles and celebrations.
            </p>
          </div>

          {loading ? (
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {Array.from({
                length: 3,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-3xl bg-[#F0E4DC]"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-[#E8DDD6] bg-white p-10 text-center text-sm text-[#756B67]">
              No homepage categories are
              currently available.
            </div>
          ) : (
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {categories.map(
                (category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${encodeURIComponent(
                      category.name
                    )}`}
                    className="group overflow-hidden rounded-3xl border border-[#E8DDD6] bg-white shadow-sm"
                  >
                    <div className="aspect-[4/2.6] overflow-hidden bg-[#F0E4DC]">
                      {category.image_url ? (
                        <img
                          src={
                            category.image_url
                          }
                          alt={category.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs font-bold text-[#817672]">
                          Collection image
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-black group-hover:text-[#8B2E3F]">
                        {category.name}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#756B67]">
                        {category.description ||
                          "Explore this wedding invitation collection."}
                      </p>

                      <p className="mt-4 text-xs font-extrabold text-[#8B2E3F]">
                        Explore collection →
                      </p>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="border-y border-[#EEE4DE] bg-[#FCF7F3] py-16 lg:py-20">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B2E3F]">
                Popular invitations
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                Featured wedding cards
              </h2>
            </div>

            <Link
              href="/products"
              className="rounded-full border border-[#8B2E3F] px-5 py-2.5 text-sm font-extrabold text-[#8B2E3F]"
            >
              View all cards
            </Link>
          </div>

          {products.length === 0 &&
          !loading ? (
            <div className="mt-10 rounded-3xl border border-[#E8DDD6] bg-white p-10 text-center text-sm text-[#756B67]">
              No featured products are currently
              available.
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {products.map(
                (product) => (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-3xl border border-[#E8DDD6] bg-white shadow-sm"
                  >
                    <Link
                      href={`/products/${product.slug}`}
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-[#F0E4DC]">
                        {product.image_url ? (
                          <img
                            src={
                              product.image_url
                            }
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-4 text-center text-xs font-bold text-[#817672]">
                            Product image
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <p className="text-[10px] font-black uppercase tracking-wide text-[#8B2E3F]">
                          {product.categories
                            ?.name ||
                            "Wedding"}
                        </p>

                        <h3 className="mt-1 truncate font-black">
                          {product.name}
                        </h3>

                        <p className="mt-2 text-sm font-black">
                          ₹
                          {Number(
                            product.price
                          ).toLocaleString(
                            "en-IN"
                          )}{" "}
                          <span className="text-[10px] font-semibold text-[#817672]">
                            / card
                          </span>
                        </p>
                      </div>
                    </Link>
                  </article>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto grid max-w-[1440px] gap-5 px-5 md:grid-cols-3 md:px-8 lg:px-16">
          {[
            [
              "Premium printing",
              "Quality paper, finishing and print options for your invitation.",
            ],
            [
              "Personal customization",
              "Names, dates, venue, language and invitation message in one flow.",
            ],
            [
              "Order visibility",
              "Track fulfilment from placed through printing, shipping and delivery.",
            ],
          ].map(([title, copy]) => (
            <div
              key={title}
              className="rounded-3xl border border-[#E8DDD6] bg-white p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F7ECE6] font-black text-[#8B2E3F]">
                ✓
              </div>

              <h3 className="mt-4 text-lg font-black">
                {title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#756B67]">
                {copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CUSTOMIZATION CTA */}
      <section className="px-5 pb-16 md:px-8 lg:px-16 lg:pb-24">
        <div className="mx-auto max-w-[1310px] overflow-hidden rounded-[36px] bg-[#8B2E3F] px-6 py-12 text-white md:px-10 lg:flex lg:items-center lg:justify-between lg:px-14">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E8CFA5]">
              Need something unique?
            </p>

            <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
              Build a personalized wedding
              invitation with our customization
              flow.
            </h2>
          </div>

          <Link
            href="/customize"
            className="mt-6 inline-flex min-h-12 shrink-0 items-center rounded-full bg-white px-6 text-sm font-extrabold text-[#8B2E3F] lg:mt-0"
          >
            Customize a card
          </Link>
        </div>
      </section>
    </main>
  );
}