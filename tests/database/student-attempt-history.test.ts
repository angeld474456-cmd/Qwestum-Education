import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "database/migrations/044_add_student_attempt_history.sql"),
  "utf8"
);

describe("M044 student attempt history contract", () => {
  it("is one explicit atomic migration with defensive collision checks", () => {
    const beginIndex = migration.indexOf("BEGIN;");
    const firstChangeIndex = migration.indexOf("DO $$");
    const commitIndex = migration.lastIndexOf("COMMIT;");

    expect(beginIndex).toBeGreaterThan(-1);
    expect(beginIndex).toBeLessThan(firstChangeIndex);
    expect(migration).toContain("student attempt tables already exist; inspect before applying M044");
    expect(migration).toContain("student attempt functions already exist; inspect before applying M044");
    expect(migration).toContain("student attempt policies already exist; inspect before applying M044");
    expect(migration.slice(commitIndex).trim()).toBe("COMMIT;");
  });

  it("defines immutable attempt states, history indexes, and no live task foreign key", () => {
    expect(migration).toContain("REFERENCES public.quests(id) ON DELETE RESTRICT");
    expect(migration).toContain("quest_attempts_one_started_per_student_quest_idx");
    expect(migration).toContain("WHERE status = 'started'");
    expect(migration).toContain("quest_attempts_student_submitted_at_idx");
    expect(migration).toContain("PRIMARY KEY (attempt_id, source_task_id)");
    expect(migration).toContain("UNIQUE (attempt_id, task_order)");
    expect(migration).not.toContain("source_task_id uuid NOT NULL REFERENCES public.quest_tasks");
    expect(migration).toContain("status IN ('started', 'submitted', 'abandoned')");
    expect(migration).toContain("status IN ('correct', 'incorrect', 'unanswered', 'not_scored')");
  });

  it("limits direct table access to own-history reads", () => {
    expect(migration).toContain("CREATE POLICY quest_attempts_select_own");
    expect(migration).toContain("USING (student_id = auth.uid())");
    expect(migration).toContain("CREATE POLICY quest_attempt_answers_select_own");
    expect(migration).toContain("REVOKE ALL ON TABLE public.quest_attempts FROM authenticated");
    expect(migration).toContain("REVOKE ALL ON TABLE public.quest_attempt_answers FROM authenticated");
    expect(migration).toContain("GRANT SELECT ON TABLE public.quest_attempts TO authenticated");
    expect(migration).toContain("GRANT SELECT ON TABLE public.quest_attempt_answers TO authenticated");
  });

  it("uses student-only authenticated RPCs with idempotent start and submitted retry", () => {
    expect(migration).toContain("qwestum_private.current_actor_is_student()");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("AND qa.status = 'started'");
    expect(migration).toContain("IF v_attempt.status = 'submitted' THEN");
    expect(migration.indexOf("IF v_attempt.status = 'submitted' THEN")).toBeLessThan(
      migration.indexOf("IF NOT public.is_public_runtime_eligible(v_attempt.quest_id) THEN")
    );
    expect(migration).toContain("public.score_public_runtime_quest(v_attempt.quest_id, p_answers)");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.start_student_quest_attempt(uuid) TO authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.submit_student_quest_attempt(uuid, jsonb) TO authenticated");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.start_student_quest_attempt(uuid) FROM anon");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.submit_student_quest_attempt(uuid, jsonb) FROM anon");
  });

  it("uses quest -> attempt -> task locks so student RPCs serialize with quest deletion", () => {
    const startFunction = migration.slice(
      migration.indexOf("CREATE FUNCTION public.start_student_quest_attempt"),
      migration.indexOf("CREATE FUNCTION public.submit_student_quest_attempt")
    );
    const submitFunction = migration.slice(
      migration.indexOf("CREATE FUNCTION public.submit_student_quest_attempt")
    );

    expect(startFunction.indexOf("FROM public.quests AS q")).toBeLessThan(
      startFunction.indexOf("FROM public.quest_attempts AS qa")
    );
    expect(startFunction.indexOf("FROM public.quest_attempts AS qa")).toBeLessThan(
      startFunction.indexOf("FROM public.quest_tasks AS qt")
    );
    expect(submitFunction).toContain("SELECT qa.quest_id\n  INTO v_quest_id");
    expect(submitFunction.indexOf("FROM public.quests AS q")).toBeLessThan(
      submitFunction.lastIndexOf("FROM public.quest_attempts AS qa")
    );
    expect(submitFunction.lastIndexOf("FROM public.quest_attempts AS qa")).toBeLessThan(
      submitFunction.indexOf("FROM public.quest_tasks AS qt")
    );
    expect(submitFunction).toContain("AND qa.quest_id = v_quest_id");
  });

  it("derives attempt ownership from auth.uid and rejects non-started states before scoring", () => {
    expect(migration).toContain("v_student_id := auth.uid()");
    expect(migration).toContain("p_attempt_id uuid");
    expect(migration).toContain("AND qa.student_id = v_student_id");
    expect(migration).toContain("IF v_attempt.status <> 'started' THEN");
    expect(migration).toContain("FOR UPDATE;");
    expect(migration).toContain("FOR SHARE;");
    expect(migration).toContain("IF NOT public.is_public_runtime_eligible(v_attempt.quest_id) THEN");
  });

  it("persists only sanitized runtime task snapshots and preserves Text 0/0 semantics", () => {
    const snapshotInsertIndex = migration.indexOf("INSERT INTO public.quest_attempt_answers");
    const snapshotSection = migration.slice(snapshotInsertIndex);

    expect(snapshotSection).toContain("v_runtime_tasks");
    expect(snapshotSection).toContain("WHEN 'text' THEN '{}'::jsonb");
    expect(snapshotSection).toContain("ELSE 0::bigint");
    expect(snapshotSection).not.toContain("qt.content");
    expect(migration).toContain("NOT (task_snapshot ? 'correctOptionId')");
    expect(migration).toContain("NOT (task_snapshot ? 'correctOptionIds')");
    expect(migration).toContain("'selectedOptionId'");
    expect(migration).toContain("'selectedOptionIds'");
    expect(migration).toContain("student attempt snapshot did not contain every scored task");
  });
});
