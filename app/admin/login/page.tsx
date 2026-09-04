"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkExistingSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCheckingSession(false);
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleData?.role === "admin") {
        router.replace("/admin");
        return;
      }

      setCheckingSession(false);
    }

    checkExistingSession();
  }, [router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (!email.trim() || !password) {
        setError("Enter your email and password.");
        return;
      }

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (!data.user) {
        setError("Unable to sign in.");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (roleError) {
        await supabase.auth.signOut();
        setError("Unable to verify administrator access.");
        return;
      }

      if (roleData?.role !== "admin") {
        await supabase.auth.signOut();
        setError("This account does not have administrator access.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-[#FFFDF9] px-4">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#E8D8CF] border-t-[#8B2E3F]" />

          <p className="mt-4 text-sm text-[#756B67]">
            Checking administrator access...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] w-full overflow-x-hidden bg-[#FFFDF9]">
      <section className="mx-auto flex min-h-[80vh] w-full max-w-[1440px] items-center justify-center px-4 py-10 sm:px-6 md:py-16 lg:px-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8B2E3F] text-xl font-bold text-white shadow-sm">
              W
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-[#8B2E3F]">
              carddesign.studio
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2B2523] sm:text-4xl">
              Admin Login
            </h1>

            <p className="mx-auto mt-3 max-w-[360px] text-sm leading-6 text-[#756B67]">
              Sign in with your administrator account to manage products,
              customers and orders.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#E8DDD6] bg-white p-5 shadow-[0_20px_60px_rgba(77,44,35,0.08)] sm:p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-semibold text-[#2B2523]"
                >
                  Email address
                </label>

                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@wedinvite.in"
                  autoComplete="email"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-[#DDD1CA] bg-[#FFFDF9] px-4 text-sm text-[#2B2523] outline-none transition placeholder:text-[#A79C96] focus:border-[#8B2E3F] focus:ring-2 focus:ring-[#8B2E3F]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-semibold text-[#2B2523]"
                >
                  Password
                </label>

                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-[#DDD1CA] bg-[#FFFDF9] px-4 text-sm text-[#2B2523] outline-none transition placeholder:text-[#A79C96] focus:border-[#8B2E3F] focus:ring-2 focus:ring-[#8B2E3F]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#8B2E3F] px-5 text-sm font-semibold text-white transition hover:bg-[#742536] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In to Dashboard"}
              </button>
            </form>

            <div className="mt-6 border-t border-[#EEE5DF] pt-5 text-center">
              <p className="text-xs leading-5 text-[#8A807B]">
                Administrator access only. Customer accounts cannot access the
                carddesign.studio management dashboard.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mx-auto mt-6 block text-sm font-semibold text-[#8B2E3F] hover:underline"
          >
            ← Return to carddesign.studio
          </button>
        </div>
      </section>
    </main>
  );
}