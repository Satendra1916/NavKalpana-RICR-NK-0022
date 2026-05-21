"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";



export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("ranjeet@test.com");
  const [password, setPassword] = useState("Test@1234");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleLogin() {
    setMsg("");
    if (!email.trim()) return setMsg("Email required");
    if (!password.trim()) return setMsg("Password required");

    setLoading(true);
    try {
      const res = await fetch(`/auth/local/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.error || "Login failed");
        return;
      }

      // ✅ logged in
      router.push(next);
    } catch (e) {
      setMsg("Network error. Is backend running on :5000?");
    } finally {
      setLoading(false);
    }
  }

  function googleLogin() {
    // ✅ backend google oauth route
    window.location.href = `/auth/google`;
  }

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-600/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/40 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="px-8 pt-8 pb-6">
          <h1 className="text-center text-2xl font-semibold text-white">
            Sign in to <span className="font-bold">AI-CAREER-COACH</span>
          </h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            Continue with Google or use email + password.
          </p>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={googleLogin}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-950/60"
            >
              Continue with Google
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-500">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">Email</label>
              <input
                suppressHydrationWarning
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-4 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">Password</label>
              <input
                suppressHydrationWarning
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-4 focus:ring-violet-500/20"
              />
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {msg ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                {msg}
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 px-8 py-5">
          <p className="text-center text-sm text-slate-400">
            Don’t have an account?{" "}
            <Link href="/signup" className="font-semibold text-violet-300 hover:text-violet-200">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
