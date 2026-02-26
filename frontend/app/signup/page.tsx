"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validate() {
    if (!name.trim()) return "Please enter your name";
    if (!email.trim()) return "Please enter your email";
    if (!password) return "Please enter password";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirm) return "Passwords do not match";
    return "";
  }

  async function onCreateAccount() {
    setError("");
    const msg = validate();
    if (msg) return setError(msg);

    setLoading(true);

    try {
      // ✅ TEMP (no DB yet): just simulate success
      // Later: POST /auth/signup or /api/auth/signup call here.
      await new Promise((r) => setTimeout(r, 600));
      router.push("/"); // or "/dashboard"
    } catch (e) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 overflow-hidden">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl bg-purple-600/20" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full blur-3xl bg-indigo-500/10" />
      </div>

      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="p-8 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">
            Create your AI-CAREER-COACH account
          </h1>
          <p className="mt-2 text-center text-slate-300">
            Start building your career journey
          </p>

          {/* Google sign up */}
          <div className="mt-8">
            <a
              href={`${API}/auth/google`}
              className="group flex items-center justify-center gap-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] transition"
            >
              <span className="text-lg">G</span>
              <span className="font-medium">Continue with Google</span>
              <span className="ml-2 text-xs rounded-full border border-white/10 px-2 py-1 text-slate-300">
                Recommended
              </span>
            </a>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-400">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Email address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                type="email"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                type="password"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Confirm password</label>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                type="password"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              onClick={onCreateAccount}
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3 font-semibold shadow-lg shadow-purple-500/20 hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account →"}
            </button>

            <p className="text-center text-sm text-slate-300 pt-2">
              Already have an account?{" "}
              <Link href="/" className="text-purple-300 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-900/30 px-6 py-4 text-center text-xs text-slate-400">
          Secured by <span className="text-slate-200 font-medium">AI-CAREER-COACH</span>
          <div className="text-yellow-300 mt-1 font-semibold">Development mode</div>
        </div>
      </div>
    </main>
  );
}