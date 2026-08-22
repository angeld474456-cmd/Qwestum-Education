import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "database/migrations/046_enforce_teacher_authoring_entitlement.sql"
  ),
  "utf8"
);

describe("M046 teacher authoring entitlement enforcement contract", () => {
  it("is an atomic migration with fail-closed predecessor and trigger preflight", () => {
    const beginIndex = migration.indexOf("BEGIN;");
    const firstChangeIndex = migration.indexOf("DO $$");
    const commitIndex = migration.lastIndexOf("COMMIT;");

    expect(beginIndex).toBeGreaterThan(-1);
    expect(beginIndex).toBeLessThan(firstChangeIndex);
    expect(migration).toContain("M045 commercial entitlement tables are required before applying M046");
    expect(migration).toContain("M043/M045 authoring prerequisites are required before applying M046");
    expect(migration).toContain("teacher authoring guard has an unexpected definition; inspect before applying M046");
    expect(migration).toContain("IF auth.uid() IS NULL OR qwestum_private.current_actor_is_teacher() THEN");
    expect(migration).toContain("LIKE '%qwestum_private.has_active_teacher_entitlement(%'");
    expect(migration).toContain("quest/task authoring triggers must point to the expected guard before applying M046");
    expect(migration).toContain("publication RPC has an unexpected definition; inspect before applying M046");
    expect(migration).toContain("p.prosecdef");
    expect(migration).toContain("publication RPC must be SECURITY DEFINER before applying M046");
    expect(migration).toContain("p.proconfig = ARRAY['search_path=pg_catalog, public']::text[]");
    expect(migration).toContain("publication RPC must use the expected fixed search_path before applying M046");
    expect(migration).toContain("pg_catalog.has_function_privilege(");
    expect(migration).toContain("publication RPC must grant EXECUTE to authenticated before applying M046");
    expect(migration).toContain("publication RPC must not grant EXECUTE to anon before applying M046");
    expect(migration).toContain("acl.grantee = 0");
    expect(migration).toContain("publication RPC must not grant EXECUTE to PUBLIC before applying M046");
    expect(migration.indexOf("publication RPC must be SECURITY DEFINER before applying M046")).toBeLessThan(
      migration.indexOf("CREATE FUNCTION qwestum_private.current_actor_can_author")
    );
    expect(migration.slice(commitIndex).trim()).toBe("COMMIT;");
  });

  it("adds a private, identity-plus-entitlement authoring predicate", () => {
    const predicate = migration.slice(
      migration.indexOf("CREATE FUNCTION qwestum_private.current_actor_can_author"),
      migration.indexOf("ALTER FUNCTION qwestum_private.current_actor_can_author")
    );

    expect(predicate).toContain("auth.uid() IS NOT NULL");
    expect(predicate).toContain("qwestum_private.current_actor_is_teacher()");
    expect(predicate).toContain("qwestum_private.has_active_teacher_entitlement(auth.uid())");
    expect(predicate).toContain("SECURITY DEFINER");
    expect(predicate).toContain("SET search_path = pg_catalog, public");
    expect(predicate).not.toContain("p_target_user_id");
    expect(predicate).not.toContain("raw_user_meta_data");
    expect(migration).toContain("REVOKE ALL ON FUNCTION qwestum_private.current_actor_can_author() FROM PUBLIC");
    expect(migration).toContain("REVOKE ALL ON FUNCTION qwestum_private.current_actor_can_author() FROM authenticated");
    expect(migration).toContain("REVOKE ALL ON FUNCTION qwestum_private.current_actor_can_author() FROM service_role");
  });

  it("preserves administrative writes while requiring an active entitlement for authenticated writes", () => {
    const guard = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION qwestum_private.enforce_teacher_authoring_mutation"),
      migration.indexOf("ALTER FUNCTION qwestum_private.enforce_teacher_authoring_mutation")
    );

    expect(guard).toContain("IF auth.uid() IS NULL OR qwestum_private.current_actor_can_author() THEN");
    expect(guard).toContain("IF TG_OP = 'DELETE' THEN");
    expect(guard).toContain("RETURN OLD;");
    expect(guard).toContain("RETURN NEW;");
    expect(guard).toContain("RETURN NULL;");
    expect(guard).toContain("without revealing");
  });

  it("keeps trigger coverage on both guarded authoring tables", () => {
    expect(migration).toContain("'public.quests'::pg_catalog.regclass");
    expect(migration).toContain("'public.quest_tasks'::pg_catalog.regclass");
    expect(migration).toContain("enforce_teacher_authoring_quest_mutation");
    expect(migration).toContain("enforce_teacher_authoring_task_mutation");
    expect(migration).toContain("t.tgfoid = 'qwestum_private.enforce_teacher_authoring_mutation()'::pg_catalog.regprocedure");
  });

  it("never reports publication success when a guarded update affects zero rows", () => {
    const publication = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.set_owned_quest_publication_state"),
      migration.indexOf("ALTER FUNCTION public.set_owned_quest_publication_state")
    );
    const unpublish = publication.slice(
      publication.indexOf("IF NOT p_publish THEN"),
      publication.indexOf("LOCK TABLE public.quest_tasks")
    );
    const publish = publication.slice(publication.indexOf("BEGIN\n    UPDATE public.quests AS q"));

    expect(unpublish).toContain("RETURNING q.is_public INTO v_is_public");
    expect(unpublish.indexOf("IF NOT FOUND THEN")).toBeLessThan(
      unpublish.indexOf("RETURN QUERY SELECT v_is_public, 'unpublished'::text")
    );
    expect(unpublish).toContain("RETURN QUERY SELECT FALSE, 'not_found'::text");
    expect(publish).toContain("RETURNING q.is_public INTO v_is_public");
    expect(publish).toContain("RAISE SQLSTATE 'P7502'");
    expect(publish).toContain("WHEN SQLSTATE 'P7502' THEN");
    expect(publish).toContain("RETURN QUERY SELECT FALSE, 'not_found'::text");
    expect(publication).toContain("RETURN QUERY SELECT v_is_public, 'published'::text");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.set_owned_quest_publication_state(uuid, boolean) TO authenticated");
  });

  it("leaves entitlement data, profile identity, and public/student boundaries unchanged", () => {
    expect(migration).not.toContain("INSERT INTO public.teacher_entitlements");
    expect(migration).not.toContain("UPDATE public.teacher_entitlements");
    expect(migration).not.toContain("DELETE FROM public.teacher_entitlements");
    expect(migration).not.toContain("ALTER TABLE public.profiles");
    expect(migration).not.toContain("provision_student_profile");
    expect(migration).not.toContain("current_actor_is_student");
    expect(migration).not.toContain("start_student_quest_attempt");
    expect(migration).not.toContain("submit_student_quest_attempt");
    expect(migration).not.toContain("score_public_runtime_quest");
    expect(migration).not.toContain("storage.objects");
  });
});
