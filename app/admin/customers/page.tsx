"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import {
  Card,
  EmptyState,
  Notice,
  PageHeader,
} from "../../../components/admin/AdminUI";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
};

type Order = {
  user_id: string | null;
  total_amount: number;
  payment_status: string;
};

export default function CustomersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError("");

        const [profileResult, orderResult] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id,full_name,email,phone,city,state,created_at"
            )
            .order("created_at", { ascending: false }),

          supabase
            .from("orders")
            .select("user_id,total_amount,payment_status"),
        ]);

        if (profileResult.error) {
          throw profileResult.error;
        }

        if (orderResult.error) {
          throw orderResult.error;
        }

        setProfiles((profileResult.data ?? []) as Profile[]);
        setOrders((orderResult.data ?? []) as Order[]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load customers."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return profiles;
    }

    return profiles.filter((profile) => {
      const searchable = [
        profile.full_name,
        profile.email,
        profile.phone,
        profile.city,
        profile.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(value);
    });
  }, [profiles, search]);

  const getMetrics = (customerId: string) => {
    const customerOrders = orders.filter(
      (order) => order.user_id === customerId
    );

    const paidOrders = customerOrders.filter(
      (order) => order.payment_status === "paid"
    );

    const spent = paidOrders.reduce(
      (total, order) =>
        total + Number(order.total_amount || 0),
      0
    );

    return {
      orders: customerOrders.length,
      spent,
    };
  };

  const totalCustomers = profiles.length;

  const customersWithOrders = profiles.filter((profile) =>
    orders.some((order) => order.user_id === profile.id)
  ).length;

  const totalPaidRevenue = orders
    .filter((order) => order.payment_status === "paid")
    .reduce(
      (total, order) =>
        total + Number(order.total_amount || 0),
      0
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        description="View registered customers, account information, order activity and lifetime value."
      />

      {error && <Notice>{error}</Notice>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A7D77]">
            Total Customers
          </p>

          <p className="mt-2 text-3xl font-black text-[#2C2522]">
            {totalCustomers}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A7D77]">
            Customers With Orders
          </p>

          <p className="mt-2 text-3xl font-black text-[#2C2522]">
            {customersWithOrders}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A7D77]">
            Paid Customer Revenue
          </p>

          <p className="mt-2 text-3xl font-black text-[#2C2522]">
            ₹{totalPaidRevenue.toLocaleString("en-IN")}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <input
          className="min-h-11 w-full rounded-xl border border-[#DCCFC8] bg-white px-4 text-sm outline-none transition focus:border-[#8B2635]"
          placeholder="Search name, email, phone or location..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[#756B67]">
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Registered customer profiles will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-[#FCF8F5] text-[11px] uppercase tracking-wide text-[#817672]">
                <tr>
                  <th className="px-4 py-3">
                    Customer
                  </th>

                  <th className="px-4 py-3">
                    Phone
                  </th>

                  <th className="px-4 py-3">
                    Location
                  </th>

                  <th className="px-4 py-3">
                    Orders
                  </th>

                  <th className="px-4 py-3">
                    Paid LTV
                  </th>

                  <th className="px-4 py-3">
                    Joined
                  </th>

                  <th className="px-4 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0E7E2]">
                {filtered.map((profile) => {
                  const metrics = getMetrics(profile.id);

                  return (
                    <tr
                      key={profile.id}
                      className="transition hover:bg-[#FFFBF8]"
                    >
                      <td className="px-4 py-4">
                        <p className="font-black text-[#2C2522]">
                          {profile.full_name ||
                            "Unnamed customer"}
                        </p>

                        <p className="mt-1 text-xs text-[#756B67]">
                          {profile.email || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {profile.phone || "—"}
                      </td>

                      <td className="px-4 py-4">
                        {[profile.city, profile.state]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>

                      <td className="px-4 py-4 font-bold">
                        {metrics.orders}
                      </td>

                      <td className="px-4 py-4 font-black">
                        ₹
                        {metrics.spent.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs text-[#756B67]">
                        {new Date(
                          profile.created_at
                        ).toLocaleDateString("en-IN")}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/admin/customers/${profile.id}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#8B2635] px-4 text-xs font-bold text-[#8B2635] transition hover:bg-[#8B2635] hover:text-white"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}