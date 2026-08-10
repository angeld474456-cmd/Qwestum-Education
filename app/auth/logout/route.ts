import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.warn("Teacher logout failed.", {
      error: error.message,
    });

    return NextResponse.redirect(
      new URL("/login?error=logout_failed", requestUrl.origin),
      { status: 303 }
    );
  }

  return NextResponse.redirect(
    new URL("/login?logged_out=1", requestUrl.origin),
    { status: 303 }
  );
}
