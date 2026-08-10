import "server-only";

import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type DuplicateOwnedQuestResult =
  | { status: "ok"; id: string }
  | { status: "unauthorized" | "not_found" | "error" };

export async function duplicateOwnedQuest(
  sourceQuestId: string
): Promise<DuplicateOwnedQuestResult> {
  if (!uuidPattern.test(sourceQuestId)) {
    return { status: "not_found" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthorized" };
  }

  let data: unknown;
  let error: unknown;

  try {
    ({ data, error } = await supabase.rpc("duplicate_owned_quest", {
      source_quest_id: sourceQuestId,
    }));
  } catch {
    return { status: "error" };
  }

  if (error) {
    return { status: "error" };
  }

  if (data === null) {
    return { status: "not_found" };
  }

  if (typeof data !== "string" || !uuidPattern.test(data)) {
    return { status: "error" };
  }

  return { status: "ok", id: data };
}
