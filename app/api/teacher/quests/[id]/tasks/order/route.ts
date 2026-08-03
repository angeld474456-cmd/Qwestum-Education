import { NextResponse } from "next/server";

import { reorderOwnedQuestTasks } from "@/services/teacher-task-ordering.server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const invalidMessage = "Invalid task order.";
const failedMessage = "Unable to change task order. Refresh the page.";
const maxBodyBytes = 32 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

function parseBody(value: unknown): string[] | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    !Object.prototype.hasOwnProperty.call(value, "taskIds")
  ) {
    return null;
  }

  const taskIds = (value as { taskIds?: unknown }).taskIds;

  if (
    !Array.isArray(taskIds) ||
    taskIds.length < 1 ||
    taskIds.length > 100 ||
    taskIds.some((id) => typeof id !== "string" || !uuidPattern.test(id)) ||
    new Set(taskIds).size !== taskIds.length
  ) {
    return null;
  }

  return taskIds;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: invalidMessage }, { status: 400 });
  }

  const contentType = request.headers.get("content-type");
  if (
    !contentType ||
    contentType.split(";", 1)[0].trim().toLowerCase() !== "application/json"
  ) {
    return NextResponse.json({ error: invalidMessage }, { status: 400 });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBodyBytes) {
    return NextResponse.json({ error: invalidMessage }, { status: 400 });
  }

  let body: unknown;
  try {
    const bytes = await request.arrayBuffer();

    if (bytes.byteLength > maxBodyBytes) {
      return NextResponse.json({ error: invalidMessage }, { status: 400 });
    }

    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return NextResponse.json({ error: invalidMessage }, { status: 400 });
  }

  const taskIds = parseBody(body);
  if (!taskIds) {
    return NextResponse.json({ error: invalidMessage }, { status: 400 });
  }

  const result = await reorderOwnedQuestTasks(id, taskIds);
  if (result.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (result.status === "not_found") {
    return NextResponse.json({ error: failedMessage }, { status: 404 });
  }

  if (result.status === "error") {
    return NextResponse.json({ error: failedMessage }, { status: 500 });
  }

  return NextResponse.json({ taskIds: result.taskIds });
}
