"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarNav from "@/components/dashboard/SidebarNav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function logout() {
    try {
      await fetch(`${API}/auth/logout`, { method: "GET", credentials: "include" });
    } catch { }
    window.location.href = "/login";
  }

  const section =
    pathname.startsWith("/dashboard/resume") ? "Resume" :
      pathname.startsWith("/dashboard/interview") ? "Interview" :
        pathname.startsWith("/dashboard/quiz") ? "Quiz" :
          pathname.startsWith("/dashboard/sessions") ? "Sessions" :
            pathname.startsWith("/dashboard/career") ? "Career" :
              "Dashboard";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
          <Link href="/dashboard" className="text-sm font-semibold text-white">
            AI Career Coach
            <span className="ml-2 text-xs text-slate-400">{section}</span>
          </Link>

          <button
            onClick={logout}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-12 lg:col-span-3">
          <SidebarNav />
        </aside>

        <main className="col-span-12 lg:col-span-9">
          <div className="rounded-3xl border border-white/10 bg-slate-900/20 p-6 shadow-xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}



