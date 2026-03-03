"use client";
import React, { useEffect, useState } from "react";
type Overview = {
  resumeUses?: number;
  interviewUses?: number;
  totalEvents7d?: number;
};
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<Overview>({});
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // IMPORTANT: same-origin proxy + cookies included
        const res = await fetch("/api/analytics/overview", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(`API ${res.status}: ${JSON.stringify(json)}`);
          return;
        }
        if (alive) setData(json || {});
      } catch (e: any) {
        setErr(e?.message || "Network error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-slate-400 mt-1">Analytics overview (session based)</p>
      {loading ? (
        <div className="mt-6 text-slate-300">Loading…</div>
      ) : null}
      {err ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
          <div className="mt-2 text-xs text-slate-300">
            Tip: agar Google login ke baad bhi 401 aa raha hai, to cookies/credentials/proxy issue hai.
          </div>
        </div>
      ) : null}
      {!loading && !err ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-slate-400 text-sm">Resume AI Uses</div>
            <div className="text-3xl font-semibold mt-1">{data.resumeUses ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-slate-400 text-sm">Interview AI Uses</div>
            <div className="text-3xl font-semibold mt-1">{data.interviewUses ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-slate-400 text-sm">Total Events (7d)</div>
            <div className="text-3xl font-semibold mt-1">{data.totalEvents7d ?? 0}</div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
