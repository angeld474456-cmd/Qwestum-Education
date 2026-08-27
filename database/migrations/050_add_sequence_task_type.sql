-- P1 Sequence: add a fourth task type without widening direct table access.
-- Sequence item text is intentionally shorter than choice text: 1000 characters.
-- Public projection is deterministic but deliberately noncanonical; correctOrder
-- remains private content and is never returned or snapshotted.

BEGIN;

DO $$
DECLARE
  v_bad_constraint text;
BEGIN
  IF pg_catalog.to_regprocedure('public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb)') IS NULL
    OR pg_catalog.to_regprocedure('public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text)') IS NULL
    OR pg_catalog.to_regprocedure('public.is_public_runtime_eligible(uuid)') IS NULL
    OR pg_catalog.to_regprocedure('public.get_public_runtime_quest(uuid)') IS NULL
    OR pg_catalog.to_regprocedure('public.get_public_runtime_quest_v2(uuid)') IS NULL
    OR pg_catalog.to_regprocedure('public.score_public_runtime_quest(uuid,jsonb)') IS NULL
    OR pg_catalog.to_regprocedure('public.submit_student_quest_attempt(uuid,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'M050 sequence prerequisites are missing; inspect before applying';
  END IF;

  IF pg_catalog.to_regprocedure('qwestum_private.is_valid_sequence_task_content(jsonb)') IS NOT NULL THEN
    RAISE EXCEPTION 'M050 sequence validator already exists; inspect before applying';
  END IF;

  IF pg_catalog.to_regprocedure('qwestum_private.public_task_image_url(uuid,uuid,uuid,text)') IS NOT NULL THEN
    RAISE EXCEPTION 'M050 public task image helper already exists; inspect before applying';
  END IF;

  SELECT pg_catalog.pg_get_constraintdef(c.oid)
  INTO v_bad_constraint
  FROM pg_catalog.pg_constraint AS c
  WHERE c.conrelid = 'public.quest_tasks'::pg_catalog.regclass
    AND c.contype = 'c'
    AND (
      c.conkey @> ARRAY[(SELECT a.attnum FROM pg_catalog.pg_attribute AS a WHERE a.attrelid = c.conrelid AND a.attname = 'task_type' AND NOT a.attisdropped)]::smallint[]
      OR EXISTS (
        SELECT 1
        FROM pg_catalog.pg_depend AS d
        INNER JOIN pg_catalog.pg_attribute AS a
          ON a.attrelid = c.conrelid
         AND a.attnum = d.refobjsubid
         AND a.attname = 'task_type'
         AND NOT a.attisdropped
        WHERE d.classid = 'pg_constraint'::pg_catalog.regclass
          AND d.objid = c.oid
          AND d.refobjid = c.conrelid
      )
    )
  LIMIT 1;

  IF v_bad_constraint IS NOT NULL THEN
    RAISE EXCEPTION 'unexpected quest_tasks task_type CHECK exists; inspect before applying M050: %', v_bad_constraint;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS c
    WHERE c.conrelid = 'public.quest_attempt_answers'::pg_catalog.regclass
      AND c.conname = 'quest_attempt_answers_task_type_check'
      AND pg_catalog.pg_get_constraintdef(c.oid) =
        'CHECK ((task_type = ANY (ARRAY[''text''::text, ''single_choice''::text, ''multiple_choice''::text])))'
  ) THEN
    RAISE EXCEPTION 'quest_attempt_answers_task_type_check has an unexpected definition; inspect before applying M050';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    WHERE p.oid IN (
      'public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb)'::pg_catalog.regprocedure,
      'public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text)'::pg_catalog.regprocedure,
      'public.get_public_runtime_quest(uuid)'::pg_catalog.regprocedure,
      'public.get_public_runtime_quest_v2(uuid)'::pg_catalog.regprocedure,
      'public.score_public_runtime_quest(uuid,jsonb)'::pg_catalog.regprocedure,
      'public.submit_student_quest_attempt(uuid,jsonb)'::pg_catalog.regprocedure
    ) AND (
      NOT p.prosecdef
      OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public']::text[]
      OR p.proowner <> 'postgres'::pg_catalog.regrole
    )
  ) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    WHERE p.oid = 'public.is_public_runtime_eligible(uuid)'::pg_catalog.regprocedure
      AND (
        p.prosecdef
        OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public']::text[]
        OR p.proowner <> 'postgres'::pg_catalog.regrole
      )
  ) THEN
    RAISE EXCEPTION 'M050 predecessor function security contract is unexpected; inspect before applying';
  END IF;

  IF NOT pg_catalog.has_function_privilege('authenticated', 'public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb)'::pg_catalog.regprocedure, 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege('authenticated', 'public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text)'::pg_catalog.regprocedure, 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege('anon', 'public.get_public_runtime_quest(uuid)'::pg_catalog.regprocedure, 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege('anon', 'public.get_public_runtime_quest_v2(uuid)'::pg_catalog.regprocedure, 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege('anon', 'public.score_public_runtime_quest(uuid,jsonb)'::pg_catalog.regprocedure, 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege('authenticated', 'public.get_public_runtime_quest(uuid)'::pg_catalog.regprocedure, 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege('authenticated', 'public.get_public_runtime_quest_v2(uuid)'::pg_catalog.regprocedure, 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege('authenticated', 'public.score_public_runtime_quest(uuid,jsonb)'::pg_catalog.regprocedure, 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege('authenticated', 'public.submit_student_quest_attempt(uuid,jsonb)'::pg_catalog.regprocedure, 'EXECUTE')
    OR pg_catalog.has_function_privilege('anon', 'public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb)'::pg_catalog.regprocedure, 'EXECUTE')
    OR pg_catalog.has_function_privilege('anon', 'public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text)'::pg_catalog.regprocedure, 'EXECUTE')
    OR pg_catalog.has_function_privilege('anon', 'public.submit_student_quest_attempt(uuid,jsonb)'::pg_catalog.regprocedure, 'EXECUTE')
    OR pg_catalog.has_function_privilege('service_role', 'public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb)'::pg_catalog.regprocedure, 'EXECUTE')
    OR pg_catalog.has_function_privilege('service_role', 'public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text)'::pg_catalog.regprocedure, 'EXECUTE')
    OR pg_catalog.has_function_privilege('service_role', 'public.get_public_runtime_quest(uuid)'::pg_catalog.regprocedure, 'EXECUTE')
    OR pg_catalog.has_function_privilege('service_role', 'public.get_public_runtime_quest_v2(uuid)'::pg_catalog.regprocedure, 'EXECUTE')
    OR pg_catalog.has_function_privilege('service_role', 'public.score_public_runtime_quest(uuid,jsonb)'::pg_catalog.regprocedure, 'EXECUTE')
    OR pg_catalog.has_function_privilege('service_role', 'public.submit_student_quest_attempt(uuid,jsonb)'::pg_catalog.regprocedure, 'EXECUTE') THEN
    RAISE EXCEPTION 'M050 predecessor function EXECUTE contract is unexpected; inspect before applying';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    WHERE (p.oid IN (
      'public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb)'::pg_catalog.regprocedure,
      'public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text)'::pg_catalog.regprocedure,
      'public.submit_student_quest_attempt(uuid,jsonb)'::pg_catalog.regprocedure
    ) AND (p.provolatile <> 'v' OR p.prorettype <> 'record'::pg_catalog.regtype))
    OR (p.oid IN (
      'public.get_public_runtime_quest(uuid)'::pg_catalog.regprocedure,
      'public.get_public_runtime_quest_v2(uuid)'::pg_catalog.regprocedure,
      'public.score_public_runtime_quest(uuid,jsonb)'::pg_catalog.regprocedure
    ) AND (p.provolatile <> 's' OR p.prorettype <> 'record'::pg_catalog.regtype))
    OR (p.oid = 'public.is_public_runtime_eligible(uuid)'::pg_catalog.regprocedure
      AND (p.provolatile <> 's' OR p.prorettype <> 'boolean'::pg_catalog.regtype))
  ) THEN
    RAISE EXCEPTION 'M050 predecessor function return or volatility contract is unexpected; inspect before applying';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))) AS acl
    WHERE p.oid IN (
      'public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb)'::pg_catalog.regprocedure,
      'public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text)'::pg_catalog.regprocedure,
      'public.get_public_runtime_quest(uuid)'::pg_catalog.regprocedure,
      'public.get_public_runtime_quest_v2(uuid)'::pg_catalog.regprocedure,
      'public.score_public_runtime_quest(uuid,jsonb)'::pg_catalog.regprocedure,
      'public.submit_student_quest_attempt(uuid,jsonb)'::pg_catalog.regprocedure
    )
      AND acl.grantee = 0
      AND acl.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'M050 predecessor function must not grant EXECUTE to PUBLIC; inspect before applying';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    INNER JOIN (
      VALUES
        ('public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb)'::pg_catalog.regprocedure, 'a577e0832116b34c2306677396704c5d'),
        ('public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text)'::pg_catalog.regprocedure, '1f7c3f7d89a94e00c5dd54187c7ad133'),
        ('public.is_public_runtime_eligible(uuid)'::pg_catalog.regprocedure, '8a2c88ecc05013f4d772b1d8b3b93ae6'),
        ('public.get_public_runtime_quest(uuid)'::pg_catalog.regprocedure, '05bb9480426bfd1eb93ec8c7652dddfb'),
        ('public.get_public_runtime_quest_v2(uuid)'::pg_catalog.regprocedure, '170509a81924d06e711e928a0d902670'),
        ('public.score_public_runtime_quest(uuid,jsonb)'::pg_catalog.regprocedure, '0773e880b5e2dbc6963ef097ecdf37f0'),
        ('public.submit_student_quest_attempt(uuid,jsonb)'::pg_catalog.regprocedure, '0e730ce4270c1c39bafb23a1a51264a1')
    ) AS expected(oid, normalized_body_md5)
      ON expected.oid = p.oid
    WHERE pg_catalog.md5(
      pg_catalog.regexp_replace(
        pg_catalog.regexp_replace(p.prosrc, E'--[^\\r\\n]*', '', 'g'),
        '[[:space:]]+',
        '',
        'g'
      )
    ) <> expected.normalized_body_md5
  ) THEN
    RAISE EXCEPTION 'M050 predecessor function body is unexpected; inspect before applying';
  END IF;
END;
$$;

CREATE FUNCTION qwestum_private.is_valid_sequence_task_content(p_content jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  WITH shape AS (
    SELECT p_content AS content
    WHERE pg_catalog.jsonb_typeof(p_content) = 'object'
      AND (SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_object_keys(p_content)) = 2
      AND p_content ? 'items'
      AND p_content ? 'correctOrder'
      AND pg_catalog.jsonb_typeof(p_content -> 'items') = 'array'
      AND pg_catalog.jsonb_typeof(p_content -> 'correctOrder') = 'array'
      AND pg_catalog.jsonb_array_length(p_content -> 'items') BETWEEN 3 AND 8
      AND pg_catalog.jsonb_array_length(p_content -> 'correctOrder') = pg_catalog.jsonb_array_length(p_content -> 'items')
  ), items AS (
    SELECT item.value, item.ordinality
    FROM shape, pg_catalog.jsonb_array_elements(shape.content -> 'items') WITH ORDINALITY AS item(value, ordinality)
  ), ordered_ids AS (
    SELECT ordered_id.value, ordered_id.ordinality
    FROM shape, pg_catalog.jsonb_array_elements(shape.content -> 'correctOrder') WITH ORDINALITY AS ordered_id(value, ordinality)
  )
  SELECT EXISTS (SELECT 1 FROM shape)
    AND NOT EXISTS (
      SELECT 1 FROM items
      WHERE pg_catalog.jsonb_typeof(items.value) <> 'object'
        OR (SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_object_keys(items.value)) <> 2
        OR NOT items.value ? 'id' OR NOT items.value ? 'text'
        OR pg_catalog.jsonb_typeof(items.value -> 'id') <> 'string'
        OR pg_catalog.jsonb_typeof(items.value -> 'text') <> 'string'
        OR NOT (items.value ->> 'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
        OR pg_catalog.btrim(items.value ->> 'text') = ''
        OR pg_catalog.char_length(items.value ->> 'text') > 1000
    )
    AND (SELECT pg_catalog.count(*) FROM items) = (SELECT pg_catalog.count(DISTINCT value ->> 'id') FROM items)
    AND NOT EXISTS (
      SELECT 1 FROM items GROUP BY pg_catalog.lower(pg_catalog.btrim(value ->> 'text')) HAVING pg_catalog.count(*) > 1
    )
    AND NOT EXISTS (
      SELECT 1 FROM ordered_ids
      WHERE pg_catalog.jsonb_typeof(ordered_ids.value) <> 'string'
        OR NOT (ordered_ids.value #>> '{}' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
    )
    AND (SELECT pg_catalog.count(*) FROM ordered_ids) = (SELECT pg_catalog.count(DISTINCT value #>> '{}') FROM ordered_ids)
    AND NOT EXISTS (
      SELECT 1 FROM ordered_ids
      WHERE NOT EXISTS (SELECT 1 FROM items WHERE items.value ->> 'id' = ordered_ids.value #>> '{}')
    );
$$;

ALTER FUNCTION qwestum_private.is_valid_sequence_task_content(jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION qwestum_private.is_valid_sequence_task_content(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION qwestum_private.is_valid_sequence_task_content(jsonb) FROM anon;
REVOKE ALL ON FUNCTION qwestum_private.is_valid_sequence_task_content(jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION qwestum_private.is_valid_sequence_task_content(jsonb) FROM service_role;

-- Keep M049's existing public task-image validation in one private helper so
-- both runtime versions retain their exact image safety boundary.
CREATE FUNCTION qwestum_private.public_task_image_url(
  p_author_id uuid, p_quest_id uuid, p_task_id uuid, p_image_url text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
  SELECT CASE
    WHEN p_image_url IS NOT NULL
      AND pg_catalog.left(p_image_url, pg_catalog.char_length(prefix.expected_prefix)) = prefix.expected_prefix
      AND pg_catalog.substr(p_image_url, pg_catalog.char_length(prefix.expected_prefix) + 1)
        ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
    THEN p_image_url
    ELSE NULL
  END
  FROM qwestum_private.task_image_runtime_config AS config
  CROSS JOIN LATERAL (
    SELECT config.supabase_public_origin || '/storage/v1/object/public/quest-images/teachers/'
      || p_author_id::text || '/quests/' || p_quest_id::text || '/tasks/' || p_task_id::text || '/' AS expected_prefix
  ) AS prefix
  WHERE config.singleton = TRUE
    AND config.supabase_public_origin = pg_catalog.btrim(config.supabase_public_origin)
    AND config.supabase_public_origin = pg_catalog.lower(config.supabase_public_origin)
    AND pg_catalog.char_length(config.supabase_public_origin) BETWEEN 12 AND 261
    AND config.supabase_public_origin !~ '[[:space:]]'
    AND config.supabase_public_origin ~ '^https://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$';
$$;

ALTER FUNCTION qwestum_private.public_task_image_url(uuid,uuid,uuid,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION qwestum_private.public_task_image_url(uuid,uuid,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION qwestum_private.public_task_image_url(uuid,uuid,uuid,text) FROM anon;
REVOKE ALL ON FUNCTION qwestum_private.public_task_image_url(uuid,uuid,uuid,text) FROM authenticated;
REVOKE ALL ON FUNCTION qwestum_private.public_task_image_url(uuid,uuid,uuid,text) FROM service_role;

ALTER TABLE public.quest_attempt_answers
  DROP CONSTRAINT quest_attempt_answers_task_type_check,
  ADD CONSTRAINT quest_attempt_answers_task_type_check
    CHECK (task_type IN ('text', 'single_choice', 'multiple_choice', 'sequence'));

-- The current task-create function is intentionally retained in full: its
-- parent-first lock and legacy NULL choice-draft behavior are unchanged.
CREATE OR REPLACE FUNCTION public.create_owned_quest_task(
  p_quest_id uuid, p_title text, p_description text, p_answer text, p_hint text,
  p_points integer, p_task_type text, p_content jsonb
)
RETURNS TABLE(outcome text, id uuid, quest_id uuid, title text, description text,
  answer text, hint text, image_url text, video_url text, audio_url text,
  content jsonb, points integer, task_type text, sort_order integer)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_task_count integer; v_max_sort_order integer; v_next_sort_order integer;
  v_has_null_sort_order boolean; v_normalized_count integer;
BEGIN
  IF auth.uid() IS NULL OR p_quest_id IS NULL OR p_title IS NULL OR pg_catalog.btrim(p_title) = ''
    OR p_points IS NULL OR p_points < 1 OR p_task_type IS NULL
    OR p_task_type NOT IN ('text', 'single_choice', 'multiple_choice', 'sequence')
    OR (p_task_type = 'sequence' AND p_content IS NOT NULL AND NOT qwestum_private.is_valid_sequence_task_content(p_content)) THEN RETURN; END IF;
  PERFORM 1 FROM public.quests AS q WHERE q.id = p_quest_id AND q.author_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  WITH locked_tasks AS (
    SELECT qt.id, qt.sort_order FROM public.quest_tasks AS qt WHERE qt.quest_id = p_quest_id
    ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC FOR UPDATE
  ) SELECT pg_catalog.count(*)::integer, COALESCE(pg_catalog.bool_or(locked.sort_order IS NULL), FALSE), pg_catalog.max(locked.sort_order)
    INTO v_task_count, v_has_null_sort_order, v_max_sort_order FROM locked_tasks AS locked;
  IF v_task_count >= 100 THEN
    RETURN QUERY SELECT 'task_limit_reached'::text, NULL::uuid, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::jsonb, NULL::integer, NULL::text, NULL::integer; RETURN;
  END IF;
  IF v_has_null_sort_order OR v_max_sort_order = 2147483647 THEN
    WITH ordered_tasks AS (SELECT qt.id, pg_catalog.row_number() OVER (ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC)::integer AS normalized_sort_order FROM public.quest_tasks AS qt WHERE qt.quest_id = p_quest_id),
    updated_tasks AS (UPDATE public.quest_tasks AS qt SET sort_order = ordered.normalized_sort_order FROM ordered_tasks AS ordered WHERE qt.id = ordered.id RETURNING qt.id)
    SELECT pg_catalog.count(*)::integer INTO v_normalized_count FROM updated_tasks;
    IF v_normalized_count <> v_task_count THEN RAISE EXCEPTION 'Owned task order normalization failed'; END IF;
    v_next_sort_order := v_task_count + 1;
  ELSE v_next_sort_order := COALESCE(v_max_sort_order, 0) + 1; END IF;
  RETURN QUERY INSERT INTO public.quest_tasks AS qt (quest_id,title,description,answer,hint,image_url,video_url,audio_url,points,task_type,content,sort_order)
    VALUES (p_quest_id,p_title,p_description,p_answer,p_hint,NULL,'','',p_points,p_task_type,p_content,v_next_sort_order)
    RETURNING 'created'::text,qt.id,qt.quest_id,qt.title,qt.description,qt.answer,qt.hint,qt.image_url,qt.video_url,qt.audio_url,qt.content,qt.points,qt.task_type,qt.sort_order;
END;
$$;

ALTER FUNCTION public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb) FROM service_role;
GRANT EXECUTE ON FUNCTION public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_owned_quest_task_content_v2(
  p_quest_id uuid, p_task_id uuid, p_title text, p_description text, p_points integer,
  p_content jsonb, p_narrative_intro text, p_narrative_success text
)
RETURNS TABLE(id uuid, quest_id uuid, title text, description text, answer text, hint text,
  image_url text, video_url text, audio_url text, content jsonb, points integer,
  task_type text, sort_order integer, narrative_intro text, narrative_success text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_task_type text; v_narrative_intro text; v_narrative_success text;
BEGIN
  IF auth.uid() IS NULL OR p_quest_id IS NULL OR p_task_id IS NULL OR p_title IS NULL OR p_title !~ '[^[:space:]]'
    OR pg_catalog.char_length(p_title)>500 OR p_description IS NULL OR pg_catalog.char_length(p_description)>10000
    OR p_points IS NULL OR p_points<1 OR (p_content IS NOT NULL AND pg_catalog.jsonb_typeof(p_content)<>'object') THEN RETURN; END IF;
  v_narrative_intro:=NULLIF(pg_catalog.regexp_replace(p_narrative_intro,'^[[:space:]]+|[[:space:]]+$','','g'),'');
  v_narrative_success:=NULLIF(pg_catalog.regexp_replace(p_narrative_success,'^[[:space:]]+|[[:space:]]+$','','g'),'');
  IF (v_narrative_intro IS NOT NULL AND (v_narrative_intro~E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]' OR pg_catalog.char_length(v_narrative_intro)>4000)) OR (v_narrative_success IS NOT NULL AND (v_narrative_success~E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]' OR pg_catalog.char_length(v_narrative_success)>4000)) THEN RETURN; END IF;
  PERFORM 1 FROM public.quests AS q WHERE q.id=p_quest_id AND q.author_id=auth.uid() FOR UPDATE; IF NOT FOUND THEN RETURN; END IF;
  SELECT qt.task_type INTO v_task_type FROM public.quest_tasks AS qt WHERE qt.id=p_task_id AND qt.quest_id=p_quest_id FOR UPDATE;
  IF NOT FOUND OR v_task_type NOT IN ('text','single_choice','multiple_choice','sequence') OR (v_task_type='sequence' AND p_content IS NOT NULL AND NOT qwestum_private.is_valid_sequence_task_content(p_content)) THEN RETURN; END IF;
  IF v_task_type='single_choice' AND p_content IS NOT NULL AND (pg_catalog.jsonb_typeof(p_content->'options') IS DISTINCT FROM 'array' OR pg_catalog.jsonb_typeof(p_content->'correctOptionId') IS DISTINCT FROM 'string' OR COALESCE((p_content->>'correctOptionId') !~ '[^[:space:]]',TRUE) OR pg_catalog.jsonb_array_length(p_content->'options')<2) THEN RETURN; END IF;
  IF v_task_type='multiple_choice' AND p_content IS NOT NULL AND (pg_catalog.jsonb_typeof(p_content->'options') IS DISTINCT FROM 'array' OR pg_catalog.jsonb_typeof(p_content->'correctOptionIds') IS DISTINCT FROM 'array' OR pg_catalog.jsonb_array_length(p_content->'options')<2 OR pg_catalog.jsonb_array_length(p_content->'correctOptionIds')<2) THEN RETURN; END IF;
  RETURN QUERY UPDATE public.quest_tasks AS qt SET title=pg_catalog.btrim(p_title),description=pg_catalog.btrim(p_description),points=p_points,content=p_content,narrative_intro=v_narrative_intro,narrative_success=v_narrative_success WHERE qt.id=p_task_id AND qt.quest_id=p_quest_id RETURNING qt.id,qt.quest_id,qt.title,qt.description,qt.answer,qt.hint,qt.image_url,qt.video_url,qt.audio_url,qt.content,qt.points,qt.task_type,qt.sort_order,qt.narrative_intro,qt.narrative_success;
END;
$$;

ALTER FUNCTION public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text) FROM anon;
REVOKE ALL ON FUNCTION public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text) FROM authenticated;
REVOKE ALL ON FUNCTION public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text) TO authenticated;

-- Existing Text/Choice eligibility predicates remain in the authoritative M036
-- definition. This replacement adds the Sequence branch with the same general
-- task checks and delegates its exact content validation to the private helper.
CREATE OR REPLACE FUNCTION public.is_public_runtime_eligible(p_quest_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quests AS q WHERE q.id=p_quest_id AND q.is_public IS TRUE
      AND q.title IS NOT NULL AND pg_catalog.btrim(q.title)<>'' AND pg_catalog.char_length(q.title)<=500
      AND (q.description IS NULL OR pg_catalog.char_length(q.description)<=10000)
      AND (SELECT pg_catalog.count(*) FROM public.quest_tasks qt WHERE qt.quest_id=q.id) BETWEEN 1 AND 100
      AND NOT EXISTS (
        SELECT 1 FROM public.quest_tasks AS qt WHERE qt.quest_id=q.id AND NOT COALESCE(
          (qt.task_type='text' AND qt.title IS NOT NULL AND pg_catalog.btrim(qt.title)<>'' AND pg_catalog.char_length(qt.title)<=500 AND (qt.description IS NULL OR pg_catalog.char_length(qt.description)<=10000))
          OR (qt.task_type IN ('single_choice','multiple_choice') AND qt.title IS NOT NULL AND pg_catalog.btrim(qt.title)<>'' AND pg_catalog.char_length(qt.title)<=500 AND (qt.description IS NULL OR pg_catalog.char_length(qt.description)<=10000) AND qt.points IS NOT NULL AND qt.points>0
            AND pg_catalog.jsonb_typeof(qt.content)='object' AND pg_catalog.jsonb_typeof(qt.content->'options')='array' AND pg_catalog.jsonb_array_length(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'options')='array' THEN qt.content->'options' ELSE '[]'::jsonb END) BETWEEN 2 AND 100
            AND NOT EXISTS (SELECT 1 FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'options')='array' THEN qt.content->'options' ELSE '[]'::jsonb END) AS o(value) WHERE pg_catalog.jsonb_typeof(o.value)<>'object' OR pg_catalog.jsonb_typeof(o.value->'id')<>'string' OR pg_catalog.jsonb_typeof(o.value->'text')<>'string' OR pg_catalog.btrim(o.value->>'id')='' OR pg_catalog.btrim(o.value->>'text')='' OR pg_catalog.char_length(o.value->>'id')>128 OR pg_catalog.char_length(o.value->>'text')>4000)
            AND (SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'options')='array' THEN qt.content->'options' ELSE '[]'::jsonb END))=(SELECT pg_catalog.count(DISTINCT o.value->>'id') FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'options')='array' THEN qt.content->'options' ELSE '[]'::jsonb END) o(value))
            AND NOT EXISTS (SELECT 1 FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'options')='array' THEN qt.content->'options' ELSE '[]'::jsonb END) AS o(value) GROUP BY pg_catalog.lower(pg_catalog.btrim(o.value->>'text')) HAVING pg_catalog.count(*)>1)
            AND ((qt.task_type='single_choice' AND pg_catalog.jsonb_typeof(qt.content->'correctOptionId')='string' AND pg_catalog.btrim(qt.content->>'correctOptionId')<>'' AND pg_catalog.char_length(qt.content->>'correctOptionId')<=128 AND (SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'options')='array' THEN qt.content->'options' ELSE '[]'::jsonb END) o(value) WHERE o.value->>'id'=qt.content->>'correctOptionId')=1)
              OR (qt.task_type='multiple_choice' AND pg_catalog.jsonb_typeof(qt.content->'correctOptionIds')='array' AND pg_catalog.jsonb_array_length(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'correctOptionIds')='array' THEN qt.content->'correctOptionIds' ELSE '[]'::jsonb END) BETWEEN 2 AND 100 AND NOT EXISTS (SELECT 1 FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'correctOptionIds')='array' THEN qt.content->'correctOptionIds' ELSE '[]'::jsonb END) c(value) WHERE pg_catalog.jsonb_typeof(c.value)<>'string' OR pg_catalog.regexp_replace(c.value#>>'{}','[[:space:]]+','','g')='' OR pg_catalog.char_length(c.value#>>'{}')>128 OR NOT EXISTS (SELECT 1 FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'options')='array' THEN qt.content->'options' ELSE '[]'::jsonb END) o(value) WHERE o.value->>'id'=c.value#>>'{}')) AND (SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'correctOptionIds')='array' THEN qt.content->'correctOptionIds' ELSE '[]'::jsonb END))=(SELECT pg_catalog.count(DISTINCT c.value#>>'{}') FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'correctOptionIds')='array' THEN qt.content->'correctOptionIds' ELSE '[]'::jsonb END) c(value)))) )
          OR (qt.task_type='sequence' AND qt.title IS NOT NULL AND pg_catalog.btrim(qt.title)<>'' AND pg_catalog.char_length(qt.title)<=500 AND (qt.description IS NULL OR pg_catalog.char_length(qt.description)<=10000) AND qt.points IS NOT NULL AND qt.points>0 AND qwestum_private.is_valid_sequence_task_content(qt.content)), FALSE)
      )
  );
$$;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM service_role;

-- Public runtime functions preserve their existing safe text/choice projection.
-- Sequence uses hash ordering, then rotates one item if that order accidentally
-- equals correctOrder; it never emits correctOrder or raw content.
CREATE OR REPLACE FUNCTION public.get_public_runtime_quest(p_quest_id uuid)
RETURNS TABLE(id uuid,title text,description text,tasks jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog, public AS $$
  WITH q AS (SELECT quests.id,quests.author_id,quests.title,quests.description FROM public.quests WHERE quests.id=p_quest_id AND public.is_public_runtime_eligible(quests.id))
  SELECT q.id,q.title,q.description,(SELECT pg_catalog.jsonb_agg(CASE
    WHEN qt.task_type='text' THEN pg_catalog.jsonb_build_object('id',qt.id::text,'task_type','text','title',qt.title,'description',qt.description,'image_url',qwestum_private.public_task_image_url(q.author_id,q.id,qt.id,qt.image_url))
    WHEN qt.task_type IN ('single_choice','multiple_choice') THEN pg_catalog.jsonb_build_object('id',qt.id::text,'task_type',qt.task_type,'title',qt.title,'description',qt.description,'image_url',qwestum_private.public_task_image_url(q.author_id,q.id,qt.id,qt.image_url),'options',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',x.value->>'id','text',x.value->>'text') ORDER BY x.ordinality) FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'options')='array' THEN qt.content->'options' ELSE '[]'::jsonb END) WITH ORDINALITY x(value,ordinality)))
    WHEN qt.task_type='sequence' THEN pg_catalog.jsonb_build_object('id',qt.id::text,'task_type','sequence','title',qt.title,'description',qt.description,'image_url',qwestum_private.public_task_image_url(q.author_id,q.id,qt.id,qt.image_url),'items',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',s.value->>'id','text',s.value->>'text') ORDER BY CASE WHEN hashed.ids=canonical.ids AND hashed.count>1 THEN (pg_catalog.array_position(hashed.ids,s.value->>'id')%hashed.count)+1 ELSE pg_catalog.array_position(hashed.ids,s.value->>'id') END) FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'items')='array' THEN qt.content->'items' ELSE '[]'::jsonb END) WITH ORDINALITY s(value,ordinality) CROSS JOIN LATERAL (SELECT pg_catalog.array_agg(h.value->>'id' ORDER BY pg_catalog.md5(qt.id::text||(h.value->>'id')),h.value->>'id') ids,pg_catalog.count(*)::integer count FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'items')='array' THEN qt.content->'items' ELSE '[]'::jsonb END) h(value)) hashed CROSS JOIN LATERAL (SELECT pg_catalog.array_agg(c.value#>>'{}' ORDER BY c.ordinality) ids FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'correctOrder')='array' THEN qt.content->'correctOrder' ELSE '[]'::jsonb END) WITH ORDINALITY c(value,ordinality)) canonical))
  END ORDER BY qt.sort_order ASC NULLS LAST,qt.id ASC) FROM public.quest_tasks qt WHERE qt.quest_id=q.id) FROM q;
$$;

-- V2 keeps narrative keys and the same strict Sequence redaction/order contract.
CREATE OR REPLACE FUNCTION public.get_public_runtime_quest_v2(p_quest_id uuid)
RETURNS TABLE(id uuid,title text,description text,mission_intro text,mission_outro text,tasks jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog, public AS $$
  WITH q AS (SELECT quests.id,quests.author_id,quests.title,quests.description,quests.mission_intro,quests.mission_outro FROM public.quests WHERE quests.id=p_quest_id AND public.is_public_runtime_eligible(quests.id))
  SELECT q.id,q.title,q.description,q.mission_intro,q.mission_outro,(SELECT pg_catalog.jsonb_agg(CASE
    WHEN qt.task_type='text' THEN pg_catalog.jsonb_build_object('id',qt.id::text,'task_type','text','title',qt.title,'description',qt.description,'narrative_intro',qt.narrative_intro,'narrative_success',qt.narrative_success,'image_url',qwestum_private.public_task_image_url(q.author_id,q.id,qt.id,qt.image_url))
    WHEN qt.task_type IN ('single_choice','multiple_choice') THEN pg_catalog.jsonb_build_object('id',qt.id::text,'task_type',qt.task_type,'title',qt.title,'description',qt.description,'narrative_intro',qt.narrative_intro,'narrative_success',qt.narrative_success,'image_url',qwestum_private.public_task_image_url(q.author_id,q.id,qt.id,qt.image_url),'options',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',x.value->>'id','text',x.value->>'text') ORDER BY x.ordinality) FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'options')='array' THEN qt.content->'options' ELSE '[]'::jsonb END) WITH ORDINALITY x(value,ordinality)))
    WHEN qt.task_type='sequence' THEN pg_catalog.jsonb_build_object('id',qt.id::text,'task_type','sequence','title',qt.title,'description',qt.description,'narrative_intro',qt.narrative_intro,'narrative_success',qt.narrative_success,'image_url',qwestum_private.public_task_image_url(q.author_id,q.id,qt.id,qt.image_url),'items',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',s.value->>'id','text',s.value->>'text') ORDER BY CASE WHEN hashed.ids=canonical.ids AND hashed.count>1 THEN (pg_catalog.array_position(hashed.ids,s.value->>'id')%hashed.count)+1 ELSE pg_catalog.array_position(hashed.ids,s.value->>'id') END) FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'items')='array' THEN qt.content->'items' ELSE '[]'::jsonb END) WITH ORDINALITY s(value,ordinality) CROSS JOIN LATERAL (SELECT pg_catalog.array_agg(h.value->>'id' ORDER BY pg_catalog.md5(qt.id::text||(h.value->>'id')),h.value->>'id') ids,pg_catalog.count(*)::integer count FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'items')='array' THEN qt.content->'items' ELSE '[]'::jsonb END) h(value)) hashed CROSS JOIN LATERAL (SELECT pg_catalog.array_agg(c.value#>>'{}' ORDER BY c.ordinality) ids FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'correctOrder')='array' THEN qt.content->'correctOrder' ELSE '[]'::jsonb END) WITH ORDINALITY c(value,ordinality)) canonical))
  END ORDER BY qt.sort_order ASC NULLS LAST,qt.id ASC) FROM public.quest_tasks qt WHERE qt.quest_id=q.id) FROM q;
$$;

ALTER FUNCTION public.get_public_runtime_quest(uuid) OWNER TO postgres;
ALTER FUNCTION public.get_public_runtime_quest_v2(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM PUBLIC; REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM anon; REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM authenticated; REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM service_role;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest_v2(uuid) FROM PUBLIC; REVOKE ALL ON FUNCTION public.get_public_runtime_quest_v2(uuid) FROM anon; REVOKE ALL ON FUNCTION public.get_public_runtime_quest_v2(uuid) FROM authenticated; REVOKE ALL ON FUNCTION public.get_public_runtime_quest_v2(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest_v2(uuid) TO anon, authenticated;

-- Keep the established all-or-nothing response contract. The client parser is
-- extended in a later application phase; this RPC independently rejects bad data.
CREATE OR REPLACE FUNCTION public.score_public_runtime_quest(p_quest_id uuid,p_answers jsonb)
RETURNS TABLE(earned_points bigint,possible_points bigint,correct_count integer,incorrect_count integer,unanswered_count integer,not_scored_count integer,task_results jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog, public AS $$
  WITH eligible AS (
    SELECT id FROM public.get_public_runtime_quest(p_quest_id)
  ), tasks AS (
    SELECT qt.id,qt.task_type,qt.points,qt.sort_order,qt.content
    FROM public.quest_tasks qt JOIN eligible q ON q.id=qt.quest_id
  ), entries AS (
    SELECT e.value answer FROM pg_catalog.jsonb_array_elements(
      CASE WHEN pg_catalog.jsonb_typeof(p_answers->'answers')='array' THEN p_answers->'answers' ELSE '[]'::jsonb END
    ) e(value)
  ), answers AS (
    SELECT answer,answer->>'taskId' task_id,answer->>'selectedOptionId' selected_option_id,
      answer->'selectedOptionIds' selected_option_ids,
      CASE WHEN pg_catalog.jsonb_typeof(answer->'selectedOptionIds')='array' THEN answer->'selectedOptionIds' ELSE '[]'::jsonb END selected_option_ids_safe,
      answer->'orderedItemIds' ordered_item_ids,
      CASE WHEN pg_catalog.jsonb_typeof(answer->'orderedItemIds')='array' THEN answer->'orderedItemIds' ELSE '[]'::jsonb END ordered_item_ids_safe
    FROM entries
  ), valid AS (
    SELECT 1
    WHERE pg_catalog.jsonb_typeof(p_answers)='object'
      AND pg_catalog.jsonb_typeof(p_answers->'answers')='array'
      AND pg_catalog.pg_column_size(p_answers)<=32768
      AND pg_catalog.jsonb_array_length(CASE WHEN pg_catalog.jsonb_typeof(p_answers->'answers')='array' THEN p_answers->'answers' ELSE '[]'::jsonb END) BETWEEN 1 AND 100
      AND (SELECT count(*) FROM entries)=(SELECT count(*) FROM tasks)
      AND (SELECT count(*) FROM answers)=(SELECT count(DISTINCT task_id) FROM answers)
      AND NOT EXISTS (
        SELECT 1 FROM entries WHERE pg_catalog.jsonb_typeof(answer)<>'object'
          OR pg_catalog.jsonb_typeof(answer->'taskId')<>'string'
          OR NOT(answer->>'taskId'~*'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
          OR EXISTS(SELECT 1 FROM pg_catalog.jsonb_object_keys(answer) k(key) WHERE k.key NOT IN('taskId','selectedOptionId','selectedOptionIds','orderedItemIds'))
          OR ((answer?'selectedOptionId')::int+(answer?'selectedOptionIds')::int+(answer?'orderedItemIds')::int)>1
      )
      AND NOT EXISTS(SELECT 1 FROM answers a LEFT JOIN tasks t ON t.id::text=a.task_id WHERE t.id IS NULL)
      AND NOT EXISTS(SELECT 1 FROM tasks t LEFT JOIN answers a ON a.task_id=t.id::text WHERE a.task_id IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM tasks t JOIN answers a ON a.task_id=t.id::text WHERE
          (t.task_type='text' AND ((a.answer?'selectedOptionId' AND pg_catalog.jsonb_typeof(a.answer->'selectedOptionId')<>'null') OR a.answer?'selectedOptionIds' OR a.answer?'orderedItemIds'))
          OR (t.task_type='single_choice' AND (a.answer?'selectedOptionIds' OR a.answer?'orderedItemIds' OR (a.answer?'selectedOptionId' AND pg_catalog.jsonb_typeof(a.answer->'selectedOptionId') NOT IN('null','string')) OR (pg_catalog.jsonb_typeof(a.answer->'selectedOptionId')='string' AND pg_catalog.btrim(a.selected_option_id)<>'' AND (pg_catalog.char_length(a.selected_option_id)>128 OR NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(t.content->'options') o(value) WHERE o.value->>'id'=a.selected_option_id)))))
          OR (t.task_type='multiple_choice' AND (a.answer?'selectedOptionId' OR a.answer?'orderedItemIds' OR (a.answer?'selectedOptionIds' AND (pg_catalog.jsonb_typeof(a.selected_option_ids)<>'array' OR EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(a.selected_option_ids_safe)x(value) WHERE pg_catalog.jsonb_typeof(x.value)<>'string' OR pg_catalog.btrim(x.value#>>'{}')='' OR pg_catalog.char_length(x.value#>>'{}')>128 OR NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(t.content->'options')o(value) WHERE o.value->>'id'=x.value#>>'{}')) OR (SELECT count(*) FROM pg_catalog.jsonb_array_elements(a.selected_option_ids_safe))<>(SELECT count(DISTINCT x.value#>>'{}') FROM pg_catalog.jsonb_array_elements(a.selected_option_ids_safe)x(value))))))
          OR (t.task_type='sequence' AND (a.answer?'selectedOptionId' OR a.answer?'selectedOptionIds' OR (a.answer?'orderedItemIds' AND (pg_catalog.jsonb_typeof(a.ordered_item_ids)<>'array' OR pg_catalog.jsonb_array_length(a.ordered_item_ids_safe)<>(SELECT pg_catalog.jsonb_array_length(t.content->'items')) OR EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(a.ordered_item_ids_safe)x(value) WHERE pg_catalog.jsonb_typeof(x.value)<>'string' OR NOT(x.value#>>'{}'~*'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') OR NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(t.content->'items')i(value) WHERE i.value->>'id'=x.value#>>'{}')) OR (SELECT count(*) FROM pg_catalog.jsonb_array_elements(a.ordered_item_ids_safe))<>(SELECT count(DISTINCT x.value#>>'{}') FROM pg_catalog.jsonb_array_elements(a.ordered_item_ids_safe)x(value)))) ))
      )
  ), scored AS (
    SELECT t.id,t.task_type,t.points,t.sort_order,
      CASE
        WHEN t.task_type='text' THEN 'not_scored'
        WHEN t.task_type='single_choice' AND (a.selected_option_id IS NULL OR pg_catalog.btrim(a.selected_option_id)='') THEN 'unanswered'
        WHEN t.task_type='single_choice' AND a.selected_option_id=t.content->>'correctOptionId' THEN 'correct'
        WHEN t.task_type='single_choice' THEN 'incorrect'
        WHEN t.task_type='multiple_choice' AND (a.selected_option_ids IS NULL OR pg_catalog.jsonb_array_length(a.selected_option_ids_safe)=0) THEN 'unanswered'
        WHEN t.task_type='multiple_choice' AND NOT EXISTS((SELECT x.value#>>'{}' FROM pg_catalog.jsonb_array_elements(a.selected_option_ids_safe)x(value)) EXCEPT (SELECT x.value#>>'{}' FROM pg_catalog.jsonb_array_elements(t.content->'correctOptionIds')x(value))) AND NOT EXISTS((SELECT x.value#>>'{}' FROM pg_catalog.jsonb_array_elements(t.content->'correctOptionIds')x(value)) EXCEPT (SELECT x.value#>>'{}' FROM pg_catalog.jsonb_array_elements(a.selected_option_ids_safe)x(value))) THEN 'correct'
        WHEN t.task_type='multiple_choice' THEN 'incorrect'
        WHEN t.task_type='sequence' AND a.ordered_item_ids IS NULL THEN 'unanswered'
        WHEN t.task_type='sequence' AND NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(a.ordered_item_ids_safe) WITH ORDINALITY a_id(value,ordinality) FULL JOIN pg_catalog.jsonb_array_elements(t.content->'correctOrder') WITH ORDINALITY c_id(value,ordinality) USING(ordinality) WHERE a_id.value#>>'{}' IS DISTINCT FROM c_id.value#>>'{}') THEN 'correct'
        WHEN t.task_type='sequence' THEN 'incorrect'
      END status
    FROM tasks t JOIN valid ON TRUE JOIN answers a ON a.task_id=t.id::text
  )
  SELECT COALESCE(sum(CASE WHEN status='correct' THEN points ELSE 0 END),0)::bigint,COALESCE(sum(CASE WHEN task_type IN('single_choice','multiple_choice','sequence') THEN points ELSE 0 END),0)::bigint,count(*) FILTER(WHERE status='correct')::integer,count(*) FILTER(WHERE status='incorrect')::integer,count(*) FILTER(WHERE status='unanswered')::integer,count(*) FILTER(WHERE status='not_scored')::integer,pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('taskId',id::text,'status',status) ORDER BY sort_order ASC NULLS LAST,id ASC) FROM scored HAVING count(*)>0;
$$;
ALTER FUNCTION public.score_public_runtime_quest(uuid,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid,jsonb) FROM PUBLIC; REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid,jsonb) FROM anon; REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid,jsonb) FROM authenticated; REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid,jsonb) FROM service_role;
GRANT EXECUTE ON FUNCTION public.score_public_runtime_quest(uuid,jsonb) TO anon, authenticated;

-- Preserve M044 lock order/idempotency and change only sequence snapshot branches.
CREATE OR REPLACE FUNCTION public.submit_student_quest_attempt(p_attempt_id uuid,p_answers jsonb)
RETURNS TABLE(attempt_id uuid,earned_points bigint,possible_points bigint,correct_count integer,incorrect_count integer,unanswered_count integer,not_scored_count integer,task_results jsonb)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog, public AS $$
DECLARE v_student_id uuid; v_quest_id uuid; v_attempt public.quest_attempts%ROWTYPE; v_quest_title text; v_runtime_tasks jsonb; v_earned_points bigint; v_possible_points bigint; v_correct_count integer; v_incorrect_count integer; v_unanswered_count integer; v_not_scored_count integer; v_task_results jsonb; v_inserted_count integer;
BEGIN
  v_student_id:=auth.uid(); IF v_student_id IS NULL OR p_attempt_id IS NULL OR NOT qwestum_private.current_actor_is_student() THEN RETURN; END IF;
  SELECT qa.quest_id INTO v_quest_id FROM public.quest_attempts qa WHERE qa.id=p_attempt_id AND qa.student_id=v_student_id; IF NOT FOUND THEN RETURN; END IF;
  PERFORM 1 FROM public.quests q WHERE q.id=v_quest_id FOR SHARE; IF NOT FOUND OR NOT qwestum_private.current_actor_is_student() THEN RETURN; END IF;
  SELECT qa.* INTO v_attempt FROM public.quest_attempts qa WHERE qa.id=p_attempt_id AND qa.student_id=v_student_id AND qa.quest_id=v_quest_id FOR UPDATE; IF NOT FOUND THEN RETURN; END IF;
  IF v_attempt.status='submitted' THEN RETURN QUERY SELECT v_attempt.id,v_attempt.earned_points,v_attempt.possible_points,v_attempt.correct_count,v_attempt.incorrect_count,v_attempt.unanswered_count,v_attempt.not_scored_count,COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('taskId',qaa.source_task_id::text,'status',qaa.status) ORDER BY qaa.task_order) FROM public.quest_attempt_answers qaa WHERE qaa.attempt_id=v_attempt.id),'[]'::jsonb); RETURN; END IF;
  IF v_attempt.status<>'started' THEN RETURN; END IF;
  SELECT q.title INTO v_quest_title FROM public.quests AS q WHERE q.id=v_attempt.quest_id;
  IF NOT FOUND THEN RETURN; END IF;
  PERFORM 1 FROM public.quest_tasks qt WHERE qt.quest_id=v_attempt.quest_id ORDER BY qt.sort_order ASC NULLS LAST,qt.id ASC FOR SHARE;
  IF NOT public.is_public_runtime_eligible(v_attempt.quest_id) THEN RETURN; END IF;
  SELECT s.earned_points,s.possible_points,s.correct_count,s.incorrect_count,s.unanswered_count,s.not_scored_count,s.task_results INTO v_earned_points,v_possible_points,v_correct_count,v_incorrect_count,v_unanswered_count,v_not_scored_count,v_task_results FROM public.score_public_runtime_quest(v_attempt.quest_id,p_answers)s; IF NOT FOUND THEN RETURN; END IF;
  SELECT r.tasks INTO v_runtime_tasks FROM public.get_public_runtime_quest(v_attempt.quest_id)r; IF NOT FOUND OR pg_catalog.jsonb_typeof(v_runtime_tasks)<>'array' THEN RETURN; END IF;
  UPDATE public.quest_attempts qa SET status='submitted',submitted_at=now(),quest_title_snapshot=v_quest_title,earned_points=v_earned_points,possible_points=v_possible_points,correct_count=v_correct_count,incorrect_count=v_incorrect_count,unanswered_count=v_unanswered_count,not_scored_count=v_not_scored_count WHERE qa.id=v_attempt.id;
  INSERT INTO public.quest_attempt_answers(attempt_id,source_task_id,task_order,task_type,task_snapshot,answer_snapshot,status,earned_points,possible_points)
  SELECT v_attempt.id,(r.value->>'id')::uuid,r.ordinality::integer,r.value->>'task_type',r.value,CASE r.value->>'task_type' WHEN 'text' THEN '{}'::jsonb WHEN 'single_choice' THEN pg_catalog.jsonb_build_object('selectedOptionId',COALESCE(a.value->'selectedOptionId','null'::jsonb)) WHEN 'multiple_choice' THEN pg_catalog.jsonb_build_object('selectedOptionIds',COALESCE(a.value->'selectedOptionIds','[]'::jsonb)) WHEN 'sequence' THEN pg_catalog.jsonb_build_object('orderedItemIds',COALESCE(a.value->'orderedItemIds','[]'::jsonb)) END,tr.value->>'status',CASE WHEN tr.value->>'status'='correct' THEN qt.points::bigint ELSE 0::bigint END,CASE WHEN r.value->>'task_type' IN('single_choice','multiple_choice','sequence') THEN qt.points::bigint ELSE 0::bigint END
  FROM pg_catalog.jsonb_array_elements(v_runtime_tasks) WITH ORDINALITY r(value,ordinality) JOIN public.quest_tasks qt ON qt.id::text=r.value->>'id' AND qt.quest_id=v_attempt.quest_id JOIN LATERAL(SELECT e.value FROM pg_catalog.jsonb_array_elements(p_answers->'answers')e(value) WHERE e.value->>'taskId'=r.value->>'id')a ON TRUE JOIN LATERAL(SELECT e.value FROM pg_catalog.jsonb_array_elements(v_task_results)e(value) WHERE e.value->>'taskId'=r.value->>'id')tr ON TRUE;
  GET DIAGNOSTICS v_inserted_count=ROW_COUNT; IF v_inserted_count<>pg_catalog.jsonb_array_length(v_runtime_tasks) THEN RAISE EXCEPTION 'student attempt snapshot did not contain every scored task'; END IF;
  RETURN QUERY SELECT v_attempt.id,v_earned_points,v_possible_points,v_correct_count,v_incorrect_count,v_unanswered_count,v_not_scored_count,v_task_results;
END;
$$;
ALTER FUNCTION public.submit_student_quest_attempt(uuid,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.submit_student_quest_attempt(uuid,jsonb) FROM PUBLIC; REVOKE ALL ON FUNCTION public.submit_student_quest_attempt(uuid,jsonb) FROM anon; REVOKE ALL ON FUNCTION public.submit_student_quest_attempt(uuid,jsonb) FROM authenticated; REVOKE ALL ON FUNCTION public.submit_student_quest_attempt(uuid,jsonb) FROM service_role;
GRANT EXECUTE ON FUNCTION public.submit_student_quest_attempt(uuid,jsonb) TO authenticated;

COMMIT;
