-- P1D-B2: require both teacher identity and an active entitlement at the
-- shared quest/task write boundary. Media Storage policies remain P1D-B3.

BEGIN;

DO $$
BEGIN
  IF pg_catalog.to_regclass('public.teacher_entitlements') IS NULL
    OR pg_catalog.to_regclass('public.billing_webhook_events') IS NULL THEN
    RAISE EXCEPTION 'M045 commercial entitlement tables are required before applying M046';
  END IF;

  IF pg_catalog.to_regprocedure('qwestum_private.current_actor_is_teacher()') IS NULL
    OR pg_catalog.to_regprocedure('qwestum_private.has_active_teacher_entitlement(uuid)') IS NULL
    OR pg_catalog.to_regprocedure('qwestum_private.enforce_teacher_authoring_mutation()') IS NULL
    OR pg_catalog.to_regprocedure('public.set_owned_quest_publication_state(uuid,boolean)') IS NULL THEN
    RAISE EXCEPTION 'M043/M045 authoring prerequisites are required before applying M046';
  END IF;

  IF pg_catalog.to_regprocedure('qwestum_private.current_actor_can_author()') IS NOT NULL THEN
    RAISE EXCEPTION 'current_actor_can_author already exists; inspect before applying M046';
  END IF;

  IF pg_catalog.pg_get_functiondef(
    'qwestum_private.enforce_teacher_authoring_mutation()'::pg_catalog.regprocedure
  ) NOT LIKE '%IF auth.uid() IS NULL OR qwestum_private.current_actor_is_teacher() THEN%'
    OR pg_catalog.pg_get_functiondef(
      'qwestum_private.enforce_teacher_authoring_mutation()'::pg_catalog.regprocedure
    ) NOT LIKE '%RETURN NULL;%'
    OR pg_catalog.pg_get_functiondef(
      'qwestum_private.enforce_teacher_authoring_mutation()'::pg_catalog.regprocedure
    ) LIKE '%qwestum_private.current_actor_can_author()%'
    OR pg_catalog.pg_get_functiondef(
      'qwestum_private.enforce_teacher_authoring_mutation()'::pg_catalog.regprocedure
    ) LIKE '%qwestum_private.has_active_teacher_entitlement(%' THEN
    RAISE EXCEPTION 'teacher authoring guard has an unexpected definition; inspect before applying M046';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS t
    WHERE t.tgrelid = 'public.quests'::pg_catalog.regclass
      AND t.tgname = 'enforce_teacher_authoring_quest_mutation'
      AND NOT t.tgisinternal
      AND t.tgfoid = 'qwestum_private.enforce_teacher_authoring_mutation()'::pg_catalog.regprocedure
  ) OR NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS t
    WHERE t.tgrelid = 'public.quest_tasks'::pg_catalog.regclass
      AND t.tgname = 'enforce_teacher_authoring_task_mutation'
      AND NOT t.tgisinternal
      AND t.tgfoid = 'qwestum_private.enforce_teacher_authoring_mutation()'::pg_catalog.regprocedure
  ) THEN
    RAISE EXCEPTION 'quest/task authoring triggers must point to the expected guard before applying M046';
  END IF;

  IF pg_catalog.pg_get_functiondef(
    'public.set_owned_quest_publication_state(uuid,boolean)'::pg_catalog.regprocedure
  ) NOT LIKE '%IF NOT p_publish THEN%'
    OR pg_catalog.pg_get_functiondef(
      'public.set_owned_quest_publication_state(uuid,boolean)'::pg_catalog.regprocedure
    ) NOT LIKE '%SET is_public = FALSE%'
    OR pg_catalog.pg_get_functiondef(
      'public.set_owned_quest_publication_state(uuid,boolean)'::pg_catalog.regprocedure
    ) NOT LIKE '%RETURN QUERY SELECT FALSE, ''unpublished''::text;%'
    OR pg_catalog.pg_get_functiondef(
      'public.set_owned_quest_publication_state(uuid,boolean)'::pg_catalog.regprocedure
    ) NOT LIKE '%SET is_public = TRUE%'
    OR pg_catalog.pg_get_functiondef(
      'public.set_owned_quest_publication_state(uuid,boolean)'::pg_catalog.regprocedure
    ) NOT LIKE '%public.is_public_runtime_eligible(p_quest_id)%' THEN
    RAISE EXCEPTION 'publication RPC has an unexpected definition; inspect before applying M046';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    WHERE p.oid = 'public.set_owned_quest_publication_state(uuid,boolean)'::pg_catalog.regprocedure
      AND p.prosecdef
  ) THEN
    RAISE EXCEPTION 'publication RPC must be SECURITY DEFINER before applying M046';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    WHERE p.oid = 'public.set_owned_quest_publication_state(uuid,boolean)'::pg_catalog.regprocedure
      AND p.proconfig = ARRAY['search_path=pg_catalog, public']::text[]
  ) THEN
    RAISE EXCEPTION 'publication RPC must use the expected fixed search_path before applying M046';
  END IF;

  IF NOT pg_catalog.has_function_privilege(
    'authenticated',
    'public.set_owned_quest_publication_state(uuid,boolean)'::pg_catalog.regprocedure,
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'publication RPC must grant EXECUTE to authenticated before applying M046';
  END IF;

  IF pg_catalog.has_function_privilege(
    'anon',
    'public.set_owned_quest_publication_state(uuid,boolean)'::pg_catalog.regprocedure,
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'publication RPC must not grant EXECUTE to anon before applying M046';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
    ) AS acl
    WHERE p.oid = 'public.set_owned_quest_publication_state(uuid,boolean)'::pg_catalog.regprocedure
      AND acl.grantee = 0
      AND acl.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'publication RPC must not grant EXECUTE to PUBLIC before applying M046';
  END IF;
END;
$$;

CREATE FUNCTION qwestum_private.current_actor_can_author()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND qwestum_private.current_actor_is_teacher()
    AND qwestum_private.has_active_teacher_entitlement(auth.uid());
$$;

ALTER FUNCTION qwestum_private.current_actor_can_author() OWNER TO postgres;

REVOKE ALL ON FUNCTION qwestum_private.current_actor_can_author() FROM PUBLIC;
REVOKE ALL ON FUNCTION qwestum_private.current_actor_can_author() FROM anon;
REVOKE ALL ON FUNCTION qwestum_private.current_actor_can_author() FROM authenticated;
REVOKE ALL ON FUNCTION qwestum_private.current_actor_can_author() FROM service_role;

CREATE OR REPLACE FUNCTION qwestum_private.enforce_teacher_authoring_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- SQL migrations and other explicitly privileged maintenance run without an
  -- Auth JWT. Authenticated browser/RPC writes must pass the commercial gate.
  IF auth.uid() IS NULL OR qwestum_private.current_actor_can_author() THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;

    RETURN NEW;
  END IF;

  -- Preserve existing zero-row/unavailable RPC behavior without revealing
  -- whether the role or entitlement predicate denied the write.
  RETURN NULL;
END;
$$;

ALTER FUNCTION qwestum_private.enforce_teacher_authoring_mutation() OWNER TO postgres;

REVOKE ALL ON FUNCTION qwestum_private.enforce_teacher_authoring_mutation() FROM PUBLIC;
REVOKE ALL ON FUNCTION qwestum_private.enforce_teacher_authoring_mutation() FROM anon;
REVOKE ALL ON FUNCTION qwestum_private.enforce_teacher_authoring_mutation() FROM authenticated;
REVOKE ALL ON FUNCTION qwestum_private.enforce_teacher_authoring_mutation() FROM service_role;

CREATE OR REPLACE FUNCTION public.set_owned_quest_publication_state(
  p_quest_id uuid,
  p_publish boolean
)
RETURNS TABLE (
  is_public boolean,
  outcome text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_is_public boolean;
BEGIN
  -- An absent session, missing quest, foreign-owned quest, and a suppressed
  -- guarded write remain intentionally indistinguishable to callers.
  IF auth.uid() IS NULL OR p_quest_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'not_found'::text;
    RETURN;
  END IF;

  SELECT q.is_public
  INTO v_is_public
  FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'not_found'::text;
    RETURN;
  END IF;

  IF p_publish IS NULL THEN
    RETURN QUERY SELECT v_is_public, 'blocked'::text;
    RETURN;
  END IF;

  IF NOT p_publish THEN
    IF NOT v_is_public THEN
      RETURN QUERY SELECT FALSE, 'already_draft'::text;
      RETURN;
    END IF;

    UPDATE public.quests AS q
    SET is_public = FALSE
    WHERE q.id = p_quest_id
      AND q.author_id = auth.uid()
    RETURNING q.is_public INTO v_is_public;

    IF NOT FOUND THEN
      RETURN QUERY SELECT FALSE, 'not_found'::text;
      RETURN;
    END IF;

    RETURN QUERY SELECT v_is_public, 'unpublished'::text;
    RETURN;
  END IF;

  LOCK TABLE public.quest_tasks IN SHARE ROW EXCLUSIVE MODE;

  IF v_is_public THEN
    IF public.is_public_runtime_eligible(p_quest_id) THEN
      RETURN QUERY SELECT TRUE, 'already_published'::text;
    END IF;

    RETURN QUERY SELECT TRUE, 'blocked'::text;
    RETURN;
  END IF;

  BEGIN
    UPDATE public.quests AS q
    SET is_public = TRUE
    WHERE q.id = p_quest_id
      AND q.author_id = auth.uid()
    RETURNING q.is_public INTO v_is_public;

    IF NOT FOUND THEN
      RAISE SQLSTATE 'P7502';
    END IF;

    IF NOT public.is_public_runtime_eligible(p_quest_id) THEN
      RAISE SQLSTATE 'P7501';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'P7501' THEN
      RETURN QUERY SELECT FALSE, 'blocked'::text;
      RETURN;
    WHEN SQLSTATE 'P7502' THEN
      RETURN QUERY SELECT FALSE, 'not_found'::text;
      RETURN;
  END;

  RETURN QUERY SELECT v_is_public, 'published'::text;
END;
$$;

ALTER FUNCTION public.set_owned_quest_publication_state(uuid, boolean) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.set_owned_quest_publication_state(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_owned_quest_publication_state(uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.set_owned_quest_publication_state(uuid, boolean) FROM authenticated;
REVOKE ALL ON FUNCTION public.set_owned_quest_publication_state(uuid, boolean) FROM service_role;
GRANT EXECUTE ON FUNCTION public.set_owned_quest_publication_state(uuid, boolean) TO authenticated;

COMMIT;
