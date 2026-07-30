-- Add a server-only cover resolver without exposing Storage paths publicly.
-- The existing public catalog functions are recreated because has_cover changes
-- their RETURNS TABLE shapes.

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

DROP FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
);
DROP FUNCTION public.get_public_catalog_quest(uuid);

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
  has_cover boolean,
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
    COALESCE(
      q.author_id IS NOT NULL
      AND q.cover_image_path ~ (
        '^teachers/' || q.author_id::text ||
        '/quests/' || q.id::text ||
        '/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|jpeg|png|webp)$'
      ),
      FALSE
    ) AS has_cover,
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
  has_cover boolean,
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
    COALESCE(
      q.author_id IS NOT NULL
      AND q.cover_image_path ~ (
        '^teachers/' || q.author_id::text ||
        '/quests/' || q.id::text ||
        '/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|jpeg|png|webp)$'
      ),
      FALSE
    ) AS has_cover,
    q.created_at
  FROM public.quests AS q
  LEFT JOIN public.subjects AS s ON s.id = q.subject_id
  WHERE q.id = p_quest_id
    AND public.is_public_runtime_eligible(q.id);
$$;

-- This resolver is for the trusted server media boundary only. It returns an
-- internal Storage object path that callers must never expose publicly.
CREATE FUNCTION public.resolve_public_catalog_cover(
  p_quest_id uuid
)
RETURNS TABLE (
  object_path text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT q.cover_image_path AS object_path
  FROM public.quests AS q
  WHERE p_quest_id IS NOT NULL
    AND q.id = p_quest_id
    AND public.is_public_runtime_eligible(q.id)
    AND q.author_id IS NOT NULL
    AND q.cover_image_path ~ (
      '^teachers/' || q.author_id::text ||
      '/quests/' || q.id::text ||
      '/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|jpeg|png|webp)$'
    );
$$;

ALTER FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
) OWNER TO postgres;
ALTER FUNCTION public.get_public_catalog_quest(uuid) OWNER TO postgres;
ALTER FUNCTION public.resolve_public_catalog_cover(uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.resolve_public_catalog_cover(uuid) IS
  'Server-only public cover resolver. Returns an internal path only to service_role; callers must not expose it publicly.';

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
REVOKE ALL ON FUNCTION public.resolve_public_catalog_cover(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_public_catalog_cover(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.resolve_public_catalog_cover(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.resolve_public_catalog_cover(uuid) FROM service_role;

GRANT EXECUTE ON FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
) TO anon;
GRANT EXECUTE ON FUNCTION public.list_public_catalog_quests(
  text, text, integer, integer, text, integer, integer
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_catalog_quest(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_catalog_quest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_public_catalog_cover(uuid) TO service_role;

-- Rollback outline (comments only):
-- 1. Remove application callers of has_cover and
--    public.resolve_public_catalog_cover(uuid).
-- 2. Revoke and drop public.resolve_public_catalog_cover(uuid).
-- 3. Drop and recreate public.list_public_catalog_quests(
--    text, text, integer, integer, text, integer, integer) and
--    public.get_public_catalog_quest(uuid).
-- 4. Restore the prior Migration 014 return signatures without has_cover.
-- 5. Restore prior catalog grants: PUBLIC revoked; anon EXECUTE granted;
--    authenticated EXECUTE granted; service_role not granted.
-- 6. Leave teacher cover rows, cover_image_path, quest-images objects, and
--    the Storage bucket and policies unchanged.
