-- Sprint 12.19.4: public catalog read boundary; file preparation only, not applied to live Supabase.

CREATE INDEX quest_tasks_quest_id_idx
  ON public.quest_tasks (quest_id);

CREATE INDEX quests_public_catalog_created_at_id_idx
  ON public.quests (
    created_at DESC NULLS LAST,
    id DESC
  )
  WHERE is_public IS TRUE;

CREATE FUNCTION public.list_public_catalog_quests(
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
  WHERE q.is_public IS TRUE
    AND EXISTS (
      SELECT 1
      FROM public.quest_tasks AS qt
      WHERE qt.quest_id = q.id
    )
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

CREATE FUNCTION public.get_public_catalog_quest(
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
    AND q.is_public IS TRUE
    AND EXISTS (
      SELECT 1
      FROM public.quest_tasks AS qt
      WHERE qt.quest_id = q.id
    );
$$;

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

REVOKE ALL ON FUNCTION public.get_public_catalog_quest(uuid)
  FROM PUBLIC;

REVOKE ALL ON FUNCTION public.get_public_catalog_quest(uuid)
  FROM anon;

REVOKE ALL ON FUNCTION public.get_public_catalog_quest(uuid)
  FROM authenticated;

REVOKE ALL ON FUNCTION public.get_public_catalog_quest(uuid)
  FROM service_role;

GRANT EXECUTE ON FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
) TO anon;

GRANT EXECUTE ON FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_catalog_quest(uuid)
  TO anon;

GRANT EXECUTE ON FUNCTION public.get_public_catalog_quest(uuid)
  TO authenticated;
