import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const fallbackPath = "/dashboard";
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

function getSafeNextUrl(value: string | null, origin: string) {
  const fallbackUrl = new URL(fallbackPath, origin);

  if (
    !value ||
    value.includes("\\") ||
    controlCharacterPattern.test(value) ||
    malformedPercentPattern.test(value) ||
    !hasSafeLocalPath(value)
  ) {
    return fallbackUrl;
  }

  try {
    const destination = new URL(value, origin);

    return destination.origin === origin ? destination : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextUrl = getSafeNextUrl(
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

  return NextResponse.redirect(nextUrl);
}
