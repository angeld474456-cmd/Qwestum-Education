import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Statistics from "@/components/dashboard/Statistics";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentQuests from "@/components/dashboard/RecentQuests";

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen bg-[#070B14] text-white">

      <Sidebar />

      <section className="flex-1">

        <Topbar />

        <div className="p-10">

          <Statistics />

          <QuickActions />

          <RecentQuests />

        </div>

      </section>

    </main>
  );
}