-- Bind quest-images writes to existing, teacher-owned quest/task rows while
-- preserving public reads and the existing authoring-entitlement boundary.

BEGIN;

DO $$
DECLARE
  v_authenticated_role oid;
  v_bucket_is_public boolean;
  v_file_size_limit bigint;
  v_allowed_mime_types text[];
  v_quests_rls boolean;
  v_tasks_rls boolean;
BEGIN
  SELECT r.oid
  INTO v_authenticated_role
  FROM pg_catalog.pg_roles AS r
  WHERE r.rolname = 'authenticated';

  IF pg_catalog.to_regclass('storage.objects') IS NULL
    OR pg_catalog.to_regclass('storage.buckets') IS NULL
    OR pg_catalog.to_regclass('public.quests') IS NULL
    OR pg_catalog.to_regclass('public.quest_tasks') IS NULL
    OR v_authenticated_role IS NULL
    OR pg_catalog.to_regprocedure('public.current_actor_can_author_storage()') IS NULL THEN
    RAISE EXCEPTION 'M051 Storage, ownership tables, authenticated role, and authoring predicate are required before applying';
  END IF;

  SELECT b.public, b.file_size_limit, b.allowed_mime_types
  INTO v_bucket_is_public, v_file_size_limit, v_allowed_mime_types
  FROM storage.buckets AS b
  WHERE b.id = 'quest-images';

  IF NOT FOUND
    OR v_bucket_is_public IS DISTINCT FROM TRUE
    OR v_file_size_limit IS DISTINCT FROM 5242880
    OR v_allowed_mime_types IS DISTINCT FROM ARRAY['image/jpeg', 'image/png', 'image/webp']::text[] THEN
    RAISE EXCEPTION 'quest-images bucket must remain public with the expected 5 MB JPEG/PNG/WebP contract before applying M051';
  END IF;

  SELECT c.relrowsecurity
  INTO v_quests_rls
  FROM pg_catalog.pg_class AS c
  WHERE c.oid = 'public.quests'::pg_catalog.regclass;

  SELECT c.relrowsecurity
  INTO v_tasks_rls
  FROM pg_catalog.pg_class AS c
  WHERE c.oid = 'public.quest_tasks'::pg_catalog.regclass;

  IF v_quests_rls IS DISTINCT FROM TRUE OR v_tasks_rls IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'public.quests and public.quest_tasks must retain RLS before applying M051';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('public.quests'::pg_catalog.regclass, 'id', 'uuid'::pg_catalog.regtype),
        ('public.quests'::pg_catalog.regclass, 'author_id', 'uuid'::pg_catalog.regtype),
        ('public.quest_tasks'::pg_catalog.regclass, 'id', 'uuid'::pg_catalog.regtype),
        ('public.quest_tasks'::pg_catalog.regclass, 'quest_id', 'uuid'::pg_catalog.regtype)
    ) AS expected(relid, attname, atttype)
    LEFT JOIN pg_catalog.pg_attribute AS a
      ON a.attrelid = expected.relid
     AND a.attname = expected.attname
     AND NOT a.attisdropped
    WHERE a.attnum IS NULL OR a.atttypid <> expected.atttype
  ) THEN
    RAISE EXCEPTION 'public quest/task ownership columns have an unexpected contract before applying M051';
  END IF;

  IF NOT pg_catalog.has_table_privilege('authenticated', 'public.quests', 'SELECT')
    OR NOT pg_catalog.has_table_privilege('authenticated', 'public.quest_tasks', 'SELECT')
    OR pg_catalog.has_table_privilege('anon', 'public.quests', 'SELECT')
    OR pg_catalog.has_table_privilege('anon', 'public.quest_tasks', 'SELECT')
    OR pg_catalog.has_table_privilege('authenticated', 'public.quests', 'INSERT')
    OR pg_catalog.has_table_privilege('authenticated', 'public.quests', 'UPDATE')
    OR pg_catalog.has_table_privilege('authenticated', 'public.quests', 'DELETE')
    OR pg_catalog.has_table_privilege('authenticated', 'public.quest_tasks', 'INSERT')
    OR pg_catalog.has_table_privilege('authenticated', 'public.quest_tasks', 'UPDATE')
    OR pg_catalog.has_table_privilege('authenticated', 'public.quest_tasks', 'DELETE')
    OR pg_catalog.has_table_privilege('anon', 'public.quests', 'INSERT')
    OR pg_catalog.has_table_privilege('anon', 'public.quests', 'UPDATE')
    OR pg_catalog.has_table_privilege('anon', 'public.quests', 'DELETE')
    OR pg_catalog.has_table_privilege('anon', 'public.quest_tasks', 'INSERT')
    OR pg_catalog.has_table_privilege('anon', 'public.quest_tasks', 'UPDATE')
    OR pg_catalog.has_table_privilege('anon', 'public.quest_tasks', 'DELETE') THEN
    RAISE EXCEPTION 'public quest/task SELECT grants have an unexpected contract before applying M051';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy AS p
    WHERE p.polrelid IN ('public.quests'::pg_catalog.regclass, 'public.quest_tasks'::pg_catalog.regclass)
      AND (
        (p.polrelid = 'public.quests'::pg_catalog.regclass
          AND (p.polname <> 'Teachers can select own quests' OR p.polcmd <> 'r' OR p.polroles <> ARRAY[v_authenticated_role]::oid[] OR p.polwithcheck IS NOT NULL
            OR lower(regexp_replace(regexp_replace(pg_catalog.pg_get_expr(p.polqual, p.polrelid), '[[:space:]()]', '', 'g'), '::text', '', 'g')) <> lower(regexp_replace(regexp_replace($quest_select$
              author_id = auth.uid()
            $quest_select$, '[[:space:]()]', '', 'g'), '::text', '', 'g'))))
        OR (p.polrelid = 'public.quest_tasks'::pg_catalog.regclass
          AND (p.polname <> 'Teachers can select tasks for own quests' OR p.polcmd <> 'r' OR p.polroles <> ARRAY[v_authenticated_role]::oid[] OR p.polwithcheck IS NOT NULL
            OR lower(regexp_replace(regexp_replace(pg_catalog.pg_get_expr(p.polqual, p.polrelid), '[[:space:]()]', '', 'g'), '::text', '', 'g')) <> lower(regexp_replace(regexp_replace($task_select$
              exists (
                select 1
                from public.quests as parent_quest
                where parent_quest.id = quest_tasks.quest_id
                  and parent_quest.author_id = auth.uid()
              )
            $task_select$, '[[:space:]()]', '', 'g'), '::text', '', 'g'))))
      )
  ) OR (SELECT pg_catalog.count(*) FROM pg_catalog.pg_policy AS p WHERE p.polrelid = 'public.quests'::pg_catalog.regclass) <> 1
    OR (SELECT pg_catalog.count(*) FROM pg_catalog.pg_policy AS p WHERE p.polrelid = 'public.quest_tasks'::pg_catalog.regclass) <> 1 THEN
    RAISE EXCEPTION 'public quest/task owner-only SELECT policies have an unexpected contract before applying M051';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    WHERE p.oid = 'public.current_actor_can_author_storage()'::pg_catalog.regprocedure
      AND (
        NOT p.prosecdef
        OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public']::text[]
        OR p.proowner <> 'postgres'::pg_catalog.regrole
      )
  ) OR NOT pg_catalog.has_function_privilege('authenticated', 'public.current_actor_can_author_storage()'::pg_catalog.regprocedure, 'EXECUTE')
    OR pg_catalog.has_function_privilege('anon', 'public.current_actor_can_author_storage()'::pg_catalog.regprocedure, 'EXECUTE')
    OR pg_catalog.has_function_privilege('service_role', 'public.current_actor_can_author_storage()'::pg_catalog.regprocedure, 'EXECUTE')
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc AS p
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))) AS acl
      WHERE p.oid = 'public.current_actor_can_author_storage()'::pg_catalog.regprocedure
        AND acl.grantee = 0
        AND acl.privilege_type = 'EXECUTE'
    ) THEN
    RAISE EXCEPTION 'current_actor_can_author_storage has an unexpected security or EXECUTE contract before applying M051';
  END IF;

  IF (SELECT pg_catalog.count(*) FROM pg_catalog.pg_policy AS p WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass) <> 5
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policy AS p
      WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass
        AND p.polname NOT IN (
          'Public read quest images',
          'Teachers can upload own quest images',
          'Teachers can delete own quest images',
          'Teachers can upload own quest covers',
          'Teachers can delete own quest covers'
        )
    ) THEN
    RAISE EXCEPTION 'storage.objects policy set has unexpected predecessor state before applying M051';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy AS p
    WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass
      AND p.polname = 'Public read quest images'
      AND p.polcmd = 'r'
      AND p.polroles = ARRAY[0]::oid[]
      AND p.polwithcheck IS NULL
      AND lower(regexp_replace(regexp_replace(pg_catalog.pg_get_expr(p.polqual, p.polrelid), '[[:space:]()]', '', 'g'), '::text', '', 'g')) = lower(regexp_replace(regexp_replace($public_read$
        bucket_id = 'quest-images'
      $public_read$, '[[:space:]()]', '', 'g'), '::text', '', 'g'))
  ) THEN
    RAISE EXCEPTION 'public quest-images SELECT policy has an unexpected predecessor definition before applying M051';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy AS p
    WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass
      AND p.polcmd = 'w'
  ) THEN
    RAISE EXCEPTION 'storage.objects must not have an UPDATE policy before applying M051';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy AS p
    WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass
      AND p.polname = 'Teachers can upload own quest images'
      AND p.polcmd = 'a'
      AND p.polroles = ARRAY[v_authenticated_role]::oid[]
      AND p.polqual IS NULL
      AND lower(regexp_replace(regexp_replace(pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid), '[[:space:]()]', '', 'g'), '::text', '', 'g')) = lower(regexp_replace(regexp_replace($task_insert$
        bucket_id = 'quest-images'
        and (storage.foldername(name))[1] = 'teachers'
        and (storage.foldername(name))[2] = auth.uid()::text
        and (storage.foldername(name))[3] = 'quests'
        and (storage.foldername(name))[5] = 'tasks'
        and public.current_actor_can_author_storage()
      $task_insert$, '[[:space:]()]', '', 'g'), '::text', '', 'g'))
  ) THEN
    RAISE EXCEPTION 'task-image INSERT policy has an unexpected predecessor definition before applying M051';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy AS p
    WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass
      AND p.polname = 'Teachers can delete own quest images'
      AND p.polcmd = 'd'
      AND p.polroles = ARRAY[v_authenticated_role]::oid[]
      AND p.polwithcheck IS NULL
      AND lower(regexp_replace(regexp_replace(pg_catalog.pg_get_expr(p.polqual, p.polrelid), '[[:space:]()]', '', 'g'), '::text', '', 'g')) = lower(regexp_replace(regexp_replace($task_delete$
        bucket_id = 'quest-images'
        and (storage.foldername(name))[1] = 'teachers'
        and (storage.foldername(name))[2] = auth.uid()::text
        and (storage.foldername(name))[3] = 'quests'
        and (storage.foldername(name))[5] = 'tasks'
        and public.current_actor_can_author_storage()
      $task_delete$, '[[:space:]()]', '', 'g'), '::text', '', 'g'))
  ) THEN
    RAISE EXCEPTION 'task-image DELETE policy has an unexpected predecessor definition before applying M051';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy AS p
    WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass
      AND p.polname = 'Teachers can upload own quest covers'
      AND p.polcmd = 'a'
      AND p.polroles = ARRAY[v_authenticated_role]::oid[]
      AND p.polqual IS NULL
      AND lower(regexp_replace(regexp_replace(pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid), '[[:space:]()]', '', 'g'), '::text', '', 'g')) = lower(regexp_replace(regexp_replace($cover_insert$
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
        and public.current_actor_can_author_storage()
      $cover_insert$, '[[:space:]()]', '', 'g'), '::text', '', 'g'))
  ) THEN
    RAISE EXCEPTION 'cover INSERT policy has an unexpected predecessor definition before applying M051';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy AS p
    WHERE p.polrelid = 'storage.objects'::pg_catalog.regclass
      AND p.polname = 'Teachers can delete own quest covers'
      AND p.polcmd = 'd'
      AND p.polroles = ARRAY[v_authenticated_role]::oid[]
      AND p.polwithcheck IS NULL
      AND lower(regexp_replace(regexp_replace(pg_catalog.pg_get_expr(p.polqual, p.polrelid), '[[:space:]()]', '', 'g'), '::text', '', 'g')) = lower(regexp_replace(regexp_replace($cover_delete$
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
        and public.current_actor_can_author_storage()
      $cover_delete$, '[[:space:]()]', '', 'g'), '::text', '', 'g'))
  ) THEN
    RAISE EXCEPTION 'cover DELETE policy has an unexpected predecessor definition before applying M051';
  END IF;
