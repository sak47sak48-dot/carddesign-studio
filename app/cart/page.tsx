"use client";

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
  minimumOrder?: number;
  imageUrl?: string | null;
  customization?: Customization;
};

function notifyStorageChange() {
  window.dispatchEvent(new Event("wedinvite-storage"));
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem("wedinvite-cart");

    try {
      if (savedCart) {
        const parsed: CartItem[] = JSON.parse(savedCart);
        setCart(parsed);
      }
    } catch {
      setCart([]);
    }

    async function loadCommerceSettings() {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "commerce")
          .maybeSingle();

        const value = data?.value as {
          delivery_fee?: number;
        } | null;

        setDeliveryFee(Number(value?.delivery_fee ?? 0));
      } catch (error) {
        console.error("Failed to load commerce settings:", error);
        setDeliveryFee(0);
      } finally {
        setLoaded(true);
      }
    }

    void loadCommerceSettings();
  }, []);

  function saveCart(updatedCart: CartItem[]) {
    setCart(updatedCart);

    localStorage.setItem(
      "wedinvite-cart",
      JSON.stringify(updatedCart)
    );

    notifyStorageChange();
  }

  function increaseQuantity(productId: string) {
    const updatedCart = cart.map((item) =>
      item.id === productId
        ? {
            ...item,
            quantity:
              item.quantity + (item.minimumOrder ?? 100),
          }
        : item
    );

    saveCart(updatedCart);
  }

  function decreaseQuantity(productId: string) {
    const updatedCart = cart.map((item) => {
      if (item.id !== productId) {
        return item;
      }

      return {
        ...item,
        quantity: Math.max(
          item.minimumOrder ?? 100,
          item.quantity - (item.minimumOrder ?? 100)
        ),
      };
    });

    saveCart(updatedCart);
  }

  function removeItem(productId: string) {
    const updatedCart = cart.filter(
      (item) => item.id !== productId
    );

    saveCart(updatedCart);
  }

  function clearCart() {
    setCart([]);

    localStorage.removeItem("wedinvite-cart");

    notifyStorageChange();
  }

  function formatWeddingDate(value: string) {
    if (!value) {
      return "";
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatWeddingTime(value: string) {
    if (!value) {
      return "";
    }

    const [hours, minutes] = value.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes)
    );

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    );
  }, [cart]);

  const delivery =
    cart.length > 0 ? deliveryFee : 0;

  const total = subtotal + delivery;

  const totalCards = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cart]);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#FFFDF9]" />
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#FFFDF9]">
        <section className="mx-auto max-w-[900px] px-5 py-20 text-center md:px-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF1F2] text-3xl">
            🛒
          </div>

          <h1 className="mt-6 text-3xl font-bold md:text-4xl">
            Your cart is empty
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-[#756B67]">
            Browse our wedding invitation collection and add your
            favorite designs to begin your order.
          </p>

          <a
            href="/products"
            className="mt-7 inline-block rounded-full bg-[#8B2E3F] px-7 py-3.5 font-semibold text-white transition hover:bg-[#712433]"
          >
            Browse Wedding Cards
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFDF9]">
      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-8 lg:px-16 lg:py-14">
        <div className="flex flex-col gap-5 border-b border-[#EDE7DF] pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#8B2E3F]">
              Shopping Cart
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-5xl">
              Your Wedding Cards
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-[#756B67]">
              Review your designs, quantities and customization
              details before checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="w-fit rounded-full border border-[#D9CCC5] px-5 py-2.5 text-sm font-semibold text-[#756B67] transition hover:border-[#C94A4A] hover:text-[#C94A4A]"
          >
            Clear Cart
          </button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="space-y-5">
            {cart.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-[#E8DDD6] bg-white"
              >
                <div className="grid gap-5 p-5 sm:grid-cols-[120px_1fr] md:p-6">
                  <a
                    href={`/products/${item.id}`}
                    className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-[#F0E4DC] text-center text-xs text-[#817672]"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        Product
                        <br />
                        Image
                      </>
                    )}
                  </a>

                  <div className="min-w-0">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8B2E3F]">
                          {item.category}
                        </p>

                        <a
                          href={`/products/${item.id}`}
                          className="mt-1 block"
                        >
                          <h2 className="text-xl font-bold">
                            {item.name}
                          </h2>
                        </a>

                        <p className="mt-2 text-sm text-[#756B67]">
                          ₹{item.price} per card
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="w-fit text-sm font-semibold text-[#C94A4A]"
                      >
                        Remove
                      </button>
                    </div>

                    {item.customization ? (
                      <div className="mt-5 rounded-2xl border border-[#E9E1DA] bg-[#FFF8F4] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8B2E3F]">
                                Customized Invitation
                              </p>

                              <span className="rounded-full bg-[#EAF4EC] px-2 py-1 text-[9px] font-bold uppercase text-[#3E6D46]">
                                Saved
                              </span>
                            </div>

                            <p className="mt-2 font-bold">
                              {item.customization.brideName} &{" "}
                              {item.customization.groomName}
                            </p>
                          </div>

                          <a
                            href={`/customize?product=${item.id}&from=cart`}
                            className="rounded-full border border-[#8B2E3F] px-4 py-2 text-xs font-semibold text-[#8B2E3F]"
                          >
                            Edit
                          </a>
                        </div>

                        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-[#817672]">
                              Ceremony
                            </p>

                            <p className="mt-1 font-semibold">
                              {item.customization.religion}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-[#817672]">
                              Language
                            </p>

                            <p className="mt-1 font-semibold">
                              {item.customization.language}
                            </p>
                          </div>

                          {item.customization.weddingDate && (
                            <div>
                              <p className="text-xs text-[#817672]">
                                Wedding Date
                              </p>

                              <p className="mt-1 font-semibold">
                                {formatWeddingDate(
                                  item.customization.weddingDate
                                )}
                              </p>
                            </div>
                          )}

                          {item.customization.weddingTime && (
                            <div>
                              <p className="text-xs text-[#817672]">
                                Wedding Time
                              </p>

                              <p className="mt-1 font-semibold">
                                {formatWeddingTime(
                                  item.customization.weddingTime
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        {item.customization.venue && (
                          <div className="mt-4">
                            <p className="text-xs text-[#817672]">
                              Venue
                            </p>

                            <p className="mt-1 text-sm leading-6 text-[#514946]">
                              {item.customization.venue}
                            </p>
                          </div>
                        )}

                        {item.customization.message && (
                          <div className="mt-4">
                            <p className="text-xs text-[#817672]">
                              Invitation Message
                            </p>

                            <p className="mt-1 text-sm leading-6 text-[#514946]">
                              {item.customization.message}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-dashed border-[#D9CCC5] bg-[#FFFCFA] p-4">
                        <p className="text-sm font-semibold">
                          Want to personalize this card?
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#756B67]">
                          Add bride and groom names, wedding date,
                          venue and invitation message.
                        </p>

                        <a
                          href={`/customize?product=${item.id}&from=cart`}
                          className="mt-3 inline-block text-sm font-semibold text-[#8B2E3F]"
                        >
                          Customize Card →
                        </a>
                      </div>
                    )}

                    <div className="mt-5 flex flex-col gap-4 border-t border-[#EEE4DE] pt-5 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#817672]">
                          Quantity
                        </p>

                        <div className="mt-2 flex w-fit items-center rounded-full border border-[#DDD2CB] bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(item.id)
                            }
                            disabled={
                              item.quantity <=
                              (item.minimumOrder ?? 100)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            −
                          </button>

                          <span className="min-w-[70px] px-3 text-center text-sm font-bold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(item.id)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold"
                          >
                            +
                          </button>
                        </div>

                        <p className="mt-2 text-[11px] text-[#817672]">
                          Quantity changes by{" "}
                          {item.minimumOrder ?? 100} cards.
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-xs text-[#817672]">
                          Item Total
                        </p>

                        <p className="mt-1 text-xl font-bold text-[#8B2E3F]">
                          ₹
                          {(
                            item.price * item.quantity
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <a
              href="/products"
              className="inline-block rounded-full border border-[#DDD2CB] px-6 py-3 font-semibold text-[#514946] transition hover:border-[#8B2E3F] hover:text-[#8B2E3F]"
            >
              ← Continue Shopping
            </a>
          </section>

          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-3xl border border-[#E8DDD6] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                Checkout
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#756B67]">
                    Designs
                  </span>

                  <span className="font-semibold">
                    {cart.length}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#756B67]">
                    Total Cards
                  </span>

                  <span className="font-semibold">
                    {totalCards}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#756B67]">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#756B67]">
                    Delivery
                  </span>

                  <span className="font-semibold">
                    ₹{delivery.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="my-6 h-px bg-[#EEE4DE]" />

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">
                    Total
                  </p>

                  <p className="mt-1 text-xs text-[#817672]">
                    Inclusive of delivery
                  </p>
                </div>

                <p className="text-2xl font-bold text-[#8B2E3F]">
                  ₹{total.toLocaleString("en-IN")}
                </p>
              </div>

              <a
                href="/checkout"
                className="mt-6 block rounded-full bg-[#8B2E3F] px-6 py-3.5 text-center font-semibold text-white transition hover:bg-[#712433]"
              >
                Proceed to Checkout
              </a>

              <a
                href="/products"
                className="mt-3 block rounded-full border border-[#DDD2CB] px-6 py-3.5 text-center text-sm font-semibold text-[#514946]"
              >
                Continue Shopping
              </a>

              <div className="mt-6 rounded-2xl bg-[#FFF8F4] p-4">
                <p className="text-sm font-bold">
                  Secure Checkout
                </p>

                <p className="mt-1 text-xs leading-5 text-[#756B67]">
                  Review your delivery details and payment method
                  before placing your order.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}