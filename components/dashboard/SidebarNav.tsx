"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export default function SidebarNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <HomeIcon />,
    },
    {
      label: "Resume Builder",
      href: "/dashboard/resume",
      icon: <DocIcon />,
    },
    {
      label: "Interview Prep",
      href: "/dashboard/interview",
      icon: <MicIcon />,
    },
    {
      label: "Sessions",
      href: "/dashboard/sessions",
      icon: <CalendarIcon />,
    },
    {
      label: "Career Path",
      href: "/dashboard/career",
      icon: <CompassIcon />,
    },
  ];

  return (
    <aside className="h-full w-full rounded-3xl border border-slate-700/40 bg-slate-900/30 p-4 shadow-lg backdrop-blur">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
        <div>
          <div className="text-sm font-semibold text-white">AI Career Coach</div>
          <div className="text-xs text-slate-300">Dashboard</div>
        </div>
      </div>

      <div className="px-2">
        <div className="mb-3 text-xs font-bold tracking-widest text-slate-400">
          NAVIGATION
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 transition",
                  "border border-transparent",
                  active
                    ? "bg-indigo-500/20 border-indigo-400/40 shadow-[0_0_0_1px_rgba(99,102,241,0.25)]"
                    : "hover:bg-slate-200/5 hover:border-slate-600/40",
                ].join(" ")}
              >
                <div
                  className={[
                    "grid h-9 w-9 place-items-center rounded-xl transition",
                    active
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-200/10 text-slate-200 group-hover:bg-slate-200/15",
                  ].join(" ")}
                >
                  {item.icon}
                </div>

                <div className="flex-1">
                  <div
                    className={[
                      "text-sm font-semibold transition",
                      active ? "text-white" : "text-slate-200",
                    ].join(" ")}
                  >
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {active ? "Active" : "Open"}
                  </div>
                </div>

                <div
                  className={[
                    "h-2 w-2 rounded-full transition",
                    active ? "bg-indigo-400" : "bg-slate-600 group-hover:bg-slate-400",
                  ].join(" ")}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Goal Card */}
      <div className="mt-6 rounded-3xl border border-slate-700/40 bg-slate-950/40 p-4">
        <div className="text-xs font-bold tracking-widest text-slate-400">
          YOUR GOAL
        </div>
        <div className="mt-2 text-sm font-semibold text-white">
          Complete profile + 2 mock interviews this week.
        </div>
        <button className="mt-3 w-full rounded-2xl bg-slate-200/10 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-200/15">
          View plan →
        </button>
      </div>
    </aside>
  );
}

/* ---------- Minimal Icons (no extra library needed) ---------- */

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3h7l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M14 3v4a1 1 0 0 0 1 1h4"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19 11a7 7 0 0 1-14 0"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M14.5 9.5l-2 5-5 2 2-5 5-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}