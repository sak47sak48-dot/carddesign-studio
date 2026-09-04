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

type Order = {
  id: string;
  customer: Customer;
  paymentMethod: string;
  summary: {
    subtotal: number;
    delivery: number;
    total: number;
  };
  items: OrderItem[];
  status: string;
  createdAt: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  customization?: Customization;
};

type Tab =
  | "orders"
  | "wishlist"
  | "addresses"
  | "payments"
  | "settings"
  | "support";

const tabs: {
  id: Tab;
  label: string;
  icon: string;
}[] = [
  {
    id: "orders",
    label: "My Orders",
    icon: "📦",
  },
  {
    id: "wishlist",
    label: "Saved Designs",
    icon: "♡",
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: "📍",
  },
  {
    id: "payments",
    label: "Payment Methods",
    icon: "💳",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "⚙️",
  },
  {
    id: "support",
    label: "Help & Support",
    icon: "💬",
  },
];

function notifyStorageChange() {
  window.dispatchEvent(
    new Event("wedinvite-storage")
  );
}

export default function ProfilePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [wishlistCount, setWishlistCount] =
    useState(0);

  const [activeTab, setActiveTab] =
    useState<Tab>("orders");

  const [loaded, setLoaded] =
    useState(false);

  useEffect(() => {
    try {
      const savedOrders =
        localStorage.getItem(
          "wedinvite-orders"
        );

      if (savedOrders) {
        setOrders(
          JSON.parse(savedOrders)
        );
      }
    } catch {
      setOrders([]);
    }

    try {
      const savedCustomer =
        localStorage.getItem(
          "wedinvite-customer"
        );

      if (savedCustomer) {
        setCustomer(
          JSON.parse(savedCustomer)
        );
      }
    } catch {
      setCustomer(null);
    }

    try {
      const savedWishlist =
        localStorage.getItem(
          "wedinvite-wishlist"
        );

      if (savedWishlist) {
        const wishlist: string[] =
          JSON.parse(savedWishlist);

        setWishlistCount(
          wishlist.length
        );
      }
    } catch {
      setWishlistCount(0);
    }

    setLoaded(true);
  }, []);

  const totalOrders =
    orders.length;

  const totalSpent = useMemo(() => {
    return orders.reduce(
      (total, order) =>
        total +
        order.summary.total,
      0
    );
  }, [orders]);

  const totalCards = useMemo(() => {
    return orders.reduce(
      (orderTotal, order) =>
        orderTotal +
        order.items.reduce(
          (itemTotal, item) =>
            itemTotal +
            item.quantity,
          0
        ),
      0
    );
  }, [orders]);

  function getInitials() {
    if (
      !customer?.fullName
    ) {
      return "WI";
    }

    const names =
      customer.fullName
        .trim()
        .split(/\s+/);

    if (
      names.length === 1
    ) {
      return names[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      names[0][0] +
      names[
        names.length - 1
      ][0]
    ).toUpperCase();
  }

  function formatOrderDate(
    value: string
  ) {
    return new Date(
      value
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatWeddingDate(
    value: string
  ) {
    if (!value) {
      return "";
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function trackOrder(
    order: Order
  ) {
    localStorage.setItem(
      "wedinvite-last-order",
      JSON.stringify(order)
    );

    window.location.href =
      "/track-order";
  }

  function buyAgain(
    order: Order
  ) {
    const savedCart =
      localStorage.getItem(
        "wedinvite-cart"
      );

    let cart: CartItem[] =
      [];

    try {
      if (savedCart) {
        cart =
          JSON.parse(
            savedCart
          );
      }
    } catch {
      cart = [];
    }

    const updatedCart = [
      ...cart,
    ];

    order.items.forEach(
      (orderItem) => {
        const existingIndex =
          updatedCart.findIndex(
            (cartItem) =>
              cartItem.id ===
              orderItem.id
          );

        if (
          existingIndex >= 0
        ) {
          updatedCart[
            existingIndex
          ] = {
            ...updatedCart[
              existingIndex
            ],
            quantity:
              updatedCart[
                existingIndex
              ].quantity +
              orderItem.quantity,
            customization:
              orderItem.customization ||
              updatedCart[
                existingIndex
              ].customization,
          };
        } else {
          updatedCart.push({
            ...orderItem,
          });
        }
      }
    );

    localStorage.setItem(
      "wedinvite-cart",
      JSON.stringify(
        updatedCart
      )
    );

    notifyStorageChange();

    window.location.href =
      "/cart";
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#FFFDF9]" />
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#FFFDF9]">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-5 md:px-8 md:py-10 lg:px-12 xl:px-16 xl:py-14">

        {/* PAGE HEADER */}
        <div className="mb-7 min-w-0 md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B2E3F] sm:text-sm">
            My Account
          </p>

          <h1 className="mt-2 break-words text-[30px] font-bold leading-[1.1] text-[#2B2523] sm:text-4xl md:text-[42px]">
            Account Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#756B67] sm:text-base sm:leading-7">
            Manage your wedding card orders,
            saved designs, delivery details
            and account preferences.
          </p>
        </div>

        {/* PROFILE */}
        <div className="mb-7 grid w-full min-w-0 gap-4 md:mb-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-5">

          <div className="flex min-w-0 flex-col gap-4 rounded-[24px] border border-[#E8DDD6] bg-white p-5 sm:flex-row sm:items-center md:p-6">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#8B2E3F] text-xl font-bold text-white sm:h-20 sm:w-20 sm:text-2xl">
              {getInitials()}
            </div>

            <div className="w-full min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B2E3F] sm:text-xs">
                Customer Profile
              </p>

              <h2 className="mt-1 break-words text-xl font-bold leading-tight text-[#2B2523] sm:text-2xl">
                {customer?.fullName ||
                  "Welcome to carddesign.studio"}
              </h2>

              {customer ? (
                <div className="mt-2 min-w-0 space-y-1 text-sm text-[#756B67] sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-1 sm:space-y-0">
                  <p className="break-words">
                    +91{" "}
                    {customer.phone}
                  </p>

                  <p className="break-all">
                    {customer.email}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-[#756B67]">
                  Your account details will
                  appear after checkout.
                </p>
              )}
            </div>
          </div>

          <a
            href="/products"
            className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#8B2E3F] px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[#712433] md:w-auto md:min-w-[190px] md:rounded-3xl md:px-7 md:py-5 md:text-base"
          >
            Shop New Designs →
          </a>
        </div>

        {/* STATS */}
        <div className="mb-7 grid w-full min-w-0 grid-cols-2 gap-3 sm:gap-4 md:mb-8 lg:grid-cols-4">

          <div className="min-w-0 rounded-2xl border border-[#E8DDD6] bg-white p-4 sm:p-5">
            <p className="break-words text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-[#817672] sm:text-xs">
              Orders
            </p>

            <p className="mt-2 text-2xl font-bold">
              {totalOrders}
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-[#E8DDD6] bg-white p-4 sm:p-5">
            <p className="break-words text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-[#817672] sm:text-xs">
              Cards Ordered
            </p>

            <p className="mt-2 text-2xl font-bold">
              {totalCards}
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-[#E8DDD6] bg-white p-4 sm:p-5">
            <p className="break-words text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-[#817672] sm:text-xs">
              Saved Designs
            </p>

            <p className="mt-2 text-2xl font-bold">
              {wishlistCount}
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-[#E8DDD6] bg-white p-4 sm:p-5">
            <p className="break-words text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-[#817672] sm:text-xs">
              Total Spend
            </p>

            <p className="mt-2 break-words text-lg font-bold text-[#8B2E3F] sm:text-xl md:text-2xl">
              ₹
              {totalSpent.toLocaleString(
                "en-IN"
              )}
            </p>
          </div>
        </div>

        {/* ACCOUNT BODY */}
        <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-8">

          {/* TABS */}
          <aside className="w-full min-w-0 lg:sticky lg:top-28 lg:h-fit">
            <div className="w-full min-w-0 border-y border-[#E8DDD6] bg-white py-2 lg:overflow-hidden lg:rounded-3xl lg:border lg:p-3">

              <div className="scrollbar-hide flex w-full max-w-full gap-2 overflow-x-auto overscroll-x-contain px-0 pb-1 lg:flex-col lg:overflow-visible lg:pb-0">

                {tabs.map(
                  (tab) => {
                    const selected =
                      activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            tab.id
                          )
                        }
                        className={`flex min-h-[46px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition lg:w-full lg:justify-start lg:rounded-2xl lg:px-4 lg:py-3.5 ${
                          selected
                            ? "bg-[#8B2E3F] text-white"
                            : "bg-[#FFFDFC] text-[#514946] hover:bg-[#FFF8F4]"
                        }`}
                      >
                        <span className="text-base">
                          {tab.icon}
                        </span>

                        <span>
                          {tab.label}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <div className="w-full min-w-0">

            {/* ORDERS */}
            {activeTab === "orders" && (
              <section className="w-full min-w-0">

                <div className="mb-5 flex min-w-0 flex-wrap items-end justify-between gap-3 md:mb-6">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                      Order History
                    </p>

                    <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                      My Orders
                    </h2>
                  </div>

                  <span className="shrink-0 rounded-full bg-[#FFF1F2] px-4 py-2 text-xs font-semibold text-[#8B2E3F]">
                    {orders.length}{" "}
                    {orders.length === 1
                      ? "order"
                      : "orders"}
                  </span>
                </div>

                {orders.length === 0 ? (
                  <div className="w-full rounded-3xl border border-[#E8DDD6] bg-white px-5 py-12 text-center sm:py-16">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF1F2] text-2xl">
                      📦
                    </div>

                    <h3 className="mt-5 text-xl font-bold">
                      No orders yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#756B67]">
                      Your wedding invitation
                      orders will appear here
                      after checkout.
                    </p>

                    <a
                      href="/products"
                      className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#8B2E3F] px-6 py-3 text-sm font-semibold text-white"
                    >
                      Browse Wedding Cards
                    </a>
                  </div>
                ) : (
                  <div className="w-full min-w-0 space-y-5 sm:space-y-6">
                    {orders.map(
                      (order) => (
                        <article
                          key={order.id}
                          className="w-full min-w-0 overflow-hidden rounded-3xl border border-[#E8DDD6] bg-white"
                        >

                          {/* ORDER HEADER */}
                          <div className="border-b border-[#EEE4DE] bg-[#FFFDFC] p-4 sm:p-5 md:p-6">

                            <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">

                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#817672]">
                                  Order
                                </p>

                                <p className="mt-1 break-all text-sm font-bold sm:text-base">
                                  #{order.id}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#817672]">
                                  Date
                                </p>

                                <p className="mt-1 text-sm font-semibold">
                                  {formatOrderDate(
                                    order.createdAt
                                  )}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#817672]">
                                  Total
                                </p>

                                <p className="mt-1 break-words text-sm font-bold text-[#8B2E3F] sm:text-base">
                                  ₹
                                  {order.summary.total.toLocaleString(
                                    "en-IN"
                                  )}
                                </p>
                              </div>
                            </div>

                            <span className="mt-4 inline-flex rounded-full bg-[#EAF4EC] px-4 py-2 text-xs font-bold text-[#3E6D46]">
                              {order.status}
                            </span>
                          </div>

                          {/* ORDER ITEMS */}
                          <div className="space-y-5 p-4 sm:p-5 md:p-6">

                            {order.items.map(
                              (item) => (
                                <div
                                  key={item.id}
                                  className="grid min-w-0 gap-4 border-b border-[#EEE4DE] pb-5 last:border-b-0 last:pb-0 sm:grid-cols-[90px_minmax(0,1fr)]"
                                >

                                  <div className="flex h-[120px] w-full items-center justify-center rounded-2xl bg-[#F0E4DC] text-center text-[9px] text-[#817672] sm:h-auto sm:aspect-[4/5]">
                                    Product
                                  </div>

                                  <div className="min-w-0">

                                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                                      <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8B2E3F]">
                                          {
                                            item.category
                                          }
                                        </p>

                                        <h3 className="mt-1 break-words font-bold">
                                          {
                                            item.name
                                          }
                                        </h3>

                                        <p className="mt-1 text-sm text-[#756B67]">
                                          {
                                            item.quantity
                                          }{" "}
                                          cards × ₹
                                          {
                                            item.price
                                          }
                                        </p>
                                      </div>

                                      <p className="shrink-0 font-bold text-[#8B2E3F]">
                                        ₹
                                        {(
                                          item.price *
                                          item.quantity
                                        ).toLocaleString(
                                          "en-IN"
                                        )}
                                      </p>
                                    </div>

                                    {item.customization && (
                                      <div className="mt-3 min-w-0 rounded-2xl bg-[#FFF8F4] p-4">

                                        <p className="break-words text-xs font-bold text-[#8B2E3F]">
                                          {
                                            item.customization
                                              .brideName
                                          }{" "}
                                          &{" "}
                                          {
                                            item.customization
                                              .groomName
                                          }
                                        </p>

                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#756B67]">
                                          <span>
                                            {
                                              item.customization
                                                .religion
                                            }
                                          </span>

                                          <span>
                                            {
                                              item.customization
                                                .language
                                            }
                                          </span>

                                          {item.customization
                                            .weddingDate && (
                                            <span>
                                              {formatWeddingDate(
                                                item.customization
                                                  .weddingDate
                                              )}
                                            </span>
                                          )}
                                        </div>

                                        {item.customization
                                          .venue && (
                                          <p className="mt-2 break-words text-xs leading-5 text-[#756B67]">
                                            {
                                              item.customization
                                                .venue
                                            }
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          {/* ORDER ACTIONS */}
                          <div className="grid gap-2.5 border-t border-[#EEE4DE] bg-[#FFFDFC] p-4 sm:flex sm:flex-wrap sm:p-5 md:p-6">

                            <button
                              type="button"
                              onClick={() =>
                                trackOrder(
                                  order
                                )
                              }
                              className="min-h-[46px] w-full rounded-full bg-[#8B2E3F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#712433] sm:w-auto"
                            >
                              Track Order
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                buyAgain(
                                  order
                                )
                              }
                              className="min-h-[46px] w-full rounded-full border border-[#8B2E3F] px-5 py-3 text-sm font-semibold text-[#8B2E3F] sm:w-auto"
                            >
                              Buy Again
                            </button>

                            <a
                              href="/whatsapp-support"
                              className="flex min-h-[46px] w-full items-center justify-center rounded-full border border-[#DDD2CB] px-5 py-3 text-center text-sm font-semibold text-[#514946] sm:w-auto"
                            >
                              Get Help
                            </a>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                )}
              </section>
            )}

            {/* WISHLIST */}
            {activeTab === "wishlist" && (
              <section className="w-full min-w-0 rounded-3xl border border-[#E8DDD6] bg-white p-5 sm:p-6 md:p-8">

                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                  Favorites
                </p>

                <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                  Saved Designs
                </h2>

                <div className="mt-6 rounded-2xl bg-[#FFF8F4] p-5">
                  <p className="font-semibold">
                    {wishlistCount} saved{" "}
                    {wishlistCount === 1
                      ? "design"
                      : "designs"}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#756B67]">
                    View all the wedding
                    invitation cards you saved
                    while browsing.
                  </p>
                </div>

                <a
                  href="/wishlist"
                  className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#8B2E3F] px-6 py-3 text-sm font-semibold text-white"
                >
                  Open Saved Designs
                </a>
              </section>
            )}

            {/* ADDRESS */}
            {activeTab === "addresses" && (
              <section className="w-full min-w-0">

                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                  Delivery
                </p>

                <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                  Saved Address
                </h2>

                {customer ? (
                  <div className="mt-6 w-full min-w-0 rounded-3xl border border-[#E8DDD6] bg-white p-5 sm:p-6 md:p-8">

                    <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-[#FFF1F2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8B2E3F]">
                          Default
                        </span>

                        <h3 className="mt-4 break-words text-lg font-bold">
                          {
                            customer.fullName
                          }
                        </h3>

                        <p className="mt-2 max-w-xl break-words text-sm leading-6 text-[#756B67]">
                          {
                            customer.address
                          }
                          ,{" "}
                          {
                            customer.city
                          }
                          ,{" "}
                          {
                            customer.state
                          }{" "}
                          -{" "}
                          {
                            customer.pincode
                          }
                          ,{" "}
                          {
                            customer.country
                          }
                        </p>

                        <p className="mt-3 text-sm font-semibold">
                          +91{" "}
                          {
                            customer.phone
                          }
                        </p>
                      </div>

                      <a
                        href="/checkout"
                        className="flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-full border border-[#8B2E3F] px-5 py-2.5 text-sm font-semibold text-[#8B2E3F] sm:w-auto"
                      >
                        Edit Address
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-3xl border border-[#E8DDD6] bg-white p-6 sm:p-8">
                    <p className="font-semibold">
                      No saved address
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#756B67]">
                      Your delivery address
                      will appear after checkout.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* PAYMENTS */}
            {activeTab === "payments" && (
              <section className="w-full min-w-0 rounded-3xl border border-[#E8DDD6] bg-white p-5 sm:p-6 md:p-8">

                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                  Payments
                </p>

                <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                  Payment Methods
                </h2>

                <div className="mt-6 rounded-2xl border border-dashed border-[#D8CAC2] bg-[#FFF8F4] p-5 sm:p-6">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl">
                    💳
                  </div>

                  <h3 className="mt-4 font-bold">
                    Secure Payments Coming Next
                  </h3>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#756B67]">
                    We’ll connect Razorpay later
                    for secure UPI, credit card,
                    debit card, net banking and
                    supported wallet payments.
                  </p>
                </div>
              </section>
            )}

            {/* SETTINGS */}
            {activeTab === "settings" && (
              <section className="w-full min-w-0 rounded-3xl border border-[#E8DDD6] bg-white p-5 sm:p-6 md:p-8">

                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                  Account
                </p>

                <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                  Settings
                </h2>

                <div className="mt-7 divide-y divide-[#EEE4DE]">

                  <div className="flex flex-col gap-4 py-5 first:pt-0 sm:flex-row sm:items-center sm:justify-between">

                    <div className="min-w-0">
                      <p className="font-semibold">
                        Account Login
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#756B67]">
                        Secure login and user
                        accounts will use
                        Supabase Auth.
                      </p>
                    </div>

                    <span className="w-fit shrink-0 rounded-full bg-[#FFF1F2] px-3 py-1 text-xs font-semibold text-[#8B2E3F]">
                      Coming Soon
                    </span>
                  </div>

                  <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="min-w-0">
                      <p className="font-semibold">
                        Order Notifications
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#756B67]">
                        Receive updates when
                        printing and delivery
                        status changes.
                      </p>
                    </div>

                    <span className="w-fit shrink-0 rounded-full bg-[#FFF1F2] px-3 py-1 text-xs font-semibold text-[#8B2E3F]">
                      Coming Soon
                    </span>
                  </div>

                  <div className="flex flex-col gap-4 py-5 last:pb-0 sm:flex-row sm:items-center sm:justify-between">

                    <div className="min-w-0">
                      <p className="font-semibold">
                        WhatsApp Updates
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#756B67]">
                        Order confirmation and
                        support through WhatsApp.
                      </p>
                    </div>

                    <a
                      href="/whatsapp-support"
                      className="flex min-h-[42px] w-fit shrink-0 items-center justify-center rounded-full border border-[#8B2E3F] px-4 py-2 text-xs font-semibold text-[#8B2E3F]"
                    >
                      Open Support
                    </a>
                  </div>
                </div>
              </section>
            )}

            {/* SUPPORT */}
            {activeTab === "support" && (
              <section className="w-full min-w-0">

                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                  Customer Care
                </p>

                <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                  Help & Support
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#756B67]">
                  Need help with a wedding
                  invitation, customization,
                  printing or delivery?
                </p>

                <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">

                  <div className="min-w-0 rounded-3xl bg-[#8B2E3F] p-5 text-white sm:p-6">

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl">
                      💬
                    </div>

                    <h3 className="mt-5 text-xl font-bold">
                      WhatsApp Support
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/80">
                      Chat with us for card
                      customization, order
                      questions and support.
                    </p>

                    <a
                      href="/whatsapp-support"
                      className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#8B2E3F]"
                    >
                      WhatsApp Us
                    </a>
                  </div>

                  <div className="min-w-0 rounded-3xl border border-[#E8DDD6] bg-white p-5 sm:p-6">

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1F2] text-xl">
                      ✉️
                    </div>

                    <h3 className="mt-5 text-xl font-bold">
                      Email Support
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#756B67]">
                      Send us your order or
                      design questions by email.
                    </p>

                    <a
                      href="mailto:support@wedinvite.in"
                      className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#8B2E3F] px-5 py-2.5 text-sm font-semibold text-[#8B2E3F]"
                    >
                      Email Support
                    </a>
                  </div>
                </div>

                <div className="mt-6 min-w-0 rounded-3xl border border-[#E8DDD6] bg-[#FFF8F4] p-5 sm:p-6">

                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                    Quick Links
                  </p>

                  <div className="mt-4 grid gap-2.5 sm:flex sm:flex-wrap sm:gap-3">

                    <a
                      href="/track-order"
                      className="flex min-h-[44px] items-center justify-center rounded-full border border-[#D8CAC2] bg-white px-5 py-2.5 text-sm font-semibold"
                    >
                      Track Order
                    </a>

                    <a
                      href="/whatsapp-support"
                      className="flex min-h-[44px] items-center justify-center rounded-full border border-[#D8CAC2] bg-white px-5 py-2.5 text-sm font-semibold"
                    >
                      WhatsApp Support
                    </a>

                    <a
                      href="/products"
                      className="flex min-h-[44px] items-center justify-center rounded-full border border-[#D8CAC2] bg-white px-5 py-2.5 text-sm font-semibold"
                    >
                      Browse Cards
                    </a>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}