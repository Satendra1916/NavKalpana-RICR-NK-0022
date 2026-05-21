"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function VerifyEmailInner() {
    const sp = useSearchParams();
    const router = useRouter();

    const email = useMemo(() => sp.get("email") || "", [sp]);

    const [otp, setOtp] = useState("");
    const [busy, setBusy] = useState(false);
    const [busyResend, setBusyResend] = useState(false);

    async function verify() {
        if (!email) return alert("Email missing in URL. Go back to signup.");

        setBusy(true);
        try {
            const res = await fetch(`${API}/auth/local/otp/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Verify failed");

            alert("✅ Email verified!");
            router.push("/login");
        } catch (e: any) {
            alert(e?.message || "Verify failed");
        } finally {
            setBusy(false);
        }
    }

    async function resend() {
        if (!email) return alert("Email missing in URL. Go back to signup.");

        setBusyResend(true);
        try {
            const res = await fetch(`${API}/auth/local/otp/resend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Resend failed");

            alert("OTP resent ✅");
        } catch (e: any) {
            alert(e?.message || "Resend failed");
        } finally {
            setBusyResend(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white grid place-items-center p-6">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-2xl font-extrabold">Verify Email</div>
                <div className="text-sm text-slate-300 mt-1">
                    OTP sent to: <span className="text-white">{email || "[missing email]"}</span>
                </div>

                <div className="mt-6 space-y-3">
                    <input
                        className="w-full rounded-xl bg-slate-900/60 border border-white/10 p-3 tracking-[0.3em] text-center text-lg font-extrabold outline-none"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="••••••"
                        inputMode="numeric"
                    />

                    <button
                        onClick={verify}
                        disabled={busy || otp.length !== 6}
                        className="w-full rounded-xl py-3 font-bold bg-gradient-to-r from-violet-500 to-indigo-500 disabled:opacity-60"
                    >
                        {busy ? "Verifying..." : "Verify OTP"}
                    </button>

                    <button
                        onClick={resend}
                        disabled={busyResend}
                        className="w-full rounded-xl py-3 font-semibold border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60"
                    >
                        {busyResend ? "Resending..." : "Resend OTP"}
                    </button>
                </div>
            </div>
        </main>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white grid place-items-center">Loading...</div>}>
            <VerifyEmailInner />
        </Suspense>
    );
}