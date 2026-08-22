BEGIN;

-- Fail closed if the Storage or M046 authoring prerequisites differ from the
-- reviewed predecessor state. This migration intentionally changes only the
-- four authenticated authoring-media write policies.
DO $$
DECLARE
  v_authenticated_role oid;
BEGIN
  SELECT r.oid
  INTO v_authenticated_role
  FROM pg_catalog.pg_roles AS r
  WHERE r.rolname = 'authenticated';

  IF pg_catalog.to_regclass('storage.objects') IS NULL
    OR v_authenticated_role IS NULL THEN
    RAISE EXCEPTION 'Storage objects and authenticated role are required before applying M047';
  END IF;

  IF pg_catalog.to_regprocedure('qwestum_private.current_actor_can_author()') IS NULL THEN
    RAISE EXCEPTION 'M046 current authoring predicate is required before applying M047';
  END IF;

  IF pg_catalog.to_regprocedure('public.current_actor_can_author_storage()') IS NOT NULL THEN
    RAISE EXCEPTION 'public.current_actor_can_author_storage already exists; inspect before applying M047';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy AS p
    WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass
      AND p.polname = 'Teachers can upload own quest images'
      AND p.polcmd = 'a'
      AND p.polroles = ARRAY[v_authenticated_role]::oid[]
      AND p.polqual IS NULL
      AND lower(regexp_replace(regexp_replace(
        pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid),
        '[[:space:]()]',
        '',
        'g'
      ), '::text', '', 'g')) = lower(regexp_replace(regexp_replace($task_insert$
        bucket_id = 'quest-images'
        and (storage.foldername(name))[1] = 'teachers'
        and (storage.foldername(name))[2] = auth.uid()::text
        and (storage.foldername(name))[3] = 'quests'
        and (storage.foldername(name))[5] = 'tasks'
      $task_insert$, '[[:space:]()]', '', 'g'), '::text', '', 'g'))
  ) THEN
    RAISE EXCEPTION 'task-image INSERT policy has an unexpected predecessor definition; inspect before applying M047';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy AS p
    WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass
      AND p.polname = 'Teachers can delete own quest images'
      AND p.polcmd = 'd'
      AND p.polroles = ARRAY[v_authenticated_role]::oid[]
      AND p.polwithcheck IS NULL
      AND lower(regexp_replace(regexp_replace(
        pg_catalog.pg_get_expr(p.polqual, p.polrelid),
        '[[:space:]()]',
        '',
        'g'
      ), '::text', '', 'g')) = lower(regexp_replace(regexp_replace($task_delete$
        bucket_id = 'quest-images'
        and (storage.foldername(name))[1] = 'teachers'
        and (storage.foldername(name))[2] = auth.uid()::text
        and (storage.foldername(name))[3] = 'quests'
        and (storage.foldername(name))[5] = 'tasks'
      $task_delete$, '[[:space:]()]', '', 'g'), '::text', '', 'g'))
  ) THEN
    RAISE EXCEPTION 'task-image DELETE policy has an unexpected predecessor definition; inspect before applying M047';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy AS p
    WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass
      AND p.polname = 'Teachers can upload own quest covers'
      AND p.polcmd = 'a'
      AND p.polroles = ARRAY[v_authenticated_role]::oid[]
      AND p.polqual IS NULL
      AND lower(regexp_replace(regexp_replace(
        pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid),
        '[[:space:]()]',
        '',
        'g'
      ), '::text', '', 'g')) = lower(regexp_replace(regexp_replace($cover_insert$
        bucket_id = 'quest-images'
        and (storage.foldername(name))[1] = 'teachers'
        and (storage.foldername(name))[2] = auth.uid()::text
        and (storage.foldername(name))[3] = 'quests'
        and (storage.foldername(name))[4] <> ''
        and (storage.foldername(name))[5] = 'cover'
        and (storage.foldername(name))[6] is null
        and name ~ (
          '^teachers/' || auth.uid()::text ||
          '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
        )
      $cover_insert$, '[[:space:]()]', '', 'g'), '::text', '', 'g'))
      AND position(
        '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
        IN pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid)
      ) > 0
  ) THEN
    RAISE EXCEPTION 'cover INSERT policy has an unexpected predecessor definition; inspect before applying M047';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy AS p
    WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass
      AND p.polname = 'Teachers can delete own quest covers'
      AND p.polcmd = 'd'
      AND p.polroles = ARRAY[v_authenticated_role]::oid[]
      AND p.polwithcheck IS NULL
      AND lower(regexp_replace(regexp_replace(
        pg_catalog.pg_get_expr(p.polqual, p.polrelid),
        '[[:space:]()]',
        '',
        'g'
      ), '::text', '', 'g')) = lower(regexp_replace(regexp_replace($cover_delete$
        bucket_id = 'quest-images'
        and (storage.foldername(name))[1] = 'teachers'
        and (storage.foldername(name))[2] = auth.uid()::text
        and (storage.foldername(name))[3] = 'quests'
        and (storage.foldername(name))[4] <> ''
        and (storage.foldername(name))[5] = 'cover'
        and (storage.foldername(name))[6] is null
        and name ~ (
          '^teachers/' || auth.uid()::text ||
          '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
        )
      $cover_delete$, '[[:space:]()]', '', 'g'), '::text', '', 'g'))
      AND position(
        '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
        IN pg_catalog.pg_get_expr(p.polqual, p.polrelid)
      ) > 0
  ) THEN
    RAISE EXCEPTION 'cover DELETE policy has an unexpected predecessor definition; inspect before applying M047';
  END IF;
