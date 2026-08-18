import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/services/current-actor.server";

type EntitlementRow = {
  status: unknown;
  access_expires_at: unknown;
};

export type TeacherAuthoringAccessResult =
  | { status: "allowed"; userId: string }
  | {
      status:
        | "unauthenticated"
        | "profile_unavailable"
        | "not_teacher"
        | "entitlement_inactive";
    };

function hasActiveEntitlement(row: unknown, now: Date): boolean {
  if (!row || typeof row !== "object" || Array.isArray(row)) return false;

  const entitlement = row as EntitlementRow;

  if (
    entitlement.status !== "trialing" &&
    entitlement.status !== "active"
  ) {
    return false;
  }

  if (entitlement.access_expires_at === null) return true;
  if (typeof entitlement.access_expires_at !== "string") return false;

  const expiresAt = new Date(entitlement.access_expires_at);
  return Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() > now.getTime();
}

export async function getTeacherAuthoringAccess(): Promise<TeacherAuthoringAccessResult> {
  const actorResult = await getCurrentActor();

  if (actorResult.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (actorResult.status === "profile_unavailable") {
    return { status: "profile_unavailable" };
  }

  if (actorResult.actor.role !== "teacher") {
    return { status: "not_teacher" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_entitlements")
    .select("status, access_expires_at")
    .eq("user_id", actorResult.actor.id)
    .maybeSingle();

  if (error || !hasActiveEntitlement(data, new Date())) {
    return { status: "entitlement_inactive" };
  }

  return { status: "allowed", userId: actorResult.actor.id };
}
