import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CurrentActor =
  | {
      id: string;
      role: "teacher" | "student";
      email: string;
    }
  | null;

type ProfileRow = {
  id: unknown;
  role: unknown;
};

function isActorRole(value: unknown): value is "teacher" | "student" {
  return value === "teacher" || value === "student";
}

export async function getCurrentActor(): Promise<CurrentActor> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  const profile = data as ProfileRow;

  if (profile.id !== user.id || !isActorRole(profile.role)) return null;

  return {
    id: user.id,
    role: profile.role,
    email: user.email,
  };
}
