"use client";

import { useEffect, useMemo, useState } from "react";

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

type OrderItem = {
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

type OrderSummary = {
  subtotal: number;
  delivery: number;
  total: number;
};

type Order = {
  id: string;
  customer: Customer;
  paymentMethod: string;
  summary: OrderSummary;
  items: OrderItem[];
  status: string;
  createdAt: string;
};

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedOrder = localStorage.getItem("wedinvite-last-order");

    if (savedOrder) {
      try {
        setOrder(JSON.parse(savedOrder));
      } catch {
        setOrder(null);
      }
    }

    setLoaded(true);
  }, []);

  const totalCards = useMemo(() => {
    if (!order) {
      return 0;
    }

    return order.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [order]);

  const isCashOnDelivery = useMemo(() => {
    if (!order) {
      return false;
    }

    const method = order.paymentMethod.toLowerCase();

    return (
      method.includes("cash on delivery") ||
      method.includes("cod")
    );
  }, [order]);

  function formatOrderDate(value: string) {
    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatWeddingDate(value: string) {
    if (!value) {
      return "";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
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

    date.setHours(Number(hours), Number(minutes));

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (!loaded) {
    return <main className="min-h-screen bg-[#FFFDF9]" />;
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#FFFDF9]">
        <section className="mx-auto max-w-[900px] px-5 py-20 text-center md:px-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F8ECEE] text-3xl">
            📦
          </div>

          <h1 className="mt-6 text-3xl font-bold md:text-4xl">
            No recent order found
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-[#756B67]">
            Place an order first and your confirmation details will appear here.
          </p>

          <a
            href="/products"
            className="mt-7 inline-block rounded-full bg-[#8B2E3F] px-7 py-3.5 font-semibold text-white"
          >
            Browse Wedding Cards
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFDF9]">
      <section className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 lg:px-12 lg:py-16">

        {/* SUCCESS HERO */}
        <div className="rounded-[32px] border border-[#E8DDD6] bg-white px-5 py-10 text-center shadow-sm md:px-10 md:py-14">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF4EC]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3E6D46] text-2xl font-bold text-white">
              ✓
            </div>
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#8B2E3F]">
            Order Confirmed
          </p>

          <h1 className="mt-2 text-3xl font-bold md:text-5xl">
            Thank you, {order.customer.fullName}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-[#756B67]">
            {isCashOnDelivery
              ? "Your wedding invitation order has been placed successfully. Payment will be collected according to the Cash on Delivery terms."
              : "Your wedding invitation order has been placed successfully. You can track the order anytime from your account."}
          </p>

          <div className="mx-auto mt-7 flex max-w-xl flex-wrap justify-center gap-3">
            <div className="rounded-full bg-[#FFF8F4] px-5 py-2.5 text-sm">
              Order ID:{" "}
              <span className="font-bold text-[#8B2E3F]">
                #{order.id}
              </span>
            </div>

            <div className="rounded-full bg-[#FFF8F4] px-5 py-2.5 text-sm font-semibold">
              {order.status}
            </div>
          </div>
        </div>

        {/* ORDER META */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E8DDD6] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#817672]">
              Order ID
            </p>

            <p className="mt-2 font-bold">
              #{order.id}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8DDD6] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#817672]">
              Order Date
            </p>

            <p className="mt-2 text-sm font-bold leading-6">
              {formatOrderDate(order.createdAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8DDD6] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#817672]">
              Payment
            </p>

            <p className="mt-2 text-sm font-bold">
              {order.paymentMethod}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8DDD6] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#817672]">
              Total Cards
            </p>

            <p className="mt-2 font-bold">
              {totalCards}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* LEFT */}
          <div className="space-y-8">

            {/* ORDER ITEMS */}
            <section className="rounded-3xl border border-[#E8DDD6] bg-white p-5 md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                    Your Order
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Wedding Invitation Designs
                  </h2>
                </div>

                <span className="rounded-full bg-[#FFF8F4] px-4 py-2 text-xs font-semibold">
                  {order.items.length}{" "}
                  {order.items.length === 1 ? "design" : "designs"}
                </span>
              </div>

              <div className="mt-6 space-y-6">
                {order.items.map((item) => (
                  <article
                    key={item.id}
                    className="border-b border-[#EEE4DE] pb-6 last:border-b-0 last:pb-0"
                  >
                    <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-[#F0E4DC] text-center text-[10px] text-[#817672]">
                        Product Image
                      </div>

                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8B2E3F]">
                              {item.category}
                            </p>

                            <h3 className="mt-1 text-lg font-bold">
                              {item.name}
                            </h3>

                            <p className="mt-2 text-sm text-[#756B67]">
                              {item.quantity} cards × ₹{item.price}
                            </p>
                          </div>

                          <p className="text-lg font-bold text-[#8B2E3F]">
                            ₹
                            {(item.quantity * item.price).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>

                        {item.customization && (
                          <div className="mt-4 rounded-2xl bg-[#FFF8F4] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8B2E3F]">
                                  Customized Invitation
                                </p>

                                <p className="mt-1 font-bold">
                                  {item.customization.brideName}{" "}
                                  &{" "}
                                  {item.customization.groomName}
                                </p>
                              </div>

                              <span className="rounded-full bg-[#EAF4EC] px-3 py-1 text-[10px] font-bold text-[#3E6D46]">
                                Saved
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
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

                                <p className="mt-1 text-sm italic leading-6 text-[#756B67]">
                                  “{item.customization.message}”
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* DELIVERY */}
            <section className="rounded-3xl border border-[#E8DDD6] bg-white p-5 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                Delivery
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Delivery Address
              </h2>

              <div className="mt-5 rounded-2xl bg-[#FFF8F4] p-5">
                <p className="font-bold">
                  {order.customer.fullName}
                </p>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#756B67]">
                  {order.customer.address},{" "}
                  {order.customer.city},{" "}
                  {order.customer.state} -{" "}
                  {order.customer.pincode},{" "}
                  {order.customer.country}
                </p>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <p>
                    <span className="text-[#817672]">
                      Phone:
                    </span>{" "}
                    <span className="font-semibold">
                      +91 {order.customer.phone}
                    </span>
                  </p>

                  <p>
                    <span className="text-[#817672]">
                      Email:
                    </span>{" "}
                    <span className="font-semibold">
                      {order.customer.email}
                    </span>
                  </p>
                </div>

                {order.customer.instructions && (
                  <div className="mt-4 border-t border-[#E8DDD6] pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#817672]">
                      Delivery Instructions
                    </p>

                    <p className="mt-1 text-sm text-[#514946]">
                      {order.customer.instructions}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:h-fit">

            {/* PAYMENT SUMMARY */}
            <section className="rounded-3xl border border-[#E8DDD6] bg-white p-6">
              <h2 className="text-xl font-bold">
                Payment Summary
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#756B67]">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    ₹
                    {order.summary.subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#756B67]">
                    Delivery
                  </span>

                  <span className="font-semibold">
                    ₹
                    {order.summary.delivery.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#756B67]">
                    Payment Method
                  </span>

                  <span className="max-w-[170px] text-right font-semibold">
                    {order.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="my-5 h-px bg-[#EEE4DE]" />

              <div className="flex items-end justify-between gap-5">
                <div>
                  <span className="font-bold">
                    {isCashOnDelivery
                      ? "Amount Due"
                      : "Total Paid"}
                  </span>

                  {isCashOnDelivery && (
                    <p className="mt-1 text-xs text-[#756B67]">
                      Pay according to Cash on Delivery terms.
                    </p>
                  )}
                </div>

                <span className="text-2xl font-bold text-[#8B2E3F]">
                  ₹
                  {order.summary.total.toLocaleString("en-IN")}
                </span>
              </div>
            </section>

            {/* STATUS */}
            <section className="rounded-3xl border border-[#E8DDD6] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8B2E3F]">
                Current Status
              </p>

              <div className="mt-4 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF4EC] font-bold text-[#3E6D46]">
                  ✓
                </div>

                <div>
                  <p className="font-bold">
                    {order.status}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#756B67]">
                    Your order has been received and is ready for the next processing stage.
                  </p>
                </div>
              </div>
            </section>

            {/* ACTIONS */}
            <section className="rounded-3xl border border-[#E8DDD6] bg-white p-6">
              <h2 className="font-bold">
                What would you like to do?
              </h2>

              <a
                href="/track-order"
                className="mt-5 block w-full rounded-full bg-[#8B2E3F] px-6 py-3.5 text-center font-semibold text-white transition hover:bg-[#712433]"
              >
                Track My Order
              </a>

              <a
                href="/profile"
                className="mt-3 block w-full rounded-full border border-[#8B2E3F] px-6 py-3.5 text-center font-semibold text-[#8B2E3F]"
              >
                View My Orders
              </a>

              <a
                href="/whatsapp-support"
                className="mt-3 block w-full rounded-full border border-[#DDD2CB] px-6 py-3.5 text-center font-semibold text-[#514946]"
              >
                Get Order Support
              </a>

              <a
                href="/products"
                className="mt-3 block w-full rounded-full border border-[#DDD2CB] px-6 py-3.5 text-center font-semibold text-[#514946]"
              >
                Continue Shopping
              </a>
            </section>
          </aside>
        </div>

        {/* FINAL NOTE */}
        <div className="mt-8 rounded-3xl bg-[#8B2E3F] px-5 py-8 text-center text-white md:px-8">
          <h2 className="text-2xl font-bold">
            Your celebration starts here
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white/80">
            We’ll keep your order details available in your account so you can review and track your wedding invitations anytime.
          </p>
        </div>
      </section>
    </main>
  );
}