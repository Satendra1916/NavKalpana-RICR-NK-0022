"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Role = {
  name: string;
  description: string;
  whyFits: string;
  fitScore: number;
};

export default function CareerPage() {
  const [profileText, setProfileText] = useState(
    "Skills: Java, JavaScript, SQL, basic web dev. Projects: AI-CAREER-COACH. Goal: backend/full-stack job."
  );

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function generate() {
  setLoading(true);
  setErr("");
  setData(null);

  try {
    const res = await fetch(`${API}/api/ai/career`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: {
          raw: profileText,
          skills: profileText
            .replace(/^Skills:\s*/i, "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          education: "B.Tech (CSE) student",
          projects: ["AI-CAREER-COACH", "QR Attendance"],
          interests: ["Backend", "Full-stack"],
        },
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || json?.detail || json?.message || "Failed");
    setData(json);
  } catch (e: any) {
    setErr(e?.message || "Server error");
  } finally {
    setLoading(false);
  }
}
  
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-2xl font-semibold text-white">Career Path</h1>
        <p className="mt-1 text-sm text-white/60">
          AI roadmap + role recommendations based on your profile.
        </p>

        <div className="mt-4 grid gap-3">
          <textarea
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            className="min-h-[90px] w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none"
          />

          <button
            onClick={generate}
            disabled={loading}
            className="w-fit rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Career Plan"}
          </button>

          {err ? <p className="text-sm text-red-400">{err}</p> : null}
        </div>
      </div>

      {!data ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/70">
          {loading ? "Working..." : "No data yet."}
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Roles */}
          <Section title="1. Recommended Roles">
            <div className="grid gap-4 md:grid-cols-2">
              {(data.recommendedRoles as Role[]).map((r, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{r.name}</h3>
                      <p className="mt-1 text-sm text-white/60">{r.description}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 px-3 py-1 text-sm text-white">
                      {r.fitScore}/100
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-white/75">{r.whyFits}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Skills */}
          <Section title="2. Skill-Gap Analysis">
            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Skills you already have">
                <ul className="list-disc pl-5 text-sm text-white/80">
                  {(data.skillGapAnalysis?.alreadyHas || []).map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </Card>

              <Card title="Missing / weak skills (by role)">
                <div className="grid gap-3">
                  {Object.entries(data.skillGapAnalysis?.missingByRole || {}).map(
                    ([role, gaps]: any) => (
                      <div key={role} className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-sm font-semibold text-white">{role}</p>
                        <ul className="mt-2 list-disc pl-5 text-sm text-white/75">
                          {(gaps || []).map((g: string, i: number) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}
                </div>
              </Card>
            </div>
          </Section>

          {/* Roadmap */}
          <Section title="3. Roadmap (3 / 6 / 12 months)">
            <div className="grid gap-4 md:grid-cols-3">
              <RoadmapCard title="3 months" items={data.roadmap?.["3months"] || []} />
              <RoadmapCard title="6 months" items={data.roadmap?.["6months"] || []} />
              <RoadmapCard title="12 months" items={data.roadmap?.["12months"] || []} />
            </div>
          </Section>

          {/* Resources */}
          <Section title="4. Actionable Resources">
            <div className="grid gap-4 md:grid-cols-2">
              {(data.resources || []).map((r: any, i: number) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm font-semibold text-white">{r.skill}</p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-white/75">
                    {(r.types || []).map((t: string, j: number) => (
                      <li key={j}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* Checkpoints */}
          <Section title="5. Progress Checkpoints">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <ul className="list-disc pl-5 text-sm text-white/80">
                {(data.checkpoints || []).map((c: string, i: number) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function RoadmapCard({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 grid gap-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm text-white/85">{it.task}</p>
            <p className="mt-1 text-xs text-white/60">~ {it.weeklyHours} hrs/week</p>
          </div>
        ))}
      </div>
    </div>
  );
}