"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CustomerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        setMessageType("error");
        return;
      }

      setMessage("Login successful.");
      setMessageType("success");

      router.push("/profile");
      router.refresh();
    } catch (error) {
      console.error("Customer login error:", error);
      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[75vh] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-[#eadfd6] bg-white shadow-[0_20px_70px_rgba(75,30,35,0.08)] lg:grid-cols-2">
          <section className="hidden bg-[#6f1d2f] p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="mb-6 text-sm font-semibold uppercase tracking-[0.25em] text-[#e7c58d]">
                carddesign.studio
              </p>

              <h1 className="max-w-md text-4xl font-semibold leading-tight">
                Welcome back to your invitation design journey.
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-white/75">
                Sign in to manage your profile, continue shopping, save your
                preferences, and access your orders.
              </p>
            </div>

            <div className="mt-12 rounded-3xl border border-white/15 bg-white/10 p-6">
              <p className="text-sm leading-6 text-white/80">
                Premium wedding invitations, personalized for your celebration.
              </p>
            </div>
          </section>

          <section className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              <div className="mb-8">
                <Link
                  href="/"
                  className="mb-6 inline-flex text-sm font-medium text-[#6f1d2f] transition hover:opacity-70"
                >
                  ← Back to home
                </Link>

                <h2 className="text-3xl font-semibold text-[#2f2224]">
                  Customer Login
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#766a6c]">
                  Enter your account details to continue.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-[#3a2b2e]"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-[#dfd3ca] bg-[#fffdfb] px-4 py-3.5 text-[#2f2224] outline-none transition placeholder:text-[#aaa0a0] focus:border-[#6f1d2f] focus:ring-2 focus:ring-[#6f1d2f]/10"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-[#3a2b2e]"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-[#6f1d2f] transition hover:opacity-70"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-2xl border border-[#dfd3ca] bg-[#fffdfb] px-4 py-3.5 pr-20 text-[#2f2224] outline-none transition placeholder:text-[#aaa0a0] focus:border-[#6f1d2f] focus:ring-2 focus:ring-[#6f1d2f]/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#6f1d2f]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {message ? (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      messageType === "error"
                        ? "border border-red-200 bg-red-50 text-red-700"
                        : "border border-green-200 bg-green-50 text-green-700"
                    }`}
                  >
                    {message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#6f1d2f] px-5 py-3.5 font-semibold text-white transition hover:bg-[#5b1727] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#eadfd6]" />
                <span className="text-xs uppercase tracking-[0.18em] text-[#9a8f90]">
                  New customer
                </span>
                <div className="h-px flex-1 bg-[#eadfd6]" />
              </div>

              <Link
                href="/signup"
                className="flex w-full items-center justify-center rounded-2xl border border-[#6f1d2f] px-5 py-3.5 font-semibold text-[#6f1d2f] transition hover:bg-[#6f1d2f]/5"
              >
                Create an account
              </Link>

              <p className="mt-6 text-center text-xs leading-5 text-[#95898b]">
                Customer login is separate from the admin dashboard.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}