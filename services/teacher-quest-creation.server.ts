import "server-only";

import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CreateOwnedQuestInput = {
  title: string;
  description: string;
  difficulty: number;
};

export type CreateOwnedQuestResult =
  | { status: "ok"; id: string }
  | { status: "invalid" | "unauthorized" | "error" };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>) {
  const keys = Object.keys(value).sort();
  return keys.length === 2 && keys[0] === "id" && keys[1] === "outcome";
}

export async function createOwnedQuest(
  input: CreateOwnedQuestInput
): Promise<CreateOwnedQuestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthorized" };

  let data: unknown;
  let error: unknown;

  try {
    ({ data, error } = await supabase.rpc("create_owned_quest", {
      p_title: input.title,
      p_description: input.description,
      p_difficulty: input.difficulty,
    }));
  } catch {
    return { status: "error" };
  }

  if (error || !Array.isArray(data) || data.length !== 1 || !isPlainObject(data[0])) {
    return { status: "error" };
  }

  const row = data[0];

  if (!hasExactKeys(row)) return { status: "error" };
  if (row.outcome === "created" && typeof row.id === "string" && uuidPattern.test(row.id)) {
    return { status: "ok", id: row.id };
  }
  if (row.outcome === "invalid" && row.id === null) return { status: "invalid" };

  return { status: "error" };
}
