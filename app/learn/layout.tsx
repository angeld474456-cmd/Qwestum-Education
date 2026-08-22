import { redirect } from "next/navigation";

import { getProtectedAreaRedirect } from "@/services/actor-routing";
import { getCurrentActor } from "@/services/current-actor.server";

export default async function LearnLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const redirectPath = getProtectedAreaRedirect(
    await getCurrentActor(),
    "learn"
  );

  if (redirectPath) redirect(redirectPath);

  return children;
}