END;
$$;

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
  AND (storage.foldername(name))[4] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (storage.foldername(name))[5] = 'tasks'
  AND (storage.foldername(name))[6] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (storage.foldername(name))[7] IS NULL
  AND name ~ (
    '^teachers/' || auth.uid()::text ||
    '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/tasks/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  )
  AND EXISTS (
    SELECT 1
    FROM public.quests AS q
    WHERE q.id::text = (storage.foldername(name))[4]
      AND q.author_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.quest_tasks AS qt
    WHERE qt.id::text = (storage.foldername(name))[6]
      AND qt.quest_id::text = (storage.foldername(name))[4]
  )
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
  AND (storage.foldername(name))[4] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (storage.foldername(name))[5] = 'tasks'
  AND (storage.foldername(name))[6] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (storage.foldername(name))[7] IS NULL
  AND name ~ (
    '^teachers/' || auth.uid()::text ||
    '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/tasks/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  )
  AND EXISTS (
    SELECT 1
    FROM public.quests AS q
    WHERE q.id::text = (storage.foldername(name))[4]
      AND q.author_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.quest_tasks AS qt
    WHERE qt.id::text = (storage.foldername(name))[6]
      AND qt.quest_id::text = (storage.foldername(name))[4]
  )
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
  AND (storage.foldername(name))[4] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (storage.foldername(name))[5] = 'cover'
  AND (storage.foldername(name))[6] IS NULL
  AND name ~ (
    '^teachers/' || auth.uid()::text ||
    '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  )
  AND EXISTS (
    SELECT 1
    FROM public.quests AS q
    WHERE q.id::text = (storage.foldername(name))[4]
      AND q.author_id = auth.uid()
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
  AND (storage.foldername(name))[4] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (storage.foldername(name))[5] = 'cover'
  AND (storage.foldername(name))[6] IS NULL
  AND name ~ (
    '^teachers/' || auth.uid()::text ||
    '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  )
  AND EXISTS (
    SELECT 1
    FROM public.quests AS q
    WHERE q.id::text = (storage.foldername(name))[4]
      AND q.author_id = auth.uid()
  )
  AND public.current_actor_can_author_storage()
);

COMMIT;
