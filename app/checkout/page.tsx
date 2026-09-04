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

type CustomerErrors = {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  state?: string;
  country?: string;
};

const initialCustomer: Customer = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  pincode: "",
  state: "",
  country: "India",
  instructions: "",
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [loaded, setLoaded] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem("wedinvite-cart");

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        setCart([]);
      }
    }

    const savedCustomer = localStorage.getItem("wedinvite-customer");

    if (savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch {
        setCustomer(initialCustomer);
      }
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

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [cart]);

  const delivery = cart.length > 0 ? deliveryFee : 0;
  const total = subtotal + delivery;

  const totalCards = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cart]);

  function updateCustomer(
    field: keyof Customer,
    value: string
  ) {
    setCustomer((current) => ({
      ...current,
      [field]: value,
    }));

    if (
      field === "fullName" ||
      field === "phone" ||
      field === "email" ||
      field === "address" ||
      field === "city" ||
      field === "pincode" ||
      field === "state" ||
      field === "country"
    ) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  }

  function validateCustomer() {
    const newErrors: CustomerErrors = {};

    if (!customer.fullName.trim()) {
      newErrors.fullName = "Please enter your full name.";
    }

    const cleanPhone = customer.phone.replace(/\D/g, "");

    if (!cleanPhone) {
      newErrors.phone = "Please enter your phone number.";
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = "Enter a valid 10-digit mobile number.";
    } else if (!/^[6-9]/.test(cleanPhone)) {
      newErrors.phone = "Enter a valid Indian mobile number.";
    }

    if (!customer.email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(customer.email.trim())) {
        newErrors.email = "Enter a valid email address.";
      }
    }

    if (!customer.address.trim()) {
      newErrors.address = "Please enter your delivery address.";
    }

    if (!customer.city.trim()) {
      newErrors.city = "Please enter your city.";
    }

    const cleanPincode = customer.pincode.replace(/\D/g, "");

    if (!cleanPincode) {
      newErrors.pincode = "Please enter your PIN code.";
    } else if (cleanPincode.length !== 6) {
      newErrors.pincode = "Enter a valid 6-digit PIN code.";
    }

    if (!customer.state.trim()) {
      newErrors.state = "Please enter your state.";
    }

    if (!customer.country.trim()) {
      newErrors.country = "Please select your country.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function continueToPayment() {
    if (!validateCustomer()) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const cleanCustomer: Customer = {
      ...customer,
      fullName: customer.fullName.trim(),
      phone: customer.phone.replace(/\D/g, ""),
      email: customer.email.trim(),
      address: customer.address.trim(),
      city: customer.city.trim(),
      pincode: customer.pincode.replace(/\D/g, ""),
      state: customer.state.trim(),
      country: customer.country.trim(),
      instructions: customer.instructions.trim(),
    };

    localStorage.setItem(
      "wedinvite-customer",
      JSON.stringify(cleanCustomer)
    );

    localStorage.setItem(
      "wedinvite-order-summary",
      JSON.stringify({
        subtotal,
        delivery,
        total,
      })
    );

    window.location.href = "/payment";
  }

  function formatWeddingDate(value: string) {
    if (!value) {
      return "";
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
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

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#FFFDF9]" />
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#FFFDF9]">
        <section className="mx-auto max-w-[900px] px-5 py-20 text-center md:px-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F8ECEE] text-3xl">
            🛒
          </div>

          <h1 className="mt-6 text-3xl font-bold md:text-4xl">
            Your cart is empty
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-[#756B67]">
            Add wedding invitation designs to your cart before
            continuing to checkout.
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
      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-8 lg:px-16 lg:py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#8B2E3F]">
            Checkout
          </p>

          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Delivery Details
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-[#756B67]">
            Enter your contact and delivery information. We’ll use
            these details for your wedding invitation order.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
          <div className="rounded-3xl border border-[#E8DDD6] bg-white p-5 md:p-8">
            <div className="mb-7">
              <h2 className="text-xl font-bold">
                Customer Information
              </h2>

              <p className="mt-1 text-sm text-[#756B67]">
                Fields marked with * are required.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">
                  Full Name{" "}
                  <span className="text-[#C94A4A]">*</span>
                </label>

                <input
                  value={customer.fullName}
                  onChange={(e) =>
                    updateCustomer("fullName", e.target.value)
                  }
                  placeholder="Enter your full name"
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                    errors.fullName
                      ? "border-[#C94A4A] bg-[#FFF8F8]"
                      : "border-[#DDD2CB] focus:border-[#8B2E3F]"
                  }`}
                />

                {errors.fullName && (
                  <p className="mt-2 text-xs font-medium text-[#C94A4A]">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Mobile Number{" "}
                  <span className="text-[#C94A4A]">*</span>
                </label>

                <div
                  className={`flex overflow-hidden rounded-xl border ${
                    errors.phone
                      ? "border-[#C94A4A] bg-[#FFF8F8]"
                      : "border-[#DDD2CB]"
                  }`}
                >
                  <div className="flex items-center border-r border-[#DDD2CB] bg-[#FAF7F5] px-4 text-sm font-semibold">
                    +91
                  </div>

                  <input
                    inputMode="numeric"
                    maxLength={10}
                    value={customer.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");

                      updateCustomer("phone", value);
                    }}
                    placeholder="9876543210"
                    className="w-full bg-transparent px-4 py-3 outline-none"
                  />
                </div>

                {errors.phone && (
                  <p className="mt-2 text-xs font-medium text-[#C94A4A]">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Email Address{" "}
                  <span className="text-[#C94A4A]">*</span>
                </label>

                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) =>
                    updateCustomer("email", e.target.value)
                  }
                  placeholder="name@example.com"
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                    errors.email
                      ? "border-[#C94A4A] bg-[#FFF8F8]"
                      : "border-[#DDD2CB] focus:border-[#8B2E3F]"
                  }`}
                />

                {errors.email && (
                  <p className="mt-2 text-xs font-medium text-[#C94A4A]">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">
                  Delivery Address{" "}
                  <span className="text-[#C94A4A]">*</span>
                </label>

                <textarea
                  rows={3}
                  value={customer.address}
                  onChange={(e) =>
                    updateCustomer("address", e.target.value)
                  }
                  placeholder="House / Flat No, Street, Area"
                  className={`w-full resize-none rounded-xl border px-4 py-3 outline-none transition ${
                    errors.address
                      ? "border-[#C94A4A] bg-[#FFF8F8]"
                      : "border-[#DDD2CB] focus:border-[#8B2E3F]"
                  }`}
                />

                {errors.address && (
                  <p className="mt-2 text-xs font-medium text-[#C94A4A]">
                    {errors.address}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  City{" "}
                  <span className="text-[#C94A4A]">*</span>
                </label>

                <input
                  value={customer.city}
                  onChange={(e) =>
                    updateCustomer("city", e.target.value)
                  }
                  placeholder="Bengaluru"
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                    errors.city
                      ? "border-[#C94A4A] bg-[#FFF8F8]"
                      : "border-[#DDD2CB] focus:border-[#8B2E3F]"
                  }`}
                />

                {errors.city && (
                  <p className="mt-2 text-xs font-medium text-[#C94A4A]">
                    {errors.city}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  PIN Code{" "}
                  <span className="text-[#C94A4A]">*</span>
                </label>

                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={customer.pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");

                    updateCustomer("pincode", value);
                  }}
                  placeholder="560001"
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                    errors.pincode
                      ? "border-[#C94A4A] bg-[#FFF8F8]"
                      : "border-[#DDD2CB] focus:border-[#8B2E3F]"
                  }`}
                />

                {errors.pincode && (
                  <p className="mt-2 text-xs font-medium text-[#C94A4A]">
                    {errors.pincode}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  State{" "}
                  <span className="text-[#C94A4A]">*</span>
                </label>

                <input
                  value={customer.state}
                  onChange={(e) =>
                    updateCustomer("state", e.target.value)
                  }
                  placeholder="Karnataka"
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                    errors.state
                      ? "border-[#C94A4A] bg-[#FFF8F8]"
                      : "border-[#DDD2CB] focus:border-[#8B2E3F]"
                  }`}
                />

                {errors.state && (
                  <p className="mt-2 text-xs font-medium text-[#C94A4A]">
                    {errors.state}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Country{" "}
                  <span className="text-[#C94A4A]">*</span>
                </label>

                <select
                  value={customer.country}
                  onChange={(e) =>
                    updateCustomer("country", e.target.value)
                  }
                  className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition ${
                    errors.country
                      ? "border-[#C94A4A] bg-[#FFF8F8]"
                      : "border-[#DDD2CB] focus:border-[#8B2E3F]"
                  }`}
                >
                  <option value="India">
                    India
                  </option>
                </select>

                {errors.country && (
                  <p className="mt-2 text-xs font-medium text-[#C94A4A]">
                    {errors.country}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label className="text-sm font-semibold">
                    Delivery Instructions
                  </label>

                  <span className="text-xs text-[#817672]">
                    Optional
                  </span>
                </div>

                <textarea
                  rows={3}
                  maxLength={250}
                  value={customer.instructions}
                  onChange={(e) =>
                    updateCustomer("instructions", e.target.value)
                  }
                  placeholder="Example: Call before delivery"
                  className="w-full resize-none rounded-xl border border-[#DDD2CB] px-4 py-3 outline-none transition focus:border-[#8B2E3F]"
                />

                <p className="mt-1 text-right text-xs text-[#817672]">
                  {customer.instructions.length}/250
                </p>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-3xl border border-[#E8DDD6] bg-white p-6">
              <h2 className="text-2xl font-bold">
                Review Order
              </h2>

              <p className="mt-2 text-sm text-[#756B67]">
                {cart.length}{" "}
                {cart.length === 1 ? "design" : "designs"} ·{" "}
                {totalCards} cards
              </p>

              <div className="mt-6 max-h-[430px] space-y-5 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-[#EEE4DE] pb-5 last:border-b-0"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-xl bg-[#F0E4DC] text-center text-[9px] text-[#817672]">
                        Product
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8B2E3F]">
                          {item.category}
                        </p>

                        <h3 className="mt-1 font-bold">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-xs text-[#756B67]">
                          {item.quantity} cards × ₹{item.price}
                        </p>

                        <p className="mt-2 font-bold text-[#8B2E3F]">
                          ₹
                          {(
                            item.price * item.quantity
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {item.customization && (
                      <div className="mt-3 rounded-xl bg-[#FFF8F4] p-3">
                        <p className="text-xs font-bold text-[#8B2E3F]">
                          {item.customization.brideName} &{" "}
                          {item.customization.groomName}
                        </p>

                        <div className="mt-2 space-y-1 text-[11px] leading-5 text-[#756B67]">
                          {item.customization.weddingDate && (
                            <p>
                              {formatWeddingDate(
                                item.customization.weddingDate
                              )}

                              {item.customization.weddingTime &&
                                ` · ${formatWeddingTime(
                                  item.customization.weddingTime
                                )}`}
                            </p>
                          )}

                          <p>
                            {item.customization.religion} ·{" "}
                            {item.customization.language}
                          </p>

                          {item.customization.venue && (
                            <p>
                              {item.customization.venue}
                            </p>
                          )}
                        </div>

                        <a
                          href={`/customize?product=${item.id}&from=cart`}
                          className="mt-3 inline-block text-xs font-semibold text-[#8B2E3F]"
                        >
                          Edit Details →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#756B67]">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-[#756B67]">
                    Delivery
                  </span>

                  <span className="font-semibold">
                    ₹{delivery.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="my-5 h-px bg-[#EEE4DE]" />

              <div className="flex items-end justify-between">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-2xl font-bold text-[#8B2E3F]">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              <button
                type="button"
                onClick={continueToPayment}
                className="mt-7 w-full rounded-full bg-[#8B2E3F] px-6 py-3.5 font-semibold text-white transition hover:bg-[#712433]"
              >
                Continue to Payment
              </button>

              <a
                href="/cart"
                className="mt-3 block w-full rounded-full border border-[#8B2E3F] px-6 py-3.5 text-center font-semibold text-[#8B2E3F]"
              >
                Back to Cart
              </a>

              <div className="mt-5 rounded-2xl bg-[#FFF8F4] p-4">
                <p className="text-xs font-semibold">
                  Your information is used for this order
                </p>

                <p className="mt-1 text-xs leading-5 text-[#756B67]">
                  Your delivery details are saved locally until
                  the payment step. Order persistence is handled
                  through the connected backend flow.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}