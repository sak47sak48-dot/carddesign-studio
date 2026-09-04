"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const navItems = [
  ["Overview", "/admin", "⌂"],
  ["Products", "/admin/products", "▦"],
  ["Categories", "/admin/categories", "◫"],
  ["Orders", "/admin/orders", "▤"],
  ["Customization Requests", "/admin/customization-requests", "✎"],
  ["Customers", "/admin/customers", "◎"],
  ["Inventory", "/admin/inventory", "▣"],
  ["Coupons", "/admin/coupons", "％"],
  ["Homepage Banners", "/admin/banners", "▱"],
  ["WhatsApp Enquiries", "/admin/whatsapp-enquiries", "◉"],
  ["Reviews", "/admin/reviews", "★"],
  ["Notifications", "/admin/notifications", "●"],
  ["Website Settings", "/admin/settings", "⚙"],
  ["Admin Profile", "/admin/profile", "◯"],
] as const;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(pathname === "/admin/login");
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }

    let active = true;

    async function verify() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;
      if (error || roleData?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setEmail(user.email ?? "");
      setReady(true);
    }

    verify();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F3EF] px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#E9DCCF] border-t-[#8B2E3F]" />
          <p className="mt-4 text-sm font-medium text-[#756B67]">Checking admin access...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F3EF] text-[#2B2523]">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#E7DAD3] bg-[#FFFDF9]/95 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E1D3CA] bg-white"
          aria-label="Open admin navigation"
        >
          ☰
        </button>
        <Link href="/admin" className="text-sm font-extrabold tracking-tight text-[#8B2E3F]">
          carddesign.studio Admin
        </Link>
        <Link href="/" className="text-xs font-bold text-[#8B2E3F]">Store</Link>
      </header>

      {menuOpen && (
        <button
          aria-label="Close navigation overlay"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[290px] border-r border-[#E7DAD3] bg-[#FFFDF9] transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="border-b border-[#E7DAD3] px-6 py-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#B3883A]">Management</p>
                <Link href="/admin" className="mt-1 block text-xl font-black tracking-tight text-[#8B2E3F]">
                  carddesign.studio
                </Link>
              </div>
              <button onClick={() => setMenuOpen(false)} className="text-xl lg:hidden" aria-label="Close admin navigation">×</button>
            </div>
            <p className="mt-3 truncate text-xs text-[#756B67]">{email}</p>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navItems.map(([label, href, icon]) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`mb-1 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${active ? "bg-[#8B2E3F] text-white shadow-sm" : "text-[#5E5551] hover:bg-[#F2E9E4] hover:text-[#8B2E3F]"}`}
                >
                  <span className="w-5 text-center text-base" aria-hidden>{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[#E7DAD3] p-3">
            <Link href="/" className="mb-2 flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[#5E5551] hover:bg-[#F2E9E4]">↗ View Website</Link>
            <button onClick={logout} className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-bold text-[#8B2E3F] hover:bg-[#F9E9EC]">↪ Logout</button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[290px]">
        <main className="mx-auto w-full max-w-[1680px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
