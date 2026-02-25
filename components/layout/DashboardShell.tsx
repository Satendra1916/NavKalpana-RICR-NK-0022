"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  function logout() {
    window.location.href = `${API}/auth/logout`;
  }

  // ✅ smart active checker (important upgrade)
  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* subtle bg glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(99,102,241,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />

      <div className="relative z-10">
        {/* ================= Topbar ================= */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/25" />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">AI Career Coach</div>
                <div className="text-xs text-slate-400">Dashboard</div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {/* search */}
              <input
                className="hidden w-72 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-violet-500/40 md:block"
                placeholder="Search (resume, sessions...)"
              />

              {/* help */}
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 hover:bg-slate-900/70 transition"
              >
                Help
              </button>

              {/* logout */}
              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* ================= Page grid ================= */}
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-6">
          {/* ===== Sidebar ===== */}
          <aside className="col-span-12 md:col-span-3">
            <div className="h-full rounded-3xl bg-slate-950/60 p-5 shadow-2xl ring-1 ring-white/5 backdrop-blur">
              <p className="mb-4 text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">
                Navigation
              </p>

              <nav className="space-y-2">
                <SideLink href="/dashboard" label="Dashboard" icon="🏠" active={isActive("/dashboard")} />
                <SideLink href="/dashboard/resume" label="Resume Builder" icon="📄" active={isActive("/dashboard/resume")} />
                <SideLink href="/dashboard/interview" label="Interview Prep" icon="🎤" active={isActive("/dashboard/interview")} />
                <SideLink href="/dashboard/sessions" label="Sessions" icon="📅" active={isActive("/dashboard/sessions")} />
                <SideLink href="/dashboard/career" label="Career Path" icon="🧭" active={isActive("/dashboard/career")} />
              </nav>

              {/* goal card */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                  Your goal
                </p>
                <p className="text-sm text-slate-100">
                  Complete profile + 2 mock interviews this week.
                </p>
                <Link
                  href="/dashboard/career"
                  className="mt-3 inline-flex items-center text-xs font-semibold text-violet-300 hover:text-violet-200"
                >
                  View plan →
                </Link>
              </div>
            </div>
          </aside>

          {/* ===== Main ===== */}
          <main className="col-span-12 md:col-span-9">{children}</main>
        </div>

        {/* ================= Help modal ================= */}
        {helpOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-white">Help</div>
                  <div className="mt-1 text-sm text-slate-300">
                    Quick actions to use your AI Career Coach.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 hover:bg-slate-900/70"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-200">
                <HelpItem title="Resume Builder">
                  Upload resume → Improve with AI → Download
                </HelpItem>

                <HelpItem title="Interview Prep">
                  Start mock interview → get feedback
                </HelpItem>

                <HelpItem title="Sessions">
                  Join upcoming sessions and track progress
                </HelpItem>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= Components ================= */

function SideLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-200"
          : "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100/80 hover:bg-slate-900 hover:text-white transition-all duration-150"
      }
    >
      <span
        className={
          active
            ? "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15"
            : "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-violet-300"
        }
      >
        {icon}
      </span>

      <span className={active ? "text-sm font-semibold" : "text-sm font-medium"}>
        {label}
      </span>
    </Link>
  );
}

function HelpItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <div className="font-semibold text-white">{title}</div>
      {children}
    </div>
  );
}
