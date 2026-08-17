import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActorHome } from "@/services/actor-routing";
import { getCurrentActor } from "@/services/current-actor.server";

const controlCharacterPattern = /[\u0000-\u001f\u007f]/;
const malformedPercentPattern = /%(?![0-9a-f]{2})/i;

function hasSafeLocalPath(value: string) {
  let candidate = value;

  for (let depth = 0; depth < 4; depth += 1) {
    if (
      !candidate.startsWith("/") ||
      candidate.startsWith("//") ||
      candidate.includes("\\") ||
      controlCharacterPattern.test(candidate) ||
      malformedPercentPattern.test(candidate)
    ) {
      return false;
    }

    if (!candidate.includes("%")) {
      return true;
    }

    try {
      candidate = decodeURIComponent(candidate);
    } catch {
      return false;
    }
  }

  return false;
}

function getSafeNextPath(value: string | null, origin: string) {
  if (
    !value ||
    value.includes("\\") ||
    controlCharacterPattern.test(value) ||
    malformedPercentPattern.test(value) ||
    !hasSafeLocalPath(value)
  ) {
    return null;
  }

  try {
    const destination = new URL(value, origin);

    return destination.origin === origin
      ? destination.pathname + destination.search + destination.hash
      : null;
  } catch {
    return null;
  }
}

function matchesPath(path: string, prefix: string) {
  return path === prefix || path.startsWith(prefix + "/");
}

function isAllowedNextPath(path: string, role: "teacher" | "student") {
  const pathname = new URL(path, "https://qwestum.local").pathname;

  if (pathname === "/" || matchesPath(pathname, "/catalog")) return true;
  if (role === "teacher") return matchesPath(pathname, "/dashboard");

  return matchesPath(pathname, "/learn");
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(
    requestUrl.searchParams.get("next"),
    requestUrl.origin
  );

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_auth_code", requestUrl.origin)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", requestUrl.origin)
    );
  }

  const actorResult = await getCurrentActor();

  if (actorResult.status !== "authenticated") {
    return NextResponse.redirect(
      new URL("/account-unavailable", requestUrl.origin)
    );
  }

  const destination =
    nextPath && isAllowedNextPath(nextPath, actorResult.actor.role)
      ? nextPath
      : getActorHome(actorResult);

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
