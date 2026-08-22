import type { CurrentActorResult } from "@/services/current-actor.server";

export type ProtectedArea = "dashboard" | "learn";

export function getActorHome(result: CurrentActorResult) {
  if (result.status !== "authenticated") return "/account-unavailable";

  return result.actor.role === "teacher" ? "/dashboard" : "/learn";
}

export function getProtectedAreaRedirect(
  result: CurrentActorResult,
  area: ProtectedArea
) {
  if (result.status === "unauthenticated") return "/login";
  if (result.status === "profile_unavailable") return "/account-unavailable";

  if (area === "dashboard" && result.actor.role === "student") {
    return "/learn";
  }

  if (area === "learn" && result.actor.role === "teacher") {
    return "/dashboard";
  }

  return null;
}

export function getLoginRedirect(result: CurrentActorResult) {
  if (result.status === "unauthenticated") return null;

  return getActorHome(result);
}
