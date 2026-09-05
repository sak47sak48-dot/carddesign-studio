"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        setHasSession(Boolean(data.session));
      } catch (error) {
        console.error("Reset password session error:", error);

        if (mounted) {
          setHasSession(false);
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setHasSession(Boolean(session));
      setCheckingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (!password || !confirmPassword) {
      setMessage("Please enter and confirm your new password.");
      setMessageType("error");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message);
        setMessageType("error");
        return;
      }

      setMessage("Your password has been changed successfully.");
      setMessageType("success");

      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1200);
    } catch (error) {
      console.error("Reset password error:", error);
      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-4">
        <div className="rounded-3xl border border-[#eadfd6] bg-white px-8 py-7 text-center shadow-sm">
          <p className="font-medium text-[#6f1d2f]">
            Verifying your reset link...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center">
        <div className="w-full max-w-lg rounded-[32px] border border-[#eadfd6] bg-white p-6 shadow-[0_20px_70px_rgba(75,30,35,0.08)] sm:p-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#9b713b]">
            carddesign.studio
          </p>

          <h1 className="text-3xl font-semibold text-[#2f2224]">
            Create New Password
          </h1>

          {!hasSession ? (
            <div className="mt-7">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                This password reset link is invalid or has expired. Request a
                new reset link and try again.
              </div>

              <Link
                href="/forgot-password"
                className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#6f1d2f] px-5 py-3.5 font-semibold text-white transition hover:bg-[#5b1727]"
              >
                Request New Reset Link
              </Link>

              <Link
                href="/login"
                className="mt-3 flex w-full items-center justify-center rounded-2xl border border-[#6f1d2f] px-5 py-3.5 font-semibold text-[#6f1d2f]"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6 text-[#766a6c]">
                Enter your new password below. Use a password that you have not
                shared with anyone else.
              </p>

              <form onSubmit={handleReset} className="mt-8 space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-[#3a2b2e]"
                    >
                      New password
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="text-sm font-medium text-[#6f1d2f]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-2xl border border-[#dfd3ca] bg-[#fffdfb] px-4 py-3.5 text-[#2f2224] outline-none transition placeholder:text-[#aaa0a0] focus:border-[#6f1d2f] focus:ring-2 focus:ring-[#6f1d2f]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-[#3a2b2e]"
                  >
                    Confirm new password
                  </label>

                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Enter your new password again"
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
                  {loading ? "Updating password..." : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}