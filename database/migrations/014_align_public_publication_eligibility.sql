-- Sprint 12.20.2: one strict public eligibility predicate for catalog and runtime.
-- Public catalog entries must always be startable by the public runtime.

CREATE FUNCTION public.is_public_runtime_eligible(
  p_quest_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quests AS q
    WHERE q.id = p_quest_id
      AND q.is_public IS TRUE
      AND q.title IS NOT NULL
      AND pg_catalog.btrim(q.title) <> ''
      AND pg_catalog.char_length(q.title) <= 500
      AND (
        q.description IS NULL
        OR pg_catalog.char_length(q.description) <= 10000
      )
      AND (
        SELECT pg_catalog.count(*)
        FROM public.quest_tasks AS qt
        WHERE qt.quest_id = q.id
      ) BETWEEN 1 AND 100
      AND NOT EXISTS (
        SELECT 1
        FROM public.quest_tasks AS qt
        WHERE qt.quest_id = q.id
          AND NOT COALESCE(
            (
              qt.task_type = 'text'
              AND qt.title IS NOT NULL
              AND pg_catalog.btrim(qt.title) <> ''
              AND pg_catalog.char_length(qt.title) <= 500
              AND (
                qt.description IS NULL
                OR pg_catalog.char_length(qt.description) <= 10000
              )
            )
            OR
            (
              qt.task_type = 'single_choice'
              AND qt.title IS NOT NULL
              AND pg_catalog.btrim(qt.title) <> ''
              AND pg_catalog.char_length(qt.title) <= 500
              AND (
                qt.description IS NULL
                OR pg_catalog.char_length(qt.description) <= 10000
              )
              AND qt.points IS NOT NULL
              AND qt.points > 0
              AND pg_catalog.jsonb_typeof(qt.content) = 'object'
              AND pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array'
              AND (
                CASE
                  WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array'
                    THEN pg_catalog.jsonb_array_length(qt.content -> 'options')
                  ELSE 0
                END
              ) BETWEEN 2 AND 100
              AND pg_catalog.jsonb_typeof(qt.content -> 'correctOptionId') = 'string'
              AND pg_catalog.btrim(qt.content ->> 'correctOptionId') <> ''
              AND pg_catalog.char_length(qt.content ->> 'correctOptionId') <= 128
              AND NOT EXISTS (
                SELECT 1
                FROM pg_catalog.jsonb_array_elements(
                  CASE
                    WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array'
                      THEN qt.content -> 'options'
                    ELSE '[]'::jsonb
                  END
                ) AS option(value)
                WHERE pg_catalog.jsonb_typeof(option.value) IS DISTINCT FROM 'object'
                  OR pg_catalog.jsonb_typeof(option.value -> 'id') IS DISTINCT FROM 'string'
                  OR pg_catalog.jsonb_typeof(option.value -> 'text') IS DISTINCT FROM 'string'
                  OR pg_catalog.btrim(option.value ->> 'id') = ''
                  OR pg_catalog.btrim(option.value ->> 'text') = ''
                  OR pg_catalog.char_length(option.value ->> 'id') > 128
                  OR pg_catalog.char_length(option.value ->> 'text') > 4000
              )
              AND (
                SELECT pg_catalog.count(*)
                FROM pg_catalog.jsonb_array_elements(
                  CASE
                    WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array'
                      THEN qt.content -> 'options'
                    ELSE '[]'::jsonb
                  END
                ) AS option(value)
              ) = (
                SELECT pg_catalog.count(DISTINCT option.value ->> 'id')
                FROM pg_catalog.jsonb_array_elements(
                  CASE
                    WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array'
                      THEN qt.content -> 'options'
                    ELSE '[]'::jsonb
                  END
                ) AS option(value)
              )
              AND (
                SELECT pg_catalog.count(*)
                FROM pg_catalog.jsonb_array_elements(
                  CASE
                    WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array'
                      THEN qt.content -> 'options'
                    ELSE '[]'::jsonb
                  END
                ) AS option(value)
                WHERE option.value ->> 'id' = qt.content ->> 'correctOptionId'
              ) = 1
            ),
            FALSE
          )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.list_public_catalog_quests(
  p_search text DEFAULT NULL,
  p_subject_name text DEFAULT NULL,
  p_grade integer DEFAULT NULL,
  p_difficulty integer DEFAULT NULL,
  p_language_code text DEFAULT NULL,
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  subject_name text,
  difficulty integer,
  language_code text,
  grade_min integer,
  grade_max integer,
  estimated_duration_minutes integer,
  category text,
  tags text[],
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH normalized AS (
    SELECT
      NULLIF(
        pg_catalog.btrim(
          pg_catalog.regexp_replace(p_search, '\s+', ' ', 'g')
        ),
        ''
      ) AS search,
      NULLIF(
        pg_catalog.btrim(
          pg_catalog.regexp_replace(p_subject_name, '\s+', ' ', 'g')
        ),
        ''
      ) AS subject_name,
      NULLIF(
        pg_catalog.lower(pg_catalog.btrim(p_language_code)),
        ''
      ) AS language_code
  )
  SELECT
    q.id,
    q.title,
    q.description,
    s.name AS subject_name,
    q.difficulty,
    q.language_code,
    q.grade_min,
    q.grade_max,
    q.estimated_duration_minutes,
    q.category,
    COALESCE(q.tags, ARRAY[]::text[]) AS tags,
    q.created_at
  FROM public.quests AS q
  LEFT JOIN public.subjects AS s ON s.id = q.subject_id
  CROSS JOIN normalized AS n
  WHERE public.is_public_runtime_eligible(q.id)
    AND (
      n.search IS NULL
      OR q.title ILIKE '%' || pg_catalog.replace(
        pg_catalog.replace(
          pg_catalog.replace(n.search, '!', '!!'),
          '%',
          '!%'
        ),
        '_',
        '!_'
      ) || '%' ESCAPE '!'
      OR COALESCE(q.description, '') ILIKE '%' || pg_catalog.replace(
        pg_catalog.replace(
          pg_catalog.replace(n.search, '!', '!!'),
          '%',
          '!%'
        ),
        '_',
        '!_'
      ) || '%' ESCAPE '!'
    )
    AND (
      n.subject_name IS NULL
      OR pg_catalog.lower(s.name) = pg_catalog.lower(n.subject_name)
    )
    AND (
      p_grade IS NULL
      OR (
        q.grade_min IS NOT NULL
        AND q.grade_max IS NOT NULL
        AND q.grade_min <= p_grade
        AND q.grade_max >= p_grade
      )
    )
    AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
    AND (
      n.language_code IS NULL
      OR pg_catalog.lower(q.language_code) = n.language_code
    )
  ORDER BY q.created_at DESC NULLS LAST, q.id DESC
  LIMIT LEAST(
    GREATEST(COALESCE(p_limit, 24), 1),
    100
  )
  -- Bound anonymous offset scans for the MVP catalog.
  OFFSET LEAST(
    GREATEST(
      COALESCE(p_offset, 0),
      0
    ),
    10000
  );
$$;

CREATE OR REPLACE FUNCTION public.get_public_catalog_quest(
  p_quest_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  subject_name text,
  difficulty integer,
  language_code text,
  grade_min integer,
  grade_max integer,
  estimated_duration_minutes integer,
  category text,
  tags text[],
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    q.id,
    q.title,
    q.description,
    s.name AS subject_name,
    q.difficulty,
    q.language_code,
    q.grade_min,
    q.grade_max,
    q.estimated_duration_minutes,
    q.category,
    COALESCE(q.tags, ARRAY[]::text[]) AS tags,
    q.created_at
  FROM public.quests AS q
  LEFT JOIN public.subjects AS s ON s.id = q.subject_id
  WHERE q.id = p_quest_id
    AND public.is_public_runtime_eligible(q.id);
$$;

CREATE OR REPLACE FUNCTION public.get_public_runtime_quest(
  p_quest_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  tasks jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH eligible_quest AS (
    SELECT
      q.id,
      q.title,
      q.description
    FROM public.quests AS q
    WHERE q.id = p_quest_id
      AND public.is_public_runtime_eligible(q.id)
  )
  SELECT
    q.id,
    q.title,
    q.description,
    (
      SELECT pg_catalog.jsonb_agg(
        CASE
          WHEN qt.task_type = 'text' THEN pg_catalog.jsonb_build_object(
            'id', qt.id::text,
            'task_type', 'text',
            'title', qt.title,
            'description', qt.description
          )
          WHEN qt.task_type = 'single_choice' THEN pg_catalog.jsonb_build_object(
            'id', qt.id::text,
            'task_type', 'single_choice',
            'title', qt.title,
            'description', qt.description,
            'options', (
              SELECT pg_catalog.jsonb_agg(
                pg_catalog.jsonb_build_object(
                  'id', option.value ->> 'id',
                  'text', option.value ->> 'text'
                )
                ORDER BY option.ordinality
              )
              FROM pg_catalog.jsonb_array_elements(
                CASE
                  WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array'
                    THEN qt.content -> 'options'
                  ELSE '[]'::jsonb
                END
              )
                WITH ORDINALITY AS option(value, ordinality)
            )
          )
        END
        ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC
      )
      FROM public.quest_tasks AS qt
      WHERE qt.quest_id = q.id
    )
  FROM eligible_quest AS q;
$$;

REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM service_role;

REVOKE ALL ON FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
) FROM anon;
REVOKE ALL ON FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
) FROM authenticated;
REVOKE ALL ON FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
) FROM service_role;

REVOKE ALL ON FUNCTION public.get_public_catalog_quest(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_catalog_quest(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_catalog_quest(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_public_catalog_quest(uuid) FROM service_role;

REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM service_role;

REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) FROM service_role;

GRANT EXECUTE ON FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
) TO anon;
GRANT EXECUTE ON FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_catalog_quest(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_catalog_quest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) TO authenticated;
