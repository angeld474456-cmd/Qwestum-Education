import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CurrentActor =
  {
    id: string;
    role: "teacher" | "student";
    email: string;
  };

export type CurrentActorResult =
  | { status: "unauthenticated" }
  | { status: "profile_unavailable" }
  | { status: "authenticated"; actor: CurrentActor };

type ProfileRow = {
  id: unknown;
  role: unknown;
};

function isActorRole(value: unknown): value is "teacher" | "student" {
  return value === "teacher" || value === "student";
}

export async function getCurrentActor(): Promise<CurrentActorResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthenticated" };

  if (!user.email) return { status: "profile_unavailable" };

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return { status: "profile_unavailable" };

  const profile = data as ProfileRow;

  if (profile.id !== user.id || !isActorRole(profile.role)) {
    return { status: "profile_unavailable" };
  }

  return {
    status: "authenticated",
    actor: {
      id: user.id,
      role: profile.role,
      email: user.email,
    },
  };
}
