"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) setOk(true);
        else router.replace(`/?next=${encodeURIComponent(pathname || "/dashboard")}`);
      })
      .catch(() => router.replace(`/?next=${encodeURIComponent(pathname || "/dashboard")}`));
  }, [router, pathname]);
  if (!ok) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-6 py-4">
          Checking session...
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
