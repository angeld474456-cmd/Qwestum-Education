-- Sprint 12.20.30: owner-safe partial metadata update boundary.

CREATE FUNCTION public.update_owned_quest_metadata(
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
  p_has_estimated_duration_minutes boolean
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
  estimated_duration_minutes integer
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
  v_normalized_title text;
  v_normalized_description text;
  v_normalized_category text;
BEGIN
  IF auth.uid() IS NULL OR p_quest_id IS NULL THEN
    RETURN;
  END IF;

  IF p_title IS NULL
    OR p_description IS NULL
    OR p_difficulty IS NULL
    OR p_difficulty NOT IN (1, 2, 3)
    OR p_has_subject_id IS NULL
    OR p_has_language_code IS NULL
    OR p_has_category IS NULL
    OR p_has_tags IS NULL
    OR p_has_grade_min IS NULL
    OR p_has_grade_max IS NULL
    OR p_has_estimated_duration_minutes IS NULL THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer;
    RETURN;
  END IF;

  v_normalized_title := pg_catalog.btrim(p_title);
  v_normalized_description := pg_catalog.btrim(p_description);

  IF v_normalized_title = '' THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer;
    RETURN;
  END IF;

  SELECT
    q.subject_id,
    q.language_code,
    q.category,
    q.tags,
    q.grade_min,
    q.grade_max,
    q.estimated_duration_minutes
  INTO
    v_subject_id,
    v_language_code,
    v_category,
    v_tags,
    v_grade_min,
    v_grade_max,
    v_estimated_duration_minutes
  FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF p_has_subject_id THEN
    v_subject_id := p_subject_id;
    IF v_subject_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.subjects AS s WHERE s.id = v_subject_id
      ) THEN
      RETURN QUERY SELECT 'subject_not_found'::text, NULL::uuid, NULL::text,
        NULL::text, NULL::uuid, NULL::text, NULL::text, NULL::text[],
        NULL::integer, NULL::boolean, NULL::integer, NULL::integer,
        NULL::integer;
      RETURN;
    END IF;
  END IF;

  IF p_has_language_code THEN
    v_language_code := p_language_code;
  END IF;

  IF v_language_code IS NOT NULL AND v_language_code NOT IN ('ru', 'kk', 'en') THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer;
    RETURN;
  END IF;

  IF p_has_category THEN
    IF p_category IS NULL THEN
      v_category := NULL;
    ELSIF p_category ~ E'[\\x01-\\x1F\\x7F]' THEN
      RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
        NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
        NULL::boolean, NULL::integer, NULL::integer, NULL::integer;
      RETURN;
    ELSE
      v_normalized_category := NULLIF(
        pg_catalog.btrim(pg_catalog.regexp_replace(p_category, E'\\s+', ' ', 'g')),
        ''
      );
      v_category := v_normalized_category;
    END IF;
  END IF;

  IF v_category IS NOT NULL AND pg_catalog.char_length(v_category) > 40 THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer;
    RETURN;
  END IF;

  IF p_has_tags THEN
    IF p_tags IS NULL
      OR EXISTS (
        SELECT 1
        FROM pg_catalog.unnest(p_tags) AS tag(value)
        WHERE tag.value IS NULL OR tag.value ~ E'[\\x01-\\x1F\\x7F]'
      ) THEN
      RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
        NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
        NULL::boolean, NULL::integer, NULL::integer, NULL::integer;
      RETURN;
    END IF;

    WITH normalized_tags AS (
      SELECT
        NULLIF(
          pg_catalog.btrim(pg_catalog.regexp_replace(tag.value, E'\\s+', ' ', 'g')),
          ''
        ) AS value,
        tag.ordinality
      FROM pg_catalog.unnest(p_tags) WITH ORDINALITY AS tag(value, ordinality)
    ),
    first_tags AS (
      SELECT DISTINCT ON (pg_catalog.lower(value))
        value,
        ordinality
      FROM normalized_tags
      WHERE value IS NOT NULL
      ORDER BY pg_catalog.lower(value), ordinality
    )
    SELECT COALESCE(
      pg_catalog.array_agg(value ORDER BY ordinality),
      ARRAY[]::text[]
    )
    INTO v_tags
    FROM first_tags;
  END IF;

  IF pg_catalog.cardinality(v_tags) > 10
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.unnest(v_tags) AS tag(value)
      WHERE pg_catalog.char_length(tag.value) > 24
    ) THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer;
    RETURN;
  END IF;

  IF p_has_grade_min THEN
    v_grade_min := p_grade_min;
  END IF;

  IF p_has_grade_max THEN
    v_grade_max := p_grade_max;
  END IF;

  IF (v_grade_min IS NULL) <> (v_grade_max IS NULL)
    OR (v_grade_min IS NOT NULL AND (v_grade_min < 1 OR v_grade_min > 11))
    OR (v_grade_max IS NOT NULL AND (v_grade_max < 1 OR v_grade_max > 11))
    OR (v_grade_min IS NOT NULL AND v_grade_max IS NOT NULL AND v_grade_min > v_grade_max) THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer;
    RETURN;
  END IF;

  IF p_has_estimated_duration_minutes THEN
    v_estimated_duration_minutes := p_estimated_duration_minutes;
  END IF;

  IF v_estimated_duration_minutes IS NOT NULL
    AND (v_estimated_duration_minutes < 5 OR v_estimated_duration_minutes > 240) THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text,
      NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::integer,
      NULL::boolean, NULL::integer, NULL::integer, NULL::integer;
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.quests AS q
  SET
    title = v_normalized_title,
    description = v_normalized_description,
    difficulty = p_difficulty,
    subject_id = v_subject_id,
    language_code = v_language_code,
    category = v_category,
    tags = v_tags,
    grade_min = v_grade_min,
    grade_max = v_grade_max,
    estimated_duration_minutes = v_estimated_duration_minutes
  WHERE q.id = p_quest_id
  RETURNING
    'updated'::text,
    q.id,
    q.title,
    q.description,
    q.subject_id,
    q.language_code,
    q.category,
    q.tags,
    q.difficulty,
    q.is_public,
    q.grade_min,
    q.grade_max,
    q.estimated_duration_minutes;
END;
$$;

ALTER FUNCTION public.update_owned_quest_metadata(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.update_owned_quest_metadata(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_owned_quest_metadata(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.update_owned_quest_metadata(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean) FROM authenticated;
REVOKE ALL ON FUNCTION public.update_owned_quest_metadata(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean) FROM service_role;
GRANT EXECUTE ON FUNCTION public.update_owned_quest_metadata(uuid, text, text, integer, uuid, boolean, text, boolean, text, boolean, text[], boolean, integer, boolean, integer, boolean, integer, boolean) TO authenticated;
