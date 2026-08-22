import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "database/migrations/043_add_student_identity_role_foundation.sql"),
  "utf8"
);

describe("M043 student identity role foundation contract", () => {
  it("wraps every state-changing statement in one explicit transaction", () => {
    const beginIndex = migration.indexOf("BEGIN;");
    const firstChangeIndex = migration.indexOf("DO $$");
    const commitIndex = migration.lastIndexOf("COMMIT;");

    expect(beginIndex).toBeGreaterThan(-1);
    expect(beginIndex).toBeLessThan(firstChangeIndex);
    expect(commitIndex).toBeGreaterThan(migration.indexOf("CREATE TRIGGER enforce_teacher_authoring_task_mutation"));
    expect(migration.slice(commitIndex).trim()).toBe("COMMIT;");
  });

  it("preserves only teacher/student roles and defaults new profiles to student", () => {
    expect(migration).toContain("CHECK (role IN ('teacher', 'student'))");
    expect(migration).toContain("ALTER COLUMN role SET DEFAULT 'student'");
    expect(migration).toContain("VALUES (NEW.id, NEW.email, v_full_name, 'student')");
    expect(migration).not.toContain("raw_user_meta_data ->> 'role'");
  });

  it("provisions profiles through an auth.users trigger and permits self-read only", () => {
    const triggerPreflightIndex = migration.indexOf("FROM pg_catalog.pg_trigger AS t");
    const triggerCreateIndex = migration.indexOf("CREATE TRIGGER on_auth_user_created_provision_student_profile");

    expect(migration).toContain("AFTER INSERT ON auth.users");
    expect(migration).toContain("WHERE t.tgrelid = 'auth.users'::pg_catalog.regclass");
    expect(migration).toContain("AND NOT t.tgisinternal");
    expect(migration).toContain("auth.users has an unexpected user-defined trigger");
    expect(migration.slice(triggerPreflightIndex, triggerCreateIndex)).not.toContain("t.tgname");
    expect(triggerPreflightIndex).toBeGreaterThan(-1);
    expect(triggerPreflightIndex).toBeLessThan(triggerCreateIndex);
    expect(migration).toContain("CREATE POLICY profiles_select_own");
    expect(migration).toContain("USING (id = auth.uid())");
    expect(migration).toContain("REVOKE ALL ON TABLE public.profiles FROM authenticated");
    expect(migration).toContain("GRANT SELECT ON TABLE public.profiles TO authenticated");
  });

  it("enforces the teacher predicate across the shared quest and task write boundary", () => {
    expect(migration).toContain("qwestum_private.current_actor_is_teacher()");
    expect(migration).toContain("BEFORE INSERT OR UPDATE OR DELETE ON public.quests");
    expect(migration).toContain("BEFORE INSERT OR UPDATE OR DELETE ON public.quest_tasks");
    expect(migration).toContain("REVOKE ALL ON FUNCTION qwestum_private.current_actor_is_teacher() FROM authenticated");
    expect(migration).toContain("create/update/delete/duplicate quests");
    expect(migration).toContain("task create/update/delete/reorder/image mutations");
  });
});
