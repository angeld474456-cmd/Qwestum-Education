import { NextResponse } from "next/server";

import { duplicateOwnedQuest } from "@/services/teacher-quest-duplication.server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Invalid quest id." }, { status: 400 });
  }

  const result = await duplicateOwnedQuest(id);

  if (result.status === "ok") {
    return NextResponse.json({ id: result.id });
  }

  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  return NextResponse.json(
    { error: "Unable to duplicate quest." },
    { status: 500 }
  );
}
