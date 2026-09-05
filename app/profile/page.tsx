"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
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
    label: "Address",
    icon: "📍",
  },
  {
    id: "settings",
    label: "Account Settings",
    icon: "⚙️",
  },
  {
    id: "support",
    label: "Help & Support",
    icon: "💬",
  },
];

function notifyStorageChange() {
  window.dispatchEvent(new Event("wedinvite-storage"));
}

export default function ProfilePage() {
  const router = useRouter();

  const [loaded, setLoaded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageType, setProfileMessageType] = useState<
    "success" | "error" | ""
  >("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) {
          return;
        }

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        setUserId(user.id);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id,full_name,phone,email,address")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) {
          return;
        }

        if (profileError) {
          console.error("Profile load error:", profileError);
        }

        const resolvedProfile: ProfileRow = {
          id: user.id,
          full_name:
            profileData?.full_name ??
            (typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : ""),
          phone:
            profileData?.phone ??
            (typeof user.user_metadata?.phone === "string"
              ? user.user_metadata.phone
              : ""),
          email: profileData?.email ?? user.email ?? "",
          address: profileData?.address ?? "",
        };

        setProfile(resolvedProfile);
        setFullName(resolvedProfile.full_name ?? "");
        setPhone(resolvedProfile.phone ?? "");
        setAddress(resolvedProfile.address ?? "");

        try {
          const savedOrders = localStorage.getItem("wedinvite-orders");

          if (savedOrders) {
            setOrders(JSON.parse(savedOrders));
          }
        } catch {
          setOrders([]);
        }

        let localCustomer: Customer | null = null;

        try {
          const savedCustomer = localStorage.getItem("wedinvite-customer");

          if (savedCustomer) {
            localCustomer = JSON.parse(savedCustomer);
          }
        } catch {
          localCustomer = null;
        }

        const mergedCustomer: Customer = {
          fullName:
            resolvedProfile.full_name ||
            localCustomer?.fullName ||
            "",
          phone:
            resolvedProfile.phone ||
            localCustomer?.phone ||
            "",
          email:
            resolvedProfile.email ||
            localCustomer?.email ||
            "",
          address:
            resolvedProfile.address ||
            localCustomer?.address ||
            "",
          city: localCustomer?.city || "",
          pincode: localCustomer?.pincode || "",
          state: localCustomer?.state || "",
          country: localCustomer?.country || "India",
          instructions: localCustomer?.instructions || "",
        };

        setCustomer(mergedCustomer);

        try {
          localStorage.setItem(
            "wedinvite-customer",
            JSON.stringify(mergedCustomer)
          );
        } catch {
          // Ignore localStorage write errors.
        }

        try {
          const savedWishlist = localStorage.getItem("wedinvite-wishlist");

          if (savedWishlist) {
            const wishlist: string[] = JSON.parse(savedWishlist);
            setWishlistCount(wishlist.length);
          }
        } catch {
          setWishlistCount(0);
        }

        setLoaded(true);
      } catch (error) {
        console.error("Profile initialization error:", error);

        if (mounted) {
          router.replace("/login");
        }
      }
    }

    void loadAccount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const totalOrders = orders.length;

  const totalSpent = useMemo(() => {
    return orders.reduce((total, order) => {
      return total + Number(order.summary?.total || 0);
    }, 0);
  }, [orders]);

  const totalCards = useMemo(() => {
    return orders.reduce((orderTotal, order) => {
      return (
        orderTotal +
        order.items.reduce((itemTotal, item) => {
          return itemTotal + Number(item.quantity || 0);
        }, 0)
      );
    }, 0);
  }, [orders]);

  function getInitials() {
    const name = profile?.full_name || customer?.fullName || "";

    if (!name.trim()) {
      return "CD";
    }

    const names = name.trim().split(/\s+/);

    if (names.length === 1) {
      return names[0].slice(0, 2).toUpperCase();
    }

    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }

  function formatOrderDate(value: string) {
    if (!value) {
      return "";
    }

    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function trackOrder(order: Order) {
    localStorage.setItem("wedinvite-last-order", JSON.stringify(order));
    router.push("/track-order");
  }

  function buyAgain(order: Order) {
    const savedCart = localStorage.getItem("wedinvite-cart");

    let cart: CartItem[] = [];

    try {
      if (savedCart) {
        cart = JSON.parse(savedCart);
      }
    } catch {
      cart = [];
    }

    const updatedCart = [...cart];

    order.items.forEach((orderItem) => {
      const existingIndex = updatedCart.findIndex(
        (cartItem) => cartItem.id === orderItem.id
      );

      if (existingIndex >= 0) {
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity:
            updatedCart[existingIndex].quantity + orderItem.quantity,
          customization:
            orderItem.customization ||
            updatedCart[existingIndex].customization,
        };
      } else {
        updatedCart.push({
          ...orderItem,
        });
      }
    });

    localStorage.setItem(
      "wedinvite-cart",
      JSON.stringify(updatedCart)
    );

    notifyStorageChange();
    router.push("/cart");
  }

  async function saveProfile() {
    setProfileMessage("");
    setProfileMessageType("");

    if (!userId) {
      return;
    }

    if (!fullName.trim()) {
      setProfileMessage("Please enter your full name.");
      setProfileMessageType("error");
      return;
    }

    try {
      setSavingProfile(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
        })
        .eq("id", userId);

      if (error) {
        setProfileMessage(error.message);
        setProfileMessageType("error");
        return;
      }

      const updatedProfile: ProfileRow = {
        id: userId,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: profile?.email ?? customer?.email ?? "",
        address: address.trim(),
      };

      setProfile(updatedProfile);

      const updatedCustomer: Customer = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: updatedProfile.email ?? "",
        address: address.trim(),
        city: customer?.city ?? "",
        pincode: customer?.pincode ?? "",
        state: customer?.state ?? "",
        country: customer?.country ?? "India",
        instructions: customer?.instructions ?? "",
      };

      setCustomer(updatedCustomer);

      localStorage.setItem(
        "wedinvite-customer",
        JSON.stringify(updatedCustomer)
      );

      setProfileMessage("Profile updated successfully.");
      setProfileMessageType("success");
    } catch (error) {
      console.error("Profile update error:", error);
      setProfileMessage("Something went wrong. Please try again.");
      setProfileMessageType("error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await supabase.auth.signOut();

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFFDF9] px-4">
        <div className="rounded-3xl border border-[#E8DDD6] bg-white px-8 py-7 text-center shadow-sm">
          <p className="font-semibold text-[#8B2E3F]">
            Loading your account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#FFFDF9]">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-5 md:px-8 md:py-10 lg:px-12 xl:px-16 xl:py-14">
        <div className="mb-7 flex flex-col gap-5 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B2E3F] sm:text-sm">
              My Account
            </p>

            <h1 className="mt-2 text-[30px] font-bold leading-[1.1] text-[#2B2523] sm:text-4xl md:text-[42px]">
              Account Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#756B67] sm:text-base">
              Manage your account, wedding card orders, saved designs and
              delivery details.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="min-h-[46px] rounded-full border border-[#8B2E3F] px-6 py-3 text-sm font-semibold text-[#8B2E3F] transition hover:bg-[#FFF1F2] disabled:opacity-60"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        <div className="mb-7 grid gap-4 md:mb-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-col gap-4 rounded-[24px] border border-[#E8DDD6] bg-white p-5 sm:flex-row sm:items-center md:p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#8B2E3F] text-xl font-bold text-white sm:h-20 sm:w-20 sm:text-2xl">
              {getInitials()}
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                Customer Profile
              </p>

              <h2 className="mt-1 break-words text-xl font-bold text-[#2B2523] sm:text-2xl">
                {profile?.full_name || "carddesign.studio customer"}
              </h2>

              <div className="mt-2 space-y-1 text-sm text-[#756B67]">
                {profile?.email && (
                  <p className="break-all">{profile.email}</p>
                )}

                {profile?.phone && (
                  <p>{profile.phone}</p>
                )}
              </div>
            </div>
          </div>

          <a
            href="/products"
            className="flex min-h-[52px] items-center justify-center rounded-full bg-[#8B2E3F] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#712433]"
          >
            Shop New Designs →
          </a>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-3 sm:gap-4 md:mb-8 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E8DDD6] bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase text-[#817672]">
              Orders
            </p>

            <p className="mt-2 text-2xl font-bold">{totalOrders}</p>
          </div>

          <div className="rounded-2xl border border-[#E8DDD6] bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase text-[#817672]">
              Cards Ordered
            </p>

            <p className="mt-2 text-2xl font-bold">{totalCards}</p>
          </div>

          <div className="rounded-2xl border border-[#E8DDD6] bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase text-[#817672]">
              Saved Designs
            </p>

            <p className="mt-2 text-2xl font-bold">{wishlistCount}</p>
          </div>

          <div className="rounded-2xl border border-[#E8DDD6] bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase text-[#817672]">
              Total Spend
            </p>

            <p className="mt-2 text-xl font-bold text-[#8B2E3F] sm:text-2xl">
              ₹{totalSpent.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-8">
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="border-y border-[#E8DDD6] bg-white py-2 lg:rounded-3xl lg:border lg:p-3">
              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                {tabs.map((tab) => {
                  const selected = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex min-h-[46px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition lg:w-full lg:rounded-2xl ${
                        selected
                          ? "bg-[#8B2E3F] text-white"
                          : "bg-[#FFFDFC] text-[#514946] hover:bg-[#FFF8F4]"
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            {activeTab === "orders" && (
              <section>
                <div className="mb-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                      Order History
                    </p>

                    <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                      My Orders
                    </h2>
                  </div>

                  <span className="rounded-full bg-[#FFF1F2] px-4 py-2 text-xs font-semibold text-[#8B2E3F]">
                    {orders.length} {orders.length === 1 ? "order" : "orders"}
                  </span>
                </div>

                {orders.length === 0 ? (
                  <div className="rounded-3xl border border-[#E8DDD6] bg-white px-5 py-14 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF1F2] text-2xl">
                      📦
                    </div>

                    <h3 className="mt-5 text-xl font-bold">
                      No orders yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#756B67]">
                      Your wedding invitation orders will appear here after
                      checkout.
                    </p>

                    <a
                      href="/products"
                      className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#8B2E3F] px-6 py-3 text-sm font-semibold text-white"
                    >
                      Browse Wedding Cards
                    </a>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {orders.map((order) => (
                      <article
                        key={order.id}
                        className="overflow-hidden rounded-3xl border border-[#E8DDD6] bg-white"
                      >
                        <div className="border-b border-[#EEE4DE] bg-[#FFFDFC] p-5">
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div>
                              <p className="text-[10px] font-semibold uppercase text-[#817672]">
                                Order
                              </p>

                              <p className="mt-1 break-all text-sm font-bold">
                                #{order.id}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-semibold uppercase text-[#817672]">
                                Date
                              </p>

                              <p className="mt-1 text-sm font-semibold">
                                {formatOrderDate(order.createdAt)}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-semibold uppercase text-[#817672]">
                                Total
                              </p>

                              <p className="mt-1 text-sm font-bold text-[#8B2E3F]">
                                ₹
                                {Number(
                                  order.summary.total
                                ).toLocaleString("en-IN")}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-semibold uppercase text-[#817672]">
                                Status
                              </p>

                              <span className="mt-1 inline-flex rounded-full bg-[#EAF4EC] px-3 py-1 text-xs font-bold text-[#3E6D46]">
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 p-5">
                          {order.items.map((item, index) => (
                            <div
                              key={`${item.id}-${index}`}
                              className="flex flex-col gap-2 border-b border-[#EEE4DE] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-xs font-semibold uppercase text-[#8B2E3F]">
                                  {item.category}
                                </p>

                                <h3 className="mt-1 font-bold">
                                  {item.name}
                                </h3>

                                <p className="mt-1 text-sm text-[#756B67]">
                                  {item.quantity} × ₹{item.price}
                                </p>
                              </div>

                              <p className="font-bold text-[#8B2E3F]">
                                ₹
                                {(
                                  item.price * item.quantity
                                ).toLocaleString("en-IN")}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col gap-2 border-t border-[#EEE4DE] bg-[#FFFDFC] p-5 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => trackOrder(order)}
                            className="min-h-[44px] rounded-full bg-[#8B2E3F] px-5 py-2.5 text-sm font-semibold text-white"
                          >
                            Track Order
                          </button>

                          <button
                            type="button"
                            onClick={() => buyAgain(order)}
                            className="min-h-[44px] rounded-full border border-[#8B2E3F] px-5 py-2.5 text-sm font-semibold text-[#8B2E3F]"
                          >
                            Buy Again
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "wishlist" && (
              <section className="rounded-3xl border border-[#E8DDD6] bg-white p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                  Favorites
                </p>

                <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                  Saved Designs
                </h2>

                <div className="mt-6 rounded-2xl bg-[#FFF8F4] p-5">
                  <p className="font-semibold">
                    {wishlistCount} saved{" "}
                    {wishlistCount === 1 ? "design" : "designs"}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#756B67]">
                    Your saved wedding invitation designs are available in your
                    wishlist.
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

            {activeTab === "addresses" && (
              <section className="rounded-3xl border border-[#E8DDD6] bg-white p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                  Delivery
                </p>

                <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                  Saved Address
                </h2>

                {customer?.address ? (
                  <div className="mt-6 rounded-2xl bg-[#FFF8F4] p-5">
                    <p className="font-bold">
                      {customer.fullName}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#756B67]">
                      {customer.address}
                      {customer.city ? `, ${customer.city}` : ""}
                      {customer.state ? `, ${customer.state}` : ""}
                      {customer.pincode ? ` - ${customer.pincode}` : ""}
                    </p>

                    {customer.phone && (
                      <p className="mt-3 text-sm font-semibold">
                        {customer.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-[#FFF8F4] p-5">
                    <p className="font-semibold">
                      No saved delivery address yet.
                    </p>
                  </div>
                )}
              </section>
            )}

            {activeTab === "settings" && (
              <section className="rounded-3xl border border-[#E8DDD6] bg-white p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                  Account
                </p>

                <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                  Account Settings
                </h2>

                <div className="mt-7 space-y-5">
                  <div>
                    <label
                      htmlFor="profile-name"
                      className="mb-2 block text-sm font-semibold text-[#514946]"
                    >
                      Full name
                    </label>

                    <input
                      id="profile-name"
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="w-full rounded-2xl border border-[#DDD2CB] bg-[#FFFDFC] px-4 py-3.5 outline-none focus:border-[#8B2E3F]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-email"
                      className="mb-2 block text-sm font-semibold text-[#514946]"
                    >
                      Email
                    </label>

                    <input
                      id="profile-email"
                      type="email"
                      value={profile?.email ?? ""}
                      disabled
                      className="w-full cursor-not-allowed rounded-2xl border border-[#DDD2CB] bg-[#F7F3F1] px-4 py-3.5 text-[#817672]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-phone"
                      className="mb-2 block text-sm font-semibold text-[#514946]"
                    >
                      Phone number
                    </label>

                    <input
                      id="profile-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full rounded-2xl border border-[#DDD2CB] bg-[#FFFDFC] px-4 py-3.5 outline-none focus:border-[#8B2E3F]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-address"
                      className="mb-2 block text-sm font-semibold text-[#514946]"
                    >
                      Address
                    </label>

                    <textarea
                      id="profile-address"
                      rows={4}
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      className="w-full resize-none rounded-2xl border border-[#DDD2CB] bg-[#FFFDFC] px-4 py-3.5 outline-none focus:border-[#8B2E3F]"
                    />
                  </div>

                  {profileMessage && (
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm ${
                        profileMessageType === "error"
                          ? "border border-red-200 bg-red-50 text-red-700"
                          : "border border-green-200 bg-green-50 text-green-700"
                      }`}
                    >
                      {profileMessage}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="rounded-full bg-[#8B2E3F] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>

                <div className="mt-8 border-t border-[#EEE4DE] pt-7">
                  <h3 className="font-bold">
                    Password
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#756B67]">
                    Need to change your password? We will send a secure reset
                    link to your email.
                  </p>

                  <a
                    href="/forgot-password"
                    className="mt-4 inline-flex rounded-full border border-[#8B2E3F] px-5 py-2.5 text-sm font-semibold text-[#8B2E3F]"
                  >
                    Change Password
                  </a>
                </div>
              </section>
            )}

            {activeTab === "support" && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B2E3F]">
                  Customer Care
                </p>

                <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                  Help & Support
                </h2>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div className="rounded-3xl bg-[#8B2E3F] p-6 text-white">
                    <div className="text-2xl">💬</div>

                    <h3 className="mt-4 text-xl font-bold">
                      WhatsApp Support
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/80">
                      Contact us for customization, orders, printing and
                      delivery support.
                    </p>

                    <a
                      href="/whatsapp-support"
                      className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#8B2E3F]"
                    >
                      WhatsApp Us
                    </a>
                  </div>

                  <div className="rounded-3xl border border-[#E8DDD6] bg-white p-6">
                    <div className="text-2xl">📦</div>

                    <h3 className="mt-4 text-xl font-bold">
                      Track an Order
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#756B67]">
                      Check the latest status of your wedding invitation order.
                    </p>

                    <a
                      href="/track-order"
                      className="mt-6 inline-flex rounded-full border border-[#8B2E3F] px-5 py-2.5 text-sm font-semibold text-[#8B2E3F]"
                    >
                      Track Order
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