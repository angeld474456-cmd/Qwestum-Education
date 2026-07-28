import { NextResponse } from "next/server";

import { setOwnedQuestPublicationState } from "@/services/teacher-publication.server";
import type { PublicationAction } from "@/types/publication";

type Context = { params: Promise<{ id: string }> };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function parseAction(value: unknown): PublicationAction | null {
  if (!isPlainObject(value)) return null;
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== "action") return null;
  return value.action === "publish" || value.action === "unpublish" ? value.action : null;
}

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  if (!uuid.test(id)) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid publication action." }, { status: 400 });
  }

  const action = parseAction(body);
  if (!action) {
    return NextResponse.json({ error: "Invalid publication action." }, { status: 400 });
  }

  const result = await setOwnedQuestPublicationState(id, action);
  if (result.status === "ok") {
    return NextResponse.json({ publication: result.publication });
  }
  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (result.status === "not_found") {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }
  if (result.status === "blocked") {
    return NextResponse.json(
      { error: "Quest is not ready for publication." },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { error: "Unable to update publication state." },
    { status: 500 },
  );
}
