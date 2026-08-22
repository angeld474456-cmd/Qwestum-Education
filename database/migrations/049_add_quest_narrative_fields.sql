-- Narrative MVP: additive public display copy with versioned write/runtime
-- boundaries. Existing owner, publication, scoring, and direct-table RLS
-- contracts remain authoritative.

BEGIN;

DO $$
BEGIN
  IF pg_catalog.to_regclass('public.quests') IS NULL
    OR pg_catalog.to_regclass('public.quest_tasks') IS NULL THEN
    RAISE EXCEPTION 'quest and task tables are required before applying M049';
  END IF;

  IF pg_catalog.to_regprocedure('public.update_owned_quest_metadata(uuid,text,text,integer,uuid,boolean,text,boolean,text,boolean,text[],boolean,integer,boolean,integer,boolean,integer,boolean)') IS NULL
    OR pg_catalog.to_regprocedure('public.update_owned_quest_task_content(uuid,uuid,text,text,integer,jsonb)') IS NULL
    OR pg_catalog.to_regprocedure('public.duplicate_owned_quest(uuid)') IS NULL
    OR pg_catalog.to_regprocedure('public.get_public_runtime_quest(uuid)') IS NULL
    OR pg_catalog.to_regprocedure('qwestum_private.current_actor_can_author()') IS NULL THEN
    RAISE EXCEPTION 'existing owner-safe narrative prerequisites are required before applying M049';
  END IF;

  IF pg_catalog.to_regprocedure('public.update_owned_quest_metadata_v2(uuid,text,text,integer,uuid,boolean,text,boolean,text,boolean,text[],boolean,integer,boolean,integer,boolean,integer,boolean,text,boolean,text,boolean)') IS NOT NULL
    OR pg_catalog.to_regprocedure('public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text)') IS NOT NULL
    OR pg_catalog.to_regprocedure('public.get_public_runtime_quest_v2(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'M049 narrative RPCs already exist; inspect before applying';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_attribute AS a
    WHERE a.attrelid IN ('public.quests'::pg_catalog.regclass, 'public.quest_tasks'::pg_catalog.regclass)
      AND a.attname IN ('mission_intro', 'mission_outro', 'narrative_intro', 'narrative_success')
      AND a.attnum > 0
      AND NOT a.attisdropped
  ) THEN
    RAISE EXCEPTION 'M049 narrative columns already exist; inspect before applying';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    WHERE p.oid IN (
      'public.update_owned_quest_metadata(uuid,text,text,integer,uuid,boolean,text,boolean,text,boolean,text[],boolean,integer,boolean,integer,boolean,integer,boolean)'::pg_catalog.regprocedure,
      'public.update_owned_quest_task_content(uuid,uuid,text,text,integer,jsonb)'::pg_catalog.regprocedure,
      'public.duplicate_owned_quest(uuid)'::pg_catalog.regprocedure,
      'public.get_public_runtime_quest(uuid)'::pg_catalog.regprocedure
    )
      AND (NOT p.prosecdef OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public']::text[])
  ) THEN
    RAISE EXCEPTION 'existing narrative predecessor RPCs must remain hardened before applying M049';
  END IF;
END;
$$;

ALTER TABLE public.quests
  ADD COLUMN mission_intro text NULL,
  ADD COLUMN mission_outro text NULL,
  ADD CONSTRAINT quests_mission_intro_check CHECK (
    mission_intro IS NULL OR (
      mission_intro ~ '[^[:space:]]'
      AND pg_catalog.char_length(mission_intro) <= 4000
      AND mission_intro !~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]'
    )
  ),
  ADD CONSTRAINT quests_mission_outro_check CHECK (
    mission_outro IS NULL OR (
      mission_outro ~ '[^[:space:]]'
      AND pg_catalog.char_length(mission_outro) <= 4000
      AND mission_outro !~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]'
    )
  );

ALTER TABLE public.quest_tasks
  ADD COLUMN narrative_intro text NULL,
  ADD COLUMN narrative_success text NULL,
  ADD CONSTRAINT quest_tasks_narrative_intro_check CHECK (
    narrative_intro IS NULL OR (
      narrative_intro ~ '[^[:space:]]'
      AND pg_catalog.char_length(narrative_intro) <= 4000
      AND narrative_intro !~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]'
    )
  ),
  ADD CONSTRAINT quest_tasks_narrative_success_check CHECK (
    narrative_success IS NULL OR (
      narrative_success ~ '[^[:space:]]'
      AND pg_catalog.char_length(narrative_success) <= 4000
      AND narrative_success !~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]'
    )
  );

