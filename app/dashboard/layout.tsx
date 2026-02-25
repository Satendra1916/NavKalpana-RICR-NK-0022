import SidebarNav from "@/components/dashboard/SidebarNav";
import RequireAuth from "@/components/RequireAuth";
import DashboardShell from "@/components/layout/DashboardShell";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
