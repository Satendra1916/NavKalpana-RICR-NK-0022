"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleContinue() {
    if (!email.trim()) {
      alert("Please enter email");
      return;
    }
    // ✅ For now: just navigate to dashboard (later we can implement OTP/email auth)
    router.push("/dashboard");
  }

  function handleSignup() {
    router.push("/signup");
  }

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-600/20 blur-3xl" />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/40 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="px-8 pt-8 pb-6">
          <h1 className="text-center text-2xl font-semibold text-white">
            Sign in to <span className="font-bold">AI-CAREER-COACH</span>
          </h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            Welcome back! Please sign in to continue
          </p>

          {/* Google button */}
          <button
            type="button"
            onClick={() => (window.location.href = `${API}/auth/google`)}
            className="mt-6 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-950/70 active:scale-[0.99] transition"
          >
            <span className="flex items-center justify-center gap-3">
              <GoogleIcon />
              Continue with Google
              <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                Last used
              </span>
            </span>
          </button>

          {/* OR divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <div className="text-xs text-slate-500">or</div>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Email field */}
          <div>
            <label className="text-sm font-medium text-slate-200">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-4 focus:ring-violet-500/20"
            />

            <button
              type="button"
              onClick={handleContinue}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 active:scale-[0.99] transition"
            >
              <span className="flex items-center justify-center gap-2">
                Continue <span className="text-white/90">▶</span>
              </span>
            </button>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-white/10 px-8 py-5">
          <p className="text-center text-sm text-slate-400">
            Don’t have an account?{" "}
            <button
              type="button"
              onClick={handleSignup}
              className="font-semibold text-violet-300 hover:text-violet-200"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Footer strip */}
        <div className="rounded-b-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-4 text-center border-t border-white/5">
          <div className="text-xs text-slate-400">
            Secured by <span className="font-semibold text-slate-200">AI-CAREER-COACH</span>
          </div>
          <div className="mt-1 text-xs font-semibold text-amber-300">Development mode</div>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.1-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.3 5.4-6 6.9l0 0 6.2 5.2C39.1 36.7 44 31.6 44 24c0-1.1-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