END;
$$;

CREATE FUNCTION public.current_actor_can_author_storage()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT qwestum_private.current_actor_can_author();
$$;

ALTER FUNCTION public.current_actor_can_author_storage() OWNER TO postgres;

REVOKE ALL ON FUNCTION public.current_actor_can_author_storage() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_actor_can_author_storage() FROM anon;
REVOKE ALL ON FUNCTION public.current_actor_can_author_storage() FROM authenticated;
REVOKE ALL ON FUNCTION public.current_actor_can_author_storage() FROM service_role;
GRANT EXECUTE ON FUNCTION public.current_actor_can_author_storage() TO authenticated;

DROP POLICY "Teachers can upload own quest images" ON storage.objects;
DROP POLICY "Teachers can delete own quest images" ON storage.objects;
DROP POLICY "Teachers can upload own quest covers" ON storage.objects;
DROP POLICY "Teachers can delete own quest covers" ON storage.objects;

CREATE POLICY "Teachers can upload own quest images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quest-images'
  AND (storage.foldername(name))[1] = 'teachers'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND (storage.foldername(name))[3] = 'quests'
  AND (storage.foldername(name))[5] = 'tasks'
  AND public.current_actor_can_author_storage()
);

CREATE POLICY "Teachers can delete own quest images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'quest-images'
  AND (storage.foldername(name))[1] = 'teachers'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND (storage.foldername(name))[3] = 'quests'
  AND (storage.foldername(name))[5] = 'tasks'
  AND public.current_actor_can_author_storage()
);

CREATE POLICY "Teachers can upload own quest covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quest-images'
  AND (storage.foldername(name))[1] = 'teachers'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND (storage.foldername(name))[3] = 'quests'
  AND (storage.foldername(name))[4] <> ''
  AND (storage.foldername(name))[5] = 'cover'
  AND (storage.foldername(name))[6] IS NULL
  AND name ~ (
    '^teachers/' || auth.uid()::text ||
    '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  )
  AND public.current_actor_can_author_storage()
);

CREATE POLICY "Teachers can delete own quest covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'quest-images'
  AND (storage.foldername(name))[1] = 'teachers'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND (storage.foldername(name))[3] = 'quests'
  AND (storage.foldername(name))[4] <> ''
  AND (storage.foldername(name))[5] = 'cover'
  AND (storage.foldername(name))[6] IS NULL
  AND name ~ (
    '^teachers/' || auth.uid()::text ||
    '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  )
  AND public.current_actor_can_author_storage()
);

COMMIT;