CREATE FUNCTION public.update_owned_quest_metadata_v2(
  p_quest_id uuid,
  p_title text,
  p_description text,
  p_difficulty integer,
  p_subject_id uuid,
  p_has_subject_id boolean,
  p_language_code text,
  p_has_language_code boolean,
  p_category text,
  p_has_category boolean,
  p_tags text[],
  p_has_tags boolean,
  p_grade_min integer,
  p_has_grade_min boolean,
  p_grade_max integer,
  p_has_grade_max boolean,
  p_estimated_duration_minutes integer,
  p_has_estimated_duration_minutes boolean,
  p_mission_intro text,
  p_has_mission_intro boolean,
  p_mission_outro text,
  p_has_mission_outro boolean
)
RETURNS TABLE (
  outcome text,
  id uuid,
  title text,
  description text,
  subject_id uuid,
  language_code text,
  category text,
  tags text[],
  difficulty integer,
  is_public boolean,
  grade_min integer,
  grade_max integer,
  estimated_duration_minutes integer,
  mission_intro text,
  mission_outro text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_subject_id public.quests.subject_id%TYPE;
  v_language_code public.quests.language_code%TYPE;
  v_category public.quests.category%TYPE;
  v_tags public.quests.tags%TYPE;
  v_grade_min public.quests.grade_min%TYPE;
  v_grade_max public.quests.grade_max%TYPE;
  v_estimated_duration_minutes public.quests.estimated_duration_minutes%TYPE;
  v_mission_intro public.quests.mission_intro%TYPE;
  v_mission_outro public.quests.mission_outro%TYPE;
  v_normalized_title text;
  v_normalized_description text;
  v_normalized_category text;
BEGIN
  IF auth.uid() IS NULL OR p_quest_id IS NULL
    OR p_title IS NULL OR p_description IS NULL
    OR p_difficulty IS NULL OR p_difficulty NOT IN (1, 2, 3)
    OR p_has_subject_id IS NULL OR p_has_language_code IS NULL
    OR p_has_category IS NULL OR p_has_tags IS NULL
    OR p_has_grade_min IS NULL OR p_has_grade_max IS NULL
    OR p_has_estimated_duration_minutes IS NULL
    OR p_has_mission_intro IS NULL OR p_has_mission_outro IS NULL THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text;
    RETURN;
  END IF;

  v_normalized_title := pg_catalog.btrim(p_title);
  v_normalized_description := pg_catalog.btrim(p_description);
  IF v_normalized_title = '' THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text;
    RETURN;
  END IF;

  SELECT q.subject_id, q.language_code, q.category, q.tags, q.grade_min,
    q.grade_max, q.estimated_duration_minutes, q.mission_intro, q.mission_outro
  INTO v_subject_id, v_language_code, v_category, v_tags, v_grade_min,
    v_grade_max, v_estimated_duration_minutes, v_mission_intro, v_mission_outro
  FROM public.quests AS q
  WHERE q.id = p_quest_id AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN RETURN; END IF;

  IF p_has_subject_id THEN
    v_subject_id := p_subject_id;
    IF v_subject_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.subjects AS s WHERE s.id = v_subject_id) THEN
      RETURN QUERY SELECT 'subject_not_found'::text, NULL::uuid, NULL::text, NULL::text,
        NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
        NULL::boolean, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text;
      RETURN;
    END IF;
  END IF;

  IF p_has_language_code THEN v_language_code := p_language_code; END IF;
  IF v_language_code IS NOT NULL AND v_language_code NOT IN ('ru', 'kk', 'en') THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF p_has_category THEN
    IF p_category IS NULL THEN v_category := NULL;
    ELSIF p_category ~ E'[\\x01-\\x1F\\x7F]' THEN
      RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
        NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
        NULL::boolean, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text;
      RETURN;
    ELSE
      v_normalized_category := NULLIF(pg_catalog.btrim(pg_catalog.regexp_replace(p_category, E'\\s+', ' ', 'g')), '');
      v_category := v_normalized_category;
    END IF;
  END IF;
  IF v_category IS NOT NULL AND pg_catalog.char_length(v_category) > 40 THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF p_has_tags THEN
    IF p_tags IS NULL OR EXISTS (SELECT 1 FROM pg_catalog.unnest(p_tags) AS tag(value) WHERE tag.value IS NULL OR tag.value ~ E'[\\x01-\\x1F\\x7F]') THEN
      RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
        NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
        NULL::boolean, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text;
      RETURN;
    END IF;
    WITH normalized_tags AS (
      SELECT NULLIF(pg_catalog.btrim(pg_catalog.regexp_replace(tag.value, E'\\s+', ' ', 'g')), '') AS value, tag.ordinality
      FROM pg_catalog.unnest(p_tags) WITH ORDINALITY AS tag(value, ordinality)
    ), first_tags AS (
      SELECT DISTINCT ON (pg_catalog.lower(value)) value, ordinality
      FROM normalized_tags WHERE value IS NOT NULL ORDER BY pg_catalog.lower(value), ordinality
    )
    SELECT COALESCE(pg_catalog.array_agg(value ORDER BY ordinality), ARRAY[]::text[]) INTO v_tags FROM first_tags;
  END IF;
  IF pg_catalog.cardinality(v_tags) > 10 OR EXISTS (SELECT 1 FROM pg_catalog.unnest(v_tags) AS tag(value) WHERE pg_catalog.char_length(tag.value) > 24) THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF p_has_grade_min THEN v_grade_min := p_grade_min; END IF;
  IF p_has_grade_max THEN v_grade_max := p_grade_max; END IF;
  IF (v_grade_min IS NULL) <> (v_grade_max IS NULL)
    OR (v_grade_min IS NOT NULL AND (v_grade_min < 1 OR v_grade_min > 11))
    OR (v_grade_max IS NOT NULL AND (v_grade_max < 1 OR v_grade_max > 11))
    OR (v_grade_min IS NOT NULL AND v_grade_max IS NOT NULL AND v_grade_min > v_grade_max) THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF p_has_estimated_duration_minutes THEN v_estimated_duration_minutes := p_estimated_duration_minutes; END IF;
  IF v_estimated_duration_minutes IS NOT NULL AND (v_estimated_duration_minutes < 5 OR v_estimated_duration_minutes > 240) THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF p_has_mission_intro THEN
    v_mission_intro := NULLIF(pg_catalog.regexp_replace(p_mission_intro, '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
  END IF;
  IF p_has_mission_outro THEN
    v_mission_outro := NULLIF(pg_catalog.regexp_replace(p_mission_outro, '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
  END IF;
  IF (v_mission_intro IS NOT NULL AND (v_mission_intro ~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]' OR pg_catalog.char_length(v_mission_intro) > 4000))
    OR (v_mission_outro IS NOT NULL AND (v_mission_outro ~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]' OR pg_catalog.char_length(v_mission_outro) > 4000)) THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY UPDATE public.quests AS q SET
    title = v_normalized_title, description = v_normalized_description,
    difficulty = p_difficulty, subject_id = v_subject_id, language_code = v_language_code,
    category = v_category, tags = v_tags, grade_min = v_grade_min, grade_max = v_grade_max,
    estimated_duration_minutes = v_estimated_duration_minutes,
    mission_intro = v_mission_intro, mission_outro = v_mission_outro
  WHERE q.id = p_quest_id
  RETURNING 'updated'::text, q.id, q.title, q.description, q.subject_id,
    q.language_code, q.category, q.tags, q.difficulty, q.is_public, q.grade_min,
    q.grade_max, q.estimated_duration_minutes, q.mission_intro, q.mission_outro;
END;
$$;

ALTER FUNCTION public.update_owned_quest_metadata_v2(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean, text, boolean, text, boolean) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_owned_quest_metadata_v2(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean, text, boolean, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_owned_quest_metadata_v2(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean, text, boolean, text, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.update_owned_quest_metadata_v2(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean, text, boolean, text, boolean) FROM authenticated;
REVOKE ALL ON FUNCTION public.update_owned_quest_metadata_v2(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean, text, boolean, text, boolean) FROM service_role;
GRANT EXECUTE ON FUNCTION public.update_owned_quest_metadata_v2(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean, text, boolean, text, boolean) TO authenticated;

CREATE FUNCTION public.update_owned_quest_task_content_v2(
  p_quest_id uuid, p_task_id uuid, p_title text, p_description text,
  p_points integer, p_content jsonb, p_narrative_intro text, p_narrative_success text
)
RETURNS TABLE(
  id uuid, quest_id uuid, title text, description text, answer text, hint text,
  image_url text, video_url text, audio_url text, content jsonb, points integer,
  task_type text, sort_order integer, narrative_intro text, narrative_success text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_task_type text; v_narrative_intro text; v_narrative_success text;
BEGIN
  IF auth.uid() IS NULL OR p_quest_id IS NULL OR p_task_id IS NULL
    OR p_title IS NULL OR p_title !~ '[^[:space:]]' OR pg_catalog.char_length(p_title) > 500
    OR p_description IS NULL OR pg_catalog.char_length(p_description) > 10000
    OR p_points IS NULL OR p_points < 1
    OR (p_content IS NOT NULL AND pg_catalog.jsonb_typeof(p_content) <> 'object') THEN RETURN; END IF;
  v_narrative_intro := NULLIF(pg_catalog.regexp_replace(p_narrative_intro, '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
  v_narrative_success := NULLIF(pg_catalog.regexp_replace(p_narrative_success, '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
  IF (v_narrative_intro IS NOT NULL AND (v_narrative_intro ~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]' OR pg_catalog.char_length(v_narrative_intro) > 4000))
    OR (v_narrative_success IS NOT NULL AND (v_narrative_success ~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]' OR pg_catalog.char_length(v_narrative_success) > 4000)) THEN RETURN; END IF;
  PERFORM 1 FROM public.quests AS q WHERE q.id = p_quest_id AND q.author_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT qt.task_type INTO v_task_type FROM public.quest_tasks AS qt WHERE qt.id = p_task_id AND qt.quest_id = p_quest_id FOR UPDATE;
  IF NOT FOUND OR v_task_type NOT IN ('text', 'single_choice', 'multiple_choice') THEN RETURN; END IF;
  IF v_task_type = 'single_choice' AND p_content IS NOT NULL AND (
    pg_catalog.jsonb_typeof(p_content -> 'options') IS DISTINCT FROM 'array'
    OR pg_catalog.jsonb_typeof(p_content -> 'correctOptionId') IS DISTINCT FROM 'string'
    OR COALESCE((p_content ->> 'correctOptionId') !~ '[^[:space:]]', TRUE)
    OR pg_catalog.jsonb_array_length(p_content -> 'options') < 2) THEN RETURN; END IF;
  IF v_task_type = 'multiple_choice' AND p_content IS NOT NULL AND (
    pg_catalog.jsonb_typeof(p_content -> 'options') IS DISTINCT FROM 'array'
    OR pg_catalog.jsonb_typeof(p_content -> 'correctOptionIds') IS DISTINCT FROM 'array'
    OR pg_catalog.jsonb_array_length(p_content -> 'options') < 2
    OR pg_catalog.jsonb_array_length(p_content -> 'correctOptionIds') < 2) THEN RETURN; END IF;
  RETURN QUERY UPDATE public.quest_tasks AS qt SET
    title = pg_catalog.btrim(p_title), description = pg_catalog.btrim(p_description),
    points = p_points, content = p_content, narrative_intro = v_narrative_intro,
    narrative_success = v_narrative_success
  WHERE qt.id = p_task_id AND qt.quest_id = p_quest_id
  RETURNING qt.id, qt.quest_id, qt.title, qt.description, qt.answer, qt.hint,
    qt.image_url, qt.video_url, qt.audio_url, qt.content, qt.points, qt.task_type,
    qt.sort_order, qt.narrative_intro, qt.narrative_success;
END;
$$;

ALTER FUNCTION public.update_owned_quest_task_content_v2(uuid, uuid, text, text, integer, jsonb, text, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_owned_quest_task_content_v2(uuid, uuid, text, text, integer, jsonb, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_owned_quest_task_content_v2(uuid, uuid, text, text, integer, jsonb, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.update_owned_quest_task_content_v2(uuid, uuid, text, text, integer, jsonb, text, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.update_owned_quest_task_content_v2(uuid, uuid, text, text, integer, jsonb, text, text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.update_owned_quest_task_content_v2(uuid, uuid, text, text, integer, jsonb, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.duplicate_owned_quest(source_quest_id uuid)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_source public.quests%ROWTYPE;
  v_new_quest_id uuid;
BEGIN
  IF source_quest_id IS NULL OR auth.uid() IS NULL THEN RETURN NULL; END IF;
  SELECT q.* INTO v_source FROM public.quests AS q
  WHERE q.id = source_quest_id AND q.author_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  INSERT INTO public.quests (
    title, description, difficulty, subject_id, grade_min, grade_max,
    estimated_duration_minutes, language_code, category, tags, author_id,
    is_public, cover_image_path, mission_intro, mission_outro
  ) VALUES (
    v_source.title, v_source.description, v_source.difficulty, v_source.subject_id,
    v_source.grade_min, v_source.grade_max, v_source.estimated_duration_minutes,
    v_source.language_code, v_source.category, v_source.tags, auth.uid(), FALSE,
    NULL, v_source.mission_intro, v_source.mission_outro
  ) RETURNING id INTO v_new_quest_id;
  WITH source_tasks AS (
    SELECT qt.sort_order, qt.title, qt.description, qt.answer, qt.hint, qt.content,
      qt.points, qt.task_type, qt.narrative_intro, qt.narrative_success
    FROM public.quest_tasks AS qt WHERE qt.quest_id = source_quest_id
    ORDER BY qt.sort_order FOR SHARE
  ) INSERT INTO public.quest_tasks (
    quest_id, sort_order, title, description, answer, hint, content, points,
    task_type, image_url, video_url, audio_url, narrative_intro, narrative_success
  ) SELECT v_new_quest_id, st.sort_order, st.title, st.description, st.answer,
    st.hint, st.content, st.points, st.task_type, NULL, NULL, NULL,
    st.narrative_intro, st.narrative_success FROM source_tasks AS st;
  RETURN v_new_quest_id;
END;
$$;

ALTER FUNCTION public.duplicate_owned_quest(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.duplicate_owned_quest(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.duplicate_owned_quest(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.duplicate_owned_quest(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.duplicate_owned_quest(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.duplicate_owned_quest(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_runtime_quest(p_quest_id uuid)
RETURNS TABLE (id uuid, title text, description text, tasks jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH eligible_quest AS (
    SELECT q.id, q.author_id, q.title, q.description
    FROM public.quests AS q
    WHERE q.id = p_quest_id AND public.is_public_runtime_eligible(q.id)
  ), trusted_origin AS (
    SELECT c.supabase_public_origin FROM qwestum_private.task_image_runtime_config AS c
    WHERE c.singleton = TRUE AND c.supabase_public_origin = pg_catalog.btrim(c.supabase_public_origin)
      AND c.supabase_public_origin = pg_catalog.lower(c.supabase_public_origin)
      AND pg_catalog.char_length(c.supabase_public_origin) BETWEEN 12 AND 261
      AND c.supabase_public_origin !~ '[[:space:]]'
      AND c.supabase_public_origin ~ '^https://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
  )
  SELECT q.id, q.title, q.description, (
    SELECT pg_catalog.jsonb_agg(
      CASE
        WHEN qt.task_type = 'text' THEN pg_catalog.jsonb_build_object(
          'id', qt.id::text, 'task_type', 'text', 'title', qt.title,
          'description', qt.description, 'image_url', (
            SELECT CASE WHEN qt.image_url IS NOT NULL
              AND pg_catalog.left(qt.image_url, pg_catalog.char_length(prefix.expected_prefix)) = prefix.expected_prefix
              AND pg_catalog.substr(qt.image_url, pg_catalog.char_length(prefix.expected_prefix) + 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
              THEN qt.image_url ELSE NULL END
            FROM trusted_origin AS origin CROSS JOIN LATERAL (
              SELECT origin.supabase_public_origin || '/storage/v1/object/public/quest-images/teachers/' || q.author_id::text || '/quests/' || q.id::text || '/tasks/' || qt.id::text || '/' AS expected_prefix
            ) AS prefix
          )
        )
        WHEN qt.task_type IN ('single_choice', 'multiple_choice') THEN pg_catalog.jsonb_build_object(
          'id', qt.id::text, 'task_type', qt.task_type, 'title', qt.title,
          'description', qt.description, 'image_url', (
            SELECT CASE WHEN qt.image_url IS NOT NULL
              AND pg_catalog.left(qt.image_url, pg_catalog.char_length(prefix.expected_prefix)) = prefix.expected_prefix
              AND pg_catalog.substr(qt.image_url, pg_catalog.char_length(prefix.expected_prefix) + 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
              THEN qt.image_url ELSE NULL END
            FROM trusted_origin AS origin CROSS JOIN LATERAL (
              SELECT origin.supabase_public_origin || '/storage/v1/object/public/quest-images/teachers/' || q.author_id::text || '/quests/' || q.id::text || '/tasks/' || qt.id::text || '/' AS expected_prefix
            ) AS prefix
          ),
          'options', (SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', option.value ->> 'id', 'text', option.value ->> 'text') ORDER BY option.ordinality)
            FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array' THEN qt.content -> 'options' ELSE '[]'::jsonb END) WITH ORDINALITY AS option(value, ordinality))
        )
      END ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC
    ) FROM public.quest_tasks AS qt WHERE qt.quest_id = q.id
  ) FROM eligible_quest AS q;
$$;

ALTER FUNCTION public.get_public_runtime_quest(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest(uuid) TO authenticated;

CREATE FUNCTION public.get_public_runtime_quest_v2(p_quest_id uuid)
RETURNS TABLE (id uuid, title text, description text, mission_intro text, mission_outro text, tasks jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH eligible_quest AS (
    SELECT q.id, q.author_id, q.title, q.description, q.mission_intro, q.mission_outro
    FROM public.quests AS q
    WHERE q.id = p_quest_id AND public.is_public_runtime_eligible(q.id)
  ), trusted_origin AS (
    SELECT c.supabase_public_origin FROM qwestum_private.task_image_runtime_config AS c
    WHERE c.singleton = TRUE AND c.supabase_public_origin = pg_catalog.btrim(c.supabase_public_origin)
      AND c.supabase_public_origin = pg_catalog.lower(c.supabase_public_origin)
      AND pg_catalog.char_length(c.supabase_public_origin) BETWEEN 12 AND 261
      AND c.supabase_public_origin !~ '[[:space:]]'
      AND c.supabase_public_origin ~ '^https://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
  )
  SELECT q.id, q.title, q.description, q.mission_intro, q.mission_outro, (
    SELECT pg_catalog.jsonb_agg(
      CASE
        WHEN qt.task_type = 'text' THEN pg_catalog.jsonb_build_object(
          'id', qt.id::text, 'task_type', 'text', 'title', qt.title,
          'description', qt.description, 'narrative_intro', qt.narrative_intro,
          'narrative_success', qt.narrative_success, 'image_url', (
            SELECT CASE WHEN qt.image_url IS NOT NULL
              AND pg_catalog.left(qt.image_url, pg_catalog.char_length(prefix.expected_prefix)) = prefix.expected_prefix
              AND pg_catalog.substr(qt.image_url, pg_catalog.char_length(prefix.expected_prefix) + 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
              THEN qt.image_url ELSE NULL END
            FROM trusted_origin AS origin CROSS JOIN LATERAL (
              SELECT origin.supabase_public_origin || '/storage/v1/object/public/quest-images/teachers/' || q.author_id::text || '/quests/' || q.id::text || '/tasks/' || qt.id::text || '/' AS expected_prefix
            ) AS prefix
          )
        )
        WHEN qt.task_type IN ('single_choice', 'multiple_choice') THEN pg_catalog.jsonb_build_object(
          'id', qt.id::text, 'task_type', qt.task_type, 'title', qt.title,
          'description', qt.description, 'narrative_intro', qt.narrative_intro,
          'narrative_success', qt.narrative_success, 'image_url', (
            SELECT CASE WHEN qt.image_url IS NOT NULL
              AND pg_catalog.left(qt.image_url, pg_catalog.char_length(prefix.expected_prefix)) = prefix.expected_prefix
              AND pg_catalog.substr(qt.image_url, pg_catalog.char_length(prefix.expected_prefix) + 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
              THEN qt.image_url ELSE NULL END
            FROM trusted_origin AS origin CROSS JOIN LATERAL (
              SELECT origin.supabase_public_origin || '/storage/v1/object/public/quest-images/teachers/' || q.author_id::text || '/quests/' || q.id::text || '/tasks/' || qt.id::text || '/' AS expected_prefix
            ) AS prefix
          ),
          'options', (SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', option.value ->> 'id', 'text', option.value ->> 'text') ORDER BY option.ordinality)
            FROM pg_catalog.jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array' THEN qt.content -> 'options' ELSE '[]'::jsonb END) WITH ORDINALITY AS option(value, ordinality))
        )
      END ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC
    ) FROM public.quest_tasks AS qt WHERE qt.quest_id = q.id
  ) FROM eligible_quest AS q;
$$;

ALTER FUNCTION public.get_public_runtime_quest_v2(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest_v2(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest_v2(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest_v2(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest_v2(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest_v2(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest_v2(uuid) TO authenticated;

COMMIT;
