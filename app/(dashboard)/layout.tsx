import AppShell from "@/components/layout/AppShell";
import Sidebar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      sidebar={<Sidebar />}
      header={<DashboardHeader />}
    >
      {children}
    </AppShell>
  );
}