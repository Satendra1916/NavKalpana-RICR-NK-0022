"use client";

import React, { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Stats = {
  resumeAIUses: number;
  interviewAIUses: number;
  totalEvents7d: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    resumeAIUses: 0,
    interviewAIUses: 0,
    totalEvents7d: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/api/analytics/summary`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch dashboard analytics");
      }

      const data = await res.json();

      console.log("Dashboard Analytics:", data);

      setStats({
        resumeAIUses:
          data?.stats?.resumeAIUses ||
          data?.resumeAIUses ||
          0,

        interviewAIUses:
          data?.stats?.interviewAIUses ||
          data?.interviewAIUses ||
          0,

        totalEvents7d:
          data?.stats?.totalEvents7d ||
          data?.totalEvents7d ||
          0,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-white">
          Dashboard
        </h1>

        <p className="mt-1 text-slate-400">
          Analytics overview (real database data)
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-slate-300">
          Loading dashboard analytics...
        </div>
      ) : (
        <>
          {/* Cards */}
          <div className="grid gap-5 md:grid-cols-3">
            <Card
              title="Resume AI Uses"
              value={stats.resumeAIUses}
            />

            <Card
              title="Interview AI Uses"
              value={stats.interviewAIUses}
            />

            <Card
              title="Total Events (7d)"
              value={stats.totalEvents7d}
            />
          </div>

          {/* Bottom Sections */}
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {/* Next Steps */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-5">
              <h2 className="text-lg font-semibold text-white">
                Next steps
              </h2>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                <li>
                  Go to{" "}
                  <span className="text-violet-300">
                    Quiz
                  </span>{" "}
                  and attempt role-based MCQs
                </li>

                <li>
                  Use{" "}
                  <span className="text-violet-300">
                    Interview Prep
                  </span>{" "}
                  for AI mock interviews
                </li>

                <li>
                  Improve resume using{" "}
                  <span className="text-violet-300">
                    Resume Builder
                  </span>
                </li>
              </ul>
            </div>

            {/* Status */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-5">
              <h2 className="text-lg font-semibold text-white">
                Status
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                Dashboard connected with backend analytics
                API and MongoDB database.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="text-sm text-slate-400">
        {title}
      </div>

      <div className="mt-2 text-4xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}