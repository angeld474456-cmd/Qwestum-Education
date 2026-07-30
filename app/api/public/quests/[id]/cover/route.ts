import { NextResponse } from "next/server";

import { getPublicCatalogCover } from "@/services/public-catalog-cover.server";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function notFoundResponse() {
  return NextResponse.json(
    { error: "Cover not found" },
    { status: 404, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;

  if (!uuidPattern.test(id)) return notFoundResponse();

  const result = await getPublicCatalogCover(id);

  if (result.status === "not_found") return notFoundResponse();
  if (result.status === "internal_error") {
    return NextResponse.json(
      { error: "Unable to load cover" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const body = Uint8Array.from(result.bytes).buffer;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": result.contentLength.toString(),
      "Cache-Control": "private, max-age=60, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
