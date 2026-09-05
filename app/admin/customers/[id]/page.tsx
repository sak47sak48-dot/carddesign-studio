"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import {
  Card,
  EmptyState,
  Notice,
  PageHeader,
} from "../../../../components/admin/AdminUI";

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
  id: string;
  user_id: string | null;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
};

type Address = {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

type CustomizationRequest = {
  id: string;
  user_id: string | null;
  status: string;
  created_at: string;
};

export default function CustomerDetailsPage() {
  const params = useParams();

  const customerId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [customizations, setCustomizations] = useState<
    CustomizationRequest[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customerId) return;

    const loadCustomer = async () => {
      try {
        setLoading(true);
        setError("");

        const profileResult = await supabase
          .from("profiles")
          .select(
            "id,full_name,email,phone,city,state,created_at"
          )
          .eq("id", customerId)
          .maybeSingle();

        if (profileResult.error) {
          throw profileResult.error;
        }

        if (!profileResult.data) {
          setProfile(null);
          return;
        }

        setProfile(profileResult.data as Profile);

        const [
          orderResult,
          addressResult,
          customizationResult,
        ] = await Promise.all([
          supabase
            .from("orders")
            .select(
              "id,user_id,total_amount,payment_status,status,created_at"
            )
            .eq("user_id", customerId)
            .order("created_at", { ascending: false }),

          supabase
            .from("customer_addresses")
            .select(
              "id,user_id,full_name,phone,address_line1,address_line2,city,state,postal_code,country"
            )
            .eq("user_id", customerId),

          supabase
            .from("customization_requests")
            .select("id,user_id,status,created_at")
            .eq("user_id", customerId)
            .order("created_at", { ascending: false }),
        ]);

        if (orderResult.error) {
          console.error(
            "Unable to load customer orders:",
            orderResult.error
          );
        } else {
          setOrders((orderResult.data ?? []) as Order[]);
        }

        if (addressResult.error) {
          console.error(
            "Unable to load customer addresses:",
            addressResult.error
          );
        } else {
          setAddresses(
            (addressResult.data ?? []) as Address[]
          );
        }

        if (customizationResult.error) {
          console.error(
            "Unable to load customization requests:",
            customizationResult.error
          );
        } else {
          setCustomizations(
            (customizationResult.data ??
              []) as CustomizationRequest[]
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load customer."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [customerId]);

  const paidOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.payment_status === "paid"
      ),
    [orders]
  );

  const totalSpent = useMemo(
    () =>
      paidOrders.reduce(
        (total, order) =>
          total + Number(order.total_amount || 0),
        0
      ),
    [paidOrders]
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatStatus = (value: string) =>
    value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase()
      );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="CRM"
          title="Customer Details"
          description="Loading customer information..."
        />

        <Card className="p-10 text-center text-sm text-[#756B67]">
          Loading customer...
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="CRM"
          title="Customer Not Found"
          description="This customer profile could not be found."
        />

        {error && <Notice>{error}</Notice>}

        <Card className="p-6">
          <Link
            href="/admin/customers"
            className="font-bold text-[#8B2635]"
          >
            ← Back to Customers
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/customers"
          className="mb-4 inline-flex items-center text-sm font-bold text-[#8B2635]"
        >
          ← Back to Customers
        </Link>

        <PageHeader
          eyebrow="CRM"
          title={profile.full_name || "Unnamed Customer"}
          description="Complete customer account, order and activity information."
        />
      </div>

      {error && <Notice>{error}</Notice>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A7D77]">
            Total Orders
          </p>

          <p className="mt-2 text-3xl font-black text-[#2C2522]">
            {orders.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A7D77]">
            Paid Orders
          </p>

          <p className="mt-2 text-3xl font-black text-[#2C2522]">
            {paidOrders.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A7D77]">
            Lifetime Value
          </p>

          <p className="mt-2 text-3xl font-black text-[#2C2522]">
            ₹{totalSpent.toLocaleString("en-IN")}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A7D77]">
            Customizations
          </p>

          <p className="mt-2 text-3xl font-black text-[#2C2522]">
            {customizations.length}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <h2 className="text-xl font-black text-[#2C2522]">
            Customer Information
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Info
              label="Full Name"
              value={profile.full_name || "Not provided"}
            />

            <Info
              label="Email Address"
              value={profile.email || "Not provided"}
            />

            <Info
              label="Phone Number"
              value={profile.phone || "Not provided"}
            />

            <Info
              label="Location"
              value={
                [profile.city, profile.state]
                  .filter(Boolean)
                  .join(", ") || "Not provided"
              }
            />

            <Info
              label="Joined"
              value={formatDate(profile.created_at)}
            />

            <Info
              label="Customer ID"
              value={profile.id}
              mono
            />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black text-[#2C2522]">
            Contact Customer
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#756B67]">
            Use the customer's available contact information
            for order or customization support.
          </p>

          <div className="mt-6 space-y-3">
            {profile.email ? (
              <a
                href={`mailto:${profile.email}`}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#741D31] px-4 text-sm font-bold text-white transition hover:opacity-90"
              >
                Email Customer
              </a>
            ) : (
              <div className="rounded-xl border border-[#E6DAD4] p-4 text-center text-sm text-[#756B67]">
                No email available
              </div>
            )}

            {profile.phone ? (
              <a
                href={`https://wa.me/${profile.phone.replace(
                  /\D/g,
                  ""
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 w-full items-center justify-center rounded-xl border border-[#741D31] px-4 text-sm font-bold text-[#741D31] transition hover:bg-[#FFF8F5]"
              >
                WhatsApp Customer
              </a>
            ) : (
              <div className="rounded-xl border border-[#E6DAD4] p-4 text-center text-sm text-[#756B67]">
                No phone number available
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-[#F0E7E2] p-6">
          <h2 className="text-xl font-black text-[#2C2522]">
            Order History
          </h2>

          <p className="mt-1 text-sm text-[#756B67]">
            Orders associated with this customer account.
          </p>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="This customer has not placed an order yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[#FCF8F5] text-[11px] uppercase tracking-wide text-[#817672]">
                <tr>
                  <th className="px-5 py-3">
                    Order
                  </th>

                  <th className="px-5 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3">
                    Order Status
                  </th>

                  <th className="px-5 py-3">
                    Payment
                  </th>

                  <th className="px-5 py-3">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0E7E2]">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#2C2522]">
                        #
                        {order.id
                          .slice(0, 8)
                          .toUpperCase()}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-[#756B67]">
                      {formatDateTime(
                        order.created_at
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        value={formatStatus(
                          order.status
                        )}
                      />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        value={formatStatus(
                          order.payment_status
                        )}
                      />
                    </td>

                    <td className="px-5 py-4 font-black">
                      ₹
                      {Number(
                        order.total_amount || 0
                      ).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-black text-[#2C2522]">
          Saved Addresses
        </h2>

        <p className="mt-1 text-sm text-[#756B67]">
          Delivery addresses saved by this customer.
        </p>

        {addresses.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#DCCFC8] p-6 text-sm text-[#756B67]">
            No saved addresses.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-2xl border border-[#E8DDD7] bg-[#FFFCFA] p-5"
              >
                <p className="font-black text-[#2C2522]">
                  {address.full_name ||
                    profile.full_name ||
                    "Customer"}
                </p>

                {address.phone && (
                  <p className="mt-1 text-sm text-[#756B67]">
                    {address.phone}
                  </p>
                )}

                <div className="mt-4 text-sm leading-6 text-[#514844]">
                  {address.address_line1 && (
                    <p>{address.address_line1}</p>
                  )}

                  {address.address_line2 && (
                    <p>{address.address_line2}</p>
                  )}

                  <p>
                    {[
                      address.city,
                      address.state,
                      address.postal_code,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>

                  {address.country && (
                    <p>{address.country}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-[#F0E7E2] p-6">
          <h2 className="text-xl font-black text-[#2C2522]">
            Customization Requests
          </h2>

          <p className="mt-1 text-sm text-[#756B67]">
            Wedding card customization requests submitted
            by this customer.
          </p>
        </div>

        {customizations.length === 0 ? (
          <EmptyState
            title="No customization requests"
            description="This customer has not submitted a customization request."
          />
        ) : (
          <div className="divide-y divide-[#F0E7E2]">
            {customizations.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-black text-[#2C2522]">
                    Request #
                    {request.id
                      .slice(0, 8)
                      .toUpperCase()}
                  </p>

                  <p className="mt-1 text-xs text-[#756B67]">
                    {formatDateTime(
                      request.created_at
                    )}
                  </p>
                </div>

                <StatusBadge
                  value={formatStatus(request.status)}
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8A7D77]">
        {label}
      </p>

      <p
        className={`mt-2 break-all text-sm font-semibold text-[#2C2522] ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  value,
}: {
  value: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-[#E4D5CF] bg-[#FCF8F5] px-3 py-1 text-xs font-bold text-[#6D5550]">
      {value}
    </span>
  );
}