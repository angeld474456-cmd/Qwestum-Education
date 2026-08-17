import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getProtectedAreaRedirect } from "@/services/actor-routing";
import { getCurrentActor } from "@/services/current-actor.server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actorResult = await getCurrentActor();
  const redirectPath = getProtectedAreaRedirect(actorResult, "dashboard");

  if (redirectPath) redirect(redirectPath);
  if (actorResult.status !== "authenticated") {
    redirect("/account-unavailable");
  }

  const actor = actorResult.actor;

  return (
    <div className="flex min-h-screen bg-[#070B14]">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <DashboardHeader teacherEmail={actor.email} />

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
