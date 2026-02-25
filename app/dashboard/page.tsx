"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export default function DashboardPage() {
  const router = useRouter();
   const [progress, setProgress] = useState(45);
const [stats, setStats] = useState({
  resumesCreated: 0,
  mockInterviewsDone: 0,
  companiesSaved: 0,
  profileStrength: 0,
});
const [practice, setPractice] = useState<{ month: string; value: number }[]>([]);


useEffect(() => {
  async function loadDashboard() {
    try {
      const res = await fetch(`${API}/api/ai/dashboard/analytics`, {
        credentials: "include",
      });

      const data = await res.json();

      console.log("✅ useEffect ran");
      console.log("DASHBOARD ANALYTICS:", data);

      setProgress(data?.progress ?? 45);

      setStats({
        resumesCreated: data?.stats?.resumesCreated ?? 0,
        mockInterviewsDone: data?.stats?.mockInterviewsDone ?? 0,
        companiesSaved: data?.stats?.companiesSaved ?? 0,
        profileStrength: data?.stats?.profileStrength ?? 0,
      });

      setPractice(Array.isArray(data?.practiceOverTime) ? data.practiceOverTime : []);
    } catch (err) {
      console.error("Analytics fetch failed", err);
    }
  }

  loadDashboard();
}, []);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Focus Mode */}
        <div className="col-span-12 lg:col-span-7 rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-3xl font-extrabold leading-tight text-white">
                Welcome back,<br /> Ranjeet
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Keep moving — your next best step is ready.
              </p>
              <div className="mt-5 flex gap-3">
              <button
               onClick={() => router.push("/dashboard/resume")}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white"
>
  Continue Resume
</button>
                   <button
  onClick={() => router.push("/dashboard/interview")}
  className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/70"
>
  Start Mock Interview
</button>          </div>
            </div>
            {/* Progress ring (simple) */}
            <div className="flex flex-col items-center">
              <div className="text-sm font-semibold text-slate-300">Career journey</div>
              <div className="mt-3 grid place-items-center h-28 w-28 rounded-full border border-white/10 bg-slate-900/40">
               <div className="text-3xl font-extrabold text-white">{progress}%</div>
                <div className="text-xs text-slate-400 -mt-1">complete</div>
              </div>
            </div>
          </div>
        </div>
        {/* Stat cards */}
        <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-4">
         <Stat title="Resumes created" value={`${stats.resumesCreated}`} />
         <Stat title="Mock interviews done" value={`${stats.mockInterviewsDone}`} />
         <Stat title="Companies saved" value={`${stats.companiesSaved}`} />
         <Stat title="Profile strength" value={`${stats.profileStrength}%`} />
        </div>
      </div>
      {/* Middle charts */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl">
          <div className="text-base font-bold text-white">Practice Over Time</div>
          <div className="text-xs text-slate-400 mt-1">Mock activity (demo)</div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/30 p-4">
  {practice.length === 0 ? (
    <div className="text-sm text-slate-400">No data yet.</div>
  ) : (
    <div className="space-y-3">
      {practice.map((p) => (
        <div key={p.month} className="flex items-center gap-3">
          <div className="w-10 text-xs text-slate-300">{p.month}</div>
          <div className="h-2 flex-1 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-violet-500"
              style={{ width: `${Math.min(100, p.value * 15)}%` }}
            />
          </div>
          <div className="w-6 text-right text-xs text-slate-300">{p.value}</div>
        </div>
      ))}
    </div>
  )}
</div>
        </div>
        <div className="col-span-12 lg:col-span-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl">
          <div className="text-base font-bold text-white">Skills Coverage</div>
          <div className="text-xs text-slate-400 mt-1">Current focus (demo)</div>
          <div className="mt-5 space-y-4">
            <Skill name="Java" value={80} />
            <Skill name="Spring" value={60} />
            <Skill name="React" value={45} />
            <Skill name="DSA" value={35} />
          </div>
        </div>
      </div>
      {/* Bottom */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl">
          <div className="text-base font-bold text-white">Todo for this week</div>
          <div className="mt-4 space-y-3">
            <Todo title="Review Java concepts" status="Pending" />
            <Todo title="Update LinkedIn profile" status="In Progress" />
            <Todo title="Practice coding problems" status="Completed" />
          </div>
        </div>
        <div className="col-span-12 lg:col-span-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl">
          <div className="text-base font-bold text-white">Upcoming Sessions</div>
          <div className="mt-4 space-y-3">
            <Session date="Feb 24" title="Behavioral Interview" />
            <Session date="Feb 26" title="Coding Challenge" />
            <Session date="Mar 1" title="Career Coaching" />
          </div>
        </div>
      </div>
    </div>
  );
}
function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value}</div>
      <div className="mt-3 h-1 w-full rounded-full bg-white/10">
        <div className="h-1 w-2/3 rounded-full bg-violet-500" />
      </div>
    </div>
  );
}
function Skill({ name, value }: { name: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <div className="font-semibold text-slate-200">{name}</div>
        <div className="text-slate-300">{value}%</div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-violet-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
function Todo({ title, status }: { title: string; status: string }) {
  const chip =
    status === "Completed"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
      : status === "In Progress"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/20"
      : "bg-slate-500/15 text-slate-200 border-slate-500/20";
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/30 px-4 py-3">
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className={`text-xs font-semibold px-3 py-1 rounded-full border ${chip}`}>{status}</div>
    </div>
  );
}
function Session({ date, title }: { date: string; title: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/30 px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="text-sm font-bold text-white">{date}</div>
        <div className="text-sm text-slate-200">{title}</div>
      </div>

      <button
        onClick={() => alert(`Joining: ${title} (${date})`)}
        className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white"
      >
        Join
      </button>
    </div>
  );
}