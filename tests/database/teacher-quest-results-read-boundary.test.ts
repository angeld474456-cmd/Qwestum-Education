import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "database/migrations/048_add_teacher_quest_results_read_boundary.sql"
  ),
  "utf8"
);

const listFunction = migration.slice(
  migration.indexOf("CREATE FUNCTION public.list_teacher_quest_attempts"),
  migration.indexOf("ALTER FUNCTION public.list_teacher_quest_attempts")
);
const detailFunction = migration.slice(
  migration.indexOf("CREATE FUNCTION public.get_teacher_quest_attempt_detail"),
  migration.indexOf("ALTER FUNCTION public.get_teacher_quest_attempt_detail")
);
const listReturnShape = listFunction.slice(
  listFunction.indexOf("RETURNS TABLE"),
  listFunction.indexOf("LANGUAGE plpgsql")
);
const detailReturnShape = detailFunction.slice(
  detailFunction.indexOf("RETURNS TABLE"),
  detailFunction.indexOf("LANGUAGE plpgsql")
);

describe("M048 teacher quest results read boundary contract", () => {
  it("is atomic and fails closed on its M043/M044 schema and object prerequisites", () => {
    const beginIndex = migration.indexOf("BEGIN;");
    const preflightIndex = migration.indexOf("DO $$");
    const firstMutationIndex = migration.indexOf("CREATE INDEX quest_attempts_quest_submitted_at_id_idx");
    const commitIndex = migration.lastIndexOf("COMMIT;");

    expect(beginIndex).toBeGreaterThan(-1);
    expect(beginIndex).toBeLessThan(preflightIndex);
    expect(preflightIndex).toBeLessThan(firstMutationIndex);
    expect(migration).toContain("M043/M044 profile, quest, and student attempt tables are required before applying M048");
    expect(migration).toContain("M048 predecessor tables are missing an expected column; inspect before applying");
    expect(migration).toContain("quest_attempts must retain submitted status semantics before applying M048");
    expect(migration).toContain("student attempt tables must retain RLS before applying M048");
    expect(migration).toContain("teacher quest result RPCs already exist; inspect before applying M048");
    expect(migration).toContain("teacher result listing index already or unexpectedly exists; inspect before applying M048");
    expect(migration.slice(commitIndex).trim()).toBe("COMMIT;");
  });

  it("creates only a narrow submitted-attempt index for the teacher list", () => {
    expect(migration).toContain(
      "CREATE INDEX quest_attempts_quest_submitted_at_id_idx\n  ON public.quest_attempts (quest_id, submitted_at DESC, id DESC)\n  WHERE status = 'submitted';"
    );
    expect(migration).not.toContain("CREATE INDEX quest_attempt_answers");
  });

  it("uses role plus owned-quest checks without an entitlement dependency", () => {
    for (const fn of [listFunction, detailFunction]) {
      expect(fn).toContain("v_actor_id := auth.uid()");
      expect(fn).toContain("INNER JOIN public.profiles AS actor ON actor.id = v_actor_id");
      expect(fn).toContain("q.author_id = v_actor_id");
      expect(fn).toContain("actor.role = 'teacher'");
      expect(fn).toContain("RETURN;");
      expect(fn).not.toContain("has_active_teacher_entitlement");
      expect(fn).not.toContain("current_actor_can_author");
      expect(fn).not.toContain("teacher_entitlements");
    }
  });

  it("returns minimal, historical list data with bounded deterministic pagination", () => {
    expect(listFunction).toContain("p_limit integer DEFAULT 20");
    expect(listFunction).toContain("p_offset integer DEFAULT 0");
    expect(listFunction).toContain("LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50)");
    expect(listFunction).toContain("p_offset < 0");
    expect(listFunction).toContain("p_offset > 10000");
    expect(listFunction).toContain("qa.status = 'submitted'");
    expect(listFunction).toContain("ORDER BY qa.submitted_at DESC, qa.id DESC");
    expect(listFunction).toContain("LIMIT v_limit");
    expect(listFunction).toContain("OFFSET p_offset");
    expect(listFunction).toContain("COALESCE(NULLIF(pg_catalog.btrim(student.full_name), ''), 'Ученик')");
    expect(listReturnShape).not.toContain("student_id");
    expect(listFunction).not.toContain("email");
    expect(listFunction).not.toContain("SELECT *");
  });

  it("binds detail to the owned quest and returns stored task rows in historical order", () => {
    expect(detailFunction).toContain("p_quest_id uuid");
    expect(detailFunction).toContain("p_attempt_id uuid");
    expect(detailFunction).toContain("qa.id = p_attempt_id");
    expect(detailFunction).toContain("qa.quest_id = p_quest_id");
    expect(detailFunction).toContain("qa.status = 'submitted'");
    expect(detailFunction).toContain("INNER JOIN public.quest_attempt_answers AS qaa ON qaa.attempt_id = qa.id");
    expect(detailFunction).toContain("qaa.task_snapshot");
    expect(detailFunction).toContain("qaa.answer_snapshot");
    expect(migration).toContain("('public.quest_attempt_answers'::pg_catalog.regclass, 'status')");
    expect(migration).not.toContain("('public.quest_attempt_answers'::pg_catalog.regclass, 'result_status')");
    expect(detailFunction).toContain("qaa.status AS result_status");
    expect(detailReturnShape).toContain("result_status text");
    expect(detailFunction).toContain("ORDER BY qaa.task_order ASC");
    expect(detailFunction).not.toContain("correctOptionId");
    expect(detailFunction).not.toContain("correctOptionIds");
    expect(detailReturnShape).not.toContain("student_id");
    expect(detailReturnShape).not.toContain("source_task_id");
    expect(detailFunction).not.toContain("email");
    expect(detailFunction).not.toContain("SELECT *");
  });

  it("hardens both public RPCs while leaving direct student RLS unchanged", () => {
    for (const fn of [listFunction, detailFunction]) {
      expect(fn).toContain("SECURITY DEFINER");
      expect(fn).toContain("SET search_path = pg_catalog, public");
      expect(fn).not.toContain("EXECUTE IMMEDIATE");
    }

    expect(migration).toContain("REVOKE ALL ON FUNCTION public.list_teacher_quest_attempts(uuid, integer, integer) FROM PUBLIC");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.list_teacher_quest_attempts(uuid, integer, integer) FROM anon");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.list_teacher_quest_attempts(uuid, integer, integer) FROM service_role");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.list_teacher_quest_attempts(uuid, integer, integer) TO authenticated");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.get_teacher_quest_attempt_detail(uuid, uuid) FROM PUBLIC");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.get_teacher_quest_attempt_detail(uuid, uuid) FROM anon");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.get_teacher_quest_attempt_detail(uuid, uuid) FROM service_role");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.get_teacher_quest_attempt_detail(uuid, uuid) TO authenticated");
    expect(migration).not.toContain("CREATE POLICY");
    expect(migration).not.toContain("ALTER TABLE public.quest_attempts");
    expect(migration).not.toContain("ALTER TABLE public.quest_attempt_answers");
    expect(migration).not.toContain("ALTER TABLE public.profiles");
  });

  it("does not mutate attempt data or depend on unrelated write, billing, or storage boundaries", () => {
    expect(migration).not.toContain("INSERT INTO public.quest_attempts");
    expect(migration).not.toContain("UPDATE public.quest_attempts");
    expect(migration).not.toContain("DELETE FROM public.quest_attempts");
    expect(migration).not.toContain("INSERT INTO public.quest_attempt_answers");
    expect(migration).not.toContain("UPDATE public.quest_attempt_answers");
    expect(migration).not.toContain("DELETE FROM public.quest_attempt_answers");
    expect(migration).not.toContain("storage.objects");
    expect(migration).not.toContain("teacher_entitlements");
  });
});
