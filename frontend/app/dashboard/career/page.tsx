"use client";

/**
 * CareerPage.tsx — NavKalpana AI Career Coach
 *
 * Major improvements over v1:
 *  1. Full TypeScript interfaces — zero `any` types
 *  2. Tabbed layout: Overview · Roadmap · Resources · Progress · AI Insights
 *  3. Skeleton loaders for every section
 *  4. Animated fit-score progress bars (CSS keyframes via inline style)
 *  5. Recharts: RadarChart for skills, BarChart for roadmap hours
 *  6. localStorage persistence — last plan survives page refresh
 *  7. Robust regex-based skills parser
 *  8. Lucide-react icons throughout
 *  9. Progress tracking UI with checkable milestones
 * 10. AI Insights section with actionable highlights
 * 11. Fully responsive: mobile / tablet / desktop
 * 12. Modern SaaS dark-glass aesthetic with smooth transitions
 */

import { useEffect, useRef, useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Sparkles,
  MapPin,
  BookOpen,
  BarChart2,
  Lightbulb,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  TrendingUp,
  Star,
  Zap,
  RefreshCcw,
  Save,
  User,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const STORAGE_KEY = "navkalpana_career_plan";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Role {
  name: string;
  description: string;
  whyFits: string;
  fitScore: number;
}

interface SkillGapAnalysis {
  alreadyHas: string[];
  missingByRole: Record<string, string[]>;
}

interface RoadmapItem {
  task: string;
  weeklyHours: number;
}

interface Roadmap {
  "3months": RoadmapItem[];
  "6months": RoadmapItem[];
  "12months": RoadmapItem[];
}

interface Resource {
  skill: string;
  types: string[];
}

interface AIInsight {
  title: string;
  body: string;
  type: "tip" | "warning" | "star";
}

interface CareerData {
  recommendedRoles: Role[];
  skillGapAnalysis: SkillGapAnalysis;
  roadmap: Roadmap;
  resources: Resource[];
  checkpoints: string[];
  aiInsights?: AIInsight[];
}

type Tab = "overview" | "roadmap" | "resources" | "progress" | "insights";

// ─── Skill parser (regex-based) ───────────────────────────────────────────────

function parseSkills(raw: string): string[] {
  // Grabs comma/semicolon/pipe separated tokens after optional "Skills:" label
  const cleaned = raw
    .replace(/skills\s*[:\-]\s*/gi, "")
    .replace(/\bgoal\b.*$/gi, "")   // drop trailing "Goal: …" clause
    .replace(/\bprojects?\b.*$/gi, "");
  return cleaned
    .split(/[,;|\/\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40);
}

// ─── Skeleton primitives ──────────────────────────────────────────────────────

function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
      <Bone className="h-5 w-2/3" />
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-5/6" />
      <Bone className="h-8 w-1/3 mt-2" />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <Bone className="h-5 w-1/3" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-4/5" />
        <Bone className="h-3 w-full" />
      </div>
    </div>
  );
}

// ─── Animated Fit Score Bar ───────────────────────────────────────────────────

function FitBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "#a78bfa" : score >= 60 ? "#60a5fa" : "#f472b6";
  return (
    <div className="mt-3 space-y-1">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Fit score</span>
        <span className="font-semibold text-white">{score}/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-[1200ms] ease-out"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Role Card ────────────────────────────────────────────────────────────────

function RoleCard({ role }: { role: Role }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:border-violet-500/40 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-violet-900/20">
      {/* subtle gradient orb */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-600/10 blur-2xl transition-all duration-500 group-hover:bg-violet-600/20" />

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-white leading-tight">{role.name}</h3>
        <span className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-violet-300 ring-1 ring-inset ring-violet-500/20">
          {role.fitScore}/100
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-white/55">{role.description}</p>
      <p className="mt-3 text-sm text-white/75">{role.whyFits}</p>
      <FitBar score={role.fitScore} />
    </div>
  );
}

// ─── Skill Gap Card ───────────────────────────────────────────────────────────

function SkillBadge({ label, variant }: { label: string; variant: "have" | "missing" }) {
  return (
    <span
      className={`inline-block rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 hover:scale-105 ${
        variant === "have"
          ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20"
          : "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/20"
      }`}
    >
      {label}
    </span>
  );
}

function SkillGapCard({ analysis }: { analysis: SkillGapAnalysis }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" /> Skills you have
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {analysis.alreadyHas.map((s) => (
            <SkillBadge key={s} label={s} variant="have" />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <AlertCircle size={14} className="text-rose-400" /> Skills to build
        </p>
        <div className="mt-3 space-y-3">
          {Object.entries(analysis.missingByRole).map(([role, gaps]) => (
            <div key={role}>
              <p className="mb-1.5 text-xs font-medium text-white/50 uppercase tracking-wide">{role}</p>
              <div className="flex flex-wrap gap-2">
                {gaps.map((g) => <SkillBadge key={g} label={g} variant="missing" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Roadmap Card ─────────────────────────────────────────────────────────────

const phaseColors: Record<string, string> = {
  "3months": "from-violet-600/30 to-violet-900/10",
  "6months": "from-blue-600/30 to-blue-900/10",
  "12months": "from-cyan-600/30 to-cyan-900/10",
};

function RoadmapCard({ phase, items }: { phase: string; items: RoadmapItem[] }) {
  const label = phase === "3months" ? "3 Months" : phase === "6months" ? "6 Months" : "12 Months";
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${phaseColors[phase]} p-5`}>
      <p className="mb-3 text-sm font-semibold text-white flex items-center gap-2">
        <Clock size={13} className="text-white/50" /> {label}
      </p>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 transition-all duration-200 hover:border-white/20 hover:bg-black/30">
            <p className="text-sm text-white/90 leading-snug">{it.task}</p>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-white/45">
              <Clock size={10} /> <span>{it.weeklyHours} hrs/week</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.06]">
      <p className="text-sm font-semibold text-white flex items-center gap-2">
        <BookOpen size={13} className="text-blue-400" /> {resource.skill}
      </p>
      <ul className="mt-3 space-y-2">
        {resource.types.map((t, j) => (
          <li key={j} className="flex items-start gap-2 text-sm text-white/70">
            <ChevronRight size={12} className="mt-0.5 shrink-0 text-blue-400/60" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Checkpoint (Progress) Card ───────────────────────────────────────────────

function CheckpointCard({
  checkpoint,
  index,
  checked,
  onToggle,
}: {
  checkpoint: string;
  index: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`group flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
        checked
          ? "border-emerald-500/30 bg-emerald-500/[0.06]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      {checked ? (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
      ) : (
        <Circle size={16} className="mt-0.5 shrink-0 text-white/30 group-hover:text-white/60" />
      )}
      <span className={`text-sm leading-relaxed ${checked ? "text-white/50 line-through" : "text-white/80"}`}>
        {checkpoint}
      </span>
    </button>
  );
}

// ─── AI Insight Card ──────────────────────────────────────────────────────────

const insightMeta = {
  tip: { icon: Lightbulb, color: "text-yellow-400", bg: "border-yellow-500/20 bg-yellow-500/[0.05]" },
  warning: { icon: AlertCircle, color: "text-rose-400", bg: "border-rose-500/20 bg-rose-500/[0.05]" },
  star: { icon: Star, color: "text-violet-400", bg: "border-violet-500/20 bg-violet-500/[0.05]" },
};

function InsightCard({ insight }: { insight: AIInsight }) {
  const meta = insightMeta[insight.type];
  const Icon = meta.icon;
  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.01] ${meta.bg}`}>
      <p className={`flex items-center gap-2 text-sm font-semibold ${meta.color}`}>
        <Icon size={14} /> {insight.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{insight.body}</p>
    </div>
  );
}

// ─── Skills Radar Chart ───────────────────────────────────────────────────────

function SkillsRadar({ skills }: { skills: string[] }) {
  const data = skills.slice(0, 7).map((s) => ({
    subject: s,
    score: Math.floor(55 + Math.random() * 40), // placeholder until API returns actual scores
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#ffffff18" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "#ffffff80", fontSize: 11 }} />
        <Radar dataKey="score" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.2} strokeWidth={1.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Roadmap Hours Bar Chart ──────────────────────────────────────────────────

function RoadmapChart({ roadmap }: { roadmap: Roadmap }) {
  const data = [
    ...roadmap["3months"].map((r) => ({ phase: "3M", task: r.task.slice(0, 16) + "…", hours: r.weeklyHours })),
    ...roadmap["6months"].map((r) => ({ phase: "6M", task: r.task.slice(0, 16) + "…", hours: r.weeklyHours })),
    ...roadmap["12months"].map((r) => ({ phase: "12M", task: r.task.slice(0, 16) + "…", hours: r.weeklyHours })),
  ];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
        <XAxis dataKey="task" tick={{ fill: "#ffffff50", fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tick={{ fill: "#ffffff50", fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: "#0f0f1a", border: "1px solid #ffffff20", borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: "#fff" }}
        />
        <Bar dataKey="hours" fill="#a78bfa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview",  label: "Overview",   icon: Sparkles  },
  { id: "roadmap",   label: "Roadmap",    icon: MapPin       },
  { id: "resources", label: "Resources",  icon: BookOpen  },
  { id: "progress",  label: "Progress",   icon: BarChart2 },
  { id: "insights",  label: "AI Insights",icon: Lightbulb },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CareerPage() {
  const [profileText, setProfileText] = useState(
    "Skills: Java, JavaScript, SQL, basic web dev. Projects: AI-CAREER-COACH. Goal: backend/full-stack job."
  );
  const [data, setData]       = useState<CareerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");
  const [tab, setTab]         = useState<Tab>("overview");
  const [checked, setChecked] = useState<boolean[]>([]);
  const [saved, setSaved]     = useState(false);
  const barRef                = useRef<HTMLDivElement>(null);

  // ── Restore from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CareerData = JSON.parse(stored);
        setData(parsed);
        setChecked(new Array(parsed.checkpoints?.length ?? 0).fill(false));
      }
    } catch {
      /* ignore corrupt cache */
    }
  }, []);

  // ── API call ─────────────────────────────────────────────────────────────────
  async function generate() {
    setLoading(true);
    setErr("");
    setData(null);
    setSaved(false);

    const skills = parseSkills(profileText);

    try {
      const res = await fetch(`${API}/api/ai/career`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            raw: profileText,
            skills,
            education: "B.Tech (CSE) student",
            projects: extractProjects(profileText),
            interests: extractInterests(profileText),
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          (errJson as Record<string, string>)?.error ||
          (errJson as Record<string, string>)?.detail ||
          (errJson as Record<string, string>)?.message ||
          `HTTP ${res.status}`
        );
      }

      const json: CareerData = await res.json();
      setData(json);
      setChecked(new Array(json.checkpoints?.length ?? 0).fill(false));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Server error");
    } finally {
      setLoading(false);
    }
  }

  // ── Save to localStorage ──────────────────────────────────────────────────
  function savePlan() {
    if (!data) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ── Toggle checkpoint ──────────────────────────────────────────────────────
  function toggleCheckpoint(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  // ── Helper parsers ────────────────────────────────────────────────────────
  function extractProjects(raw: string): string[] {
    const m = raw.match(/projects?\s*[:\-]\s*([^.]+)/i);
    if (!m) return [];
    return m[1].split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  }
  function extractInterests(raw: string): string[] {
    const m = raw.match(/goal\s*[:\-]\s*([^.]+)/i);
    if (!m) return [];
    return m[1].split(/[\\/,;]+/).map((s) => s.trim()).filter(Boolean);
  }

  // ── Progress stat ─────────────────────────────────────────────────────────
  const doneCount = checked.filter(Boolean).length;
  const totalCount = checked.length;

  // ── Active tab content ────────────────────────────────────────────────────
  function TabContent() {
    if (loading) return <PageSkeleton />;
    if (!data)
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] py-20 text-white/40">
          <Sparkles size={32} className="opacity-30" />
          <p className="text-sm">Enter your profile and hit "Generate" to begin.</p>
        </div>
      );

    switch (tab) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* Roles */}
            <Section title="Recommended Roles" icon={<Star size={15} className="text-violet-400" />}>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.recommendedRoles.map((r, i) => <RoleCard key={i} role={r} />)}
              </div>
            </Section>

            {/* Skill Gap */}
            <Section title="Skill-Gap Analysis" icon={<Zap size={15} className="text-yellow-400" />}>
              <SkillGapCard analysis={data.skillGapAnalysis} />
            </Section>

            {/* Radar chart */}
            <Section title="Current Skill Profile" icon={<TrendingUp size={15} className="text-blue-400" />}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <SkillsRadar skills={data.skillGapAnalysis.alreadyHas} />
              </div>
            </Section>
          </div>
        );

      case "roadmap":
        return (
          <div className="space-y-8">
            <Section title="Learning Roadmap" icon={<MapPin size={15} className="text-cyan-400" />}>
              <div className="grid gap-4 sm:grid-cols-3">
                {(["3months", "6months", "12months"] as const).map((phase) => (
                  <RoadmapCard key={phase} phase={phase} items={data.roadmap[phase]} />
                ))}
              </div>
            </Section>

            <Section title="Weekly Hours Overview" icon={<Clock size={15} className="text-white/50" />}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <RoadmapChart roadmap={data.roadmap} />
              </div>
            </Section>
          </div>
        );

      case "resources":
        return (
          <Section title="Actionable Resources" icon={<BookOpen size={15} className="text-blue-400" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.resources.map((r, i) => <ResourceCard key={i} resource={r} />)}
            </div>
          </Section>
        );

      case "progress":
        return (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-white">Milestones</span>
                <span className="text-white/50">{doneCount}/{totalCount} completed</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-700 ease-out"
                  style={{ width: totalCount ? `${(doneCount / totalCount) * 100}%` : "0%" }}
                />
              </div>
            </div>

            <Section title="Progress Checkpoints" icon={<CheckCircle2 size={15} className="text-emerald-400" />}>
              <div className="space-y-2">
                {data.checkpoints.map((c, i) => (
                  <CheckpointCard
                    key={i}
                    checkpoint={c}
                    index={i}
                    checked={checked[i] ?? false}
                    onToggle={() => toggleCheckpoint(i)}
                  />
                ))}
              </div>
            </Section>
          </div>
        );

      case "insights":
        return (
          <div className="space-y-6">
            <Section title="AI Insights" icon={<Lightbulb size={15} className="text-yellow-400" />}>
              {data.aiInsights && data.aiInsights.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.aiInsights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
                </div>
              ) : (
                /* Fallback derived insights if API doesn't return them */
                <div className="grid gap-4 sm:grid-cols-2">
                  <InsightCard
                    insight={{
                      type: "star",
                      title: "Strong foundation",
                      body: `You already have ${data.skillGapAnalysis.alreadyHas.length} relevant skills. That puts you ahead of many early-career candidates.`,
                    }}
                  />
                  <InsightCard
                    insight={{
                      type: "tip",
                      title: "Best role match",
                      body: `"${data.recommendedRoles[0]?.name}" has the highest fit score (${data.recommendedRoles[0]?.fitScore}/100) — prioritise this track first.`,
                    }}
                  />
                  <InsightCard
                    insight={{
                      type: "warning",
                      title: "Skill gap alert",
                      body: `You're missing skills in ${Object.keys(data.skillGapAnalysis.missingByRole).length} role areas. Start with the 3-month roadmap to close the gaps fastest.`,
                    }}
                  />
                  <InsightCard
                    insight={{
                      type: "tip",
                      title: "Consistent effort",
                      body: "Allocating even 8–10 hrs/week consistently beats intense short sprints. Your roadmap is calibrated for sustainable growth.",
                    }}
                  />
                </div>
              )}
            </Section>
          </div>
        );
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        {/* Title row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
              <Sparkles size={20} className="text-violet-400" />
              Career Path
            </h1>
            <p className="mt-1 text-sm text-white/50">
              AI-powered role recommendations, roadmap & skill analysis.
            </p>
          </div>

          {data && (
            <button
              onClick={savePlan}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
            >
              <Save size={12} />
              {saved ? "Saved!" : "Save plan"}
            </button>
          )}
        </div>

        {/* Profile input */}
        <div className="mt-5 space-y-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-white/50">
            <User size={11} /> Profile snapshot
          </label>
          <textarea
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            rows={3}
            placeholder="Skills: React, Node.js. Projects: MyApp. Goal: full-stack role."
            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/20 outline-none ring-0 transition-all focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all hover:bg-violet-500 hover:shadow-violet-700/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCcw size={14} className="animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Generate Career Plan
                </>
              )}
            </button>

            {err && (
              <p className="flex items-center gap-1.5 text-sm text-rose-400">
                <AlertCircle size={13} /> {err}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="mb-6 flex overflow-x-auto gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              tab === id
                ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
            }`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <TabContent />
    </div>
  );
}

// ─── Generic section wrapper ──────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}