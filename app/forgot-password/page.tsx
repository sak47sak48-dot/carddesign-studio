"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        }
      );

      if (error) {
        setMessage(error.message);
        setMessageType("error");
        return;
      }

      setMessage(
        "Password reset email sent. Please check your inbox and follow the reset link."
      );
      setMessageType("success");
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center">
        <div className="w-full max-w-lg rounded-[32px] border border-[#eadfd6] bg-white p-6 shadow-[0_20px_70px_rgba(75,30,35,0.08)] sm:p-10">
          <Link
            href="/login"
            className="mb-7 inline-flex text-sm font-medium text-[#6f1d2f] transition hover:opacity-70"
          >
            ← Back to login
          </Link>

          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9b713b]">
              carddesign.studio
            </p>

            <h1 className="text-3xl font-semibold text-[#2f2224]">
              Forgot your password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#766a6c]">
              Enter the email address connected to your customer account. We
              will send you a secure link to create a new password.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
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

            {message ? (
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
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
              {loading ? "Sending reset link..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-7 rounded-2xl bg-[#fff8ee] p-4">
            <p className="text-sm leading-6 text-[#766a6c]">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#6f1d2f] hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}