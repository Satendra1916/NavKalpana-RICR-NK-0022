"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Overview = {
  ok: boolean;
  eventsDaily: { _id: string; count: number }[];
  interviewTrend: { _id: string; count: number }[];
  resumeAiCount: number;
  interviewCount: number;
};

function shortDate(iso: string) {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const d = parts[2];
  const m = parts[1];
  return `${d}/${m}`;
}

export default function AnalyticsCharts() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API}/api/analytics/overview`, {
          credentials: "include",
        });

        const json = (await res.json()) as Overview;

        if (!res.ok || !json?.ok) {
          throw new Error("Unauthorized / API error");
        }

        if (alive) setData(json);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed to load analytics");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const kpis = useMemo(() => {
    return {
      resumeAiCount: data?.resumeAiCount ?? 0,
      interviewCount: data?.interviewCount ?? 0,
      totalEvents: (data?.eventsDaily || []).reduce((a, b) => a + (b.count || 0), 0),
    };
  }, [data]);

  const dailyBars = useMemo(() => {
    return (data?.eventsDaily || []).map((x) => ({
      date: shortDate(x._id),
      count: x.count,
    }));
  }, [data]);

  const interviewLine = useMemo(() => {
    return (data?.interviewTrend || []).map((x) => ({
      date: shortDate(x._id),
      count: x.count,
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Resume AI Uses</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{kpis.resumeAiCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Interview AI Uses</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{kpis.interviewCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Total Events (7 days)</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{kpis.totalEvents}</p>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-300">
          Loading analytics...
        </div>
      )}

      {err && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {err}
        </div>
      )}

      {!loading && !err && data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-base font-semibold text-slate-100">Daily Activity (7 days)</p>
            <p className="mt-1 text-sm text-slate-400">Total events per day</p>

            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyBars}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fill: "#cbd5e1" }} />
                  <YAxis tick={{ fill: "#cbd5e1" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(2,6,23,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-base font-semibold text-slate-100">Interview Trend (7 days)</p>
            <p className="mt-1 text-sm text-slate-400">Interview AI usage per day</p>

            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={interviewLine}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fill: "#cbd5e1" }} />
                  <YAxis tick={{ fill: "#cbd5e1" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(2,6,23,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#e2e8f0",
                    }}
                  />
                  <Line type="monotone" dataKey="count" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}