-- P1 Public Task Image Delivery: expose only canonical public task-image URLs
-- through the existing anonymous runtime boundary. Legacy or malformed values
-- remain stored unchanged but project as NULL.

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
      q.author_id,
      q.title,
      q.description
    FROM public.quests AS q
    WHERE q.id = p_quest_id
      AND public.is_public_runtime_eligible(q.id)
  ),
  trusted_origin AS (
    SELECT c.supabase_public_origin
    FROM qwestum_private.task_image_runtime_config AS c
    WHERE c.singleton = TRUE
      AND c.supabase_public_origin = pg_catalog.btrim(c.supabase_public_origin)
      AND c.supabase_public_origin = pg_catalog.lower(c.supabase_public_origin)
      AND pg_catalog.char_length(c.supabase_public_origin) BETWEEN 12 AND 261
      AND c.supabase_public_origin !~ '[[:space:]]'
      AND c.supabase_public_origin ~
        '^https://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
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
            'description', qt.description,
            'image_url', (
              SELECT CASE
                WHEN qt.image_url IS NOT NULL
                  AND pg_catalog.left(
                    qt.image_url,
                    pg_catalog.char_length(prefix.expected_prefix)
                  ) = prefix.expected_prefix
                  AND pg_catalog.substr(
                    qt.image_url,
                    pg_catalog.char_length(prefix.expected_prefix) + 1
                  ) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
                THEN qt.image_url
                ELSE NULL
              END
              FROM trusted_origin AS origin
              CROSS JOIN LATERAL (
                SELECT
                  origin.supabase_public_origin
                  || '/storage/v1/object/public/quest-images/teachers/'
                  || q.author_id::text
                  || '/quests/'
                  || q.id::text
                  || '/tasks/'
                  || qt.id::text
                  || '/' AS expected_prefix
              ) AS prefix
            )
          )
          WHEN qt.task_type = 'single_choice' THEN pg_catalog.jsonb_build_object(
            'id', qt.id::text,
            'task_type', 'single_choice',
            'title', qt.title,
            'description', qt.description,
            'image_url', (
              SELECT CASE
                WHEN qt.image_url IS NOT NULL
                  AND pg_catalog.left(
                    qt.image_url,
                    pg_catalog.char_length(prefix.expected_prefix)
                  ) = prefix.expected_prefix
                  AND pg_catalog.substr(
                    qt.image_url,
                    pg_catalog.char_length(prefix.expected_prefix) + 1
                  ) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
                THEN qt.image_url
                ELSE NULL
              END
              FROM trusted_origin AS origin
              CROSS JOIN LATERAL (
                SELECT
                  origin.supabase_public_origin
                  || '/storage/v1/object/public/quest-images/teachers/'
                  || q.author_id::text
                  || '/quests/'
                  || q.id::text
                  || '/tasks/'
                  || qt.id::text
                  || '/' AS expected_prefix
              ) AS prefix
            ),
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
              ) WITH ORDINALITY AS option(value, ordinality)
            )
          )
          WHEN qt.task_type = 'multiple_choice' THEN pg_catalog.jsonb_build_object(
            'id', qt.id::text,
            'task_type', 'multiple_choice',
            'title', qt.title,
            'description', qt.description,
            'image_url', (
              SELECT CASE
                WHEN qt.image_url IS NOT NULL
                  AND pg_catalog.left(
                    qt.image_url,
                    pg_catalog.char_length(prefix.expected_prefix)
                  ) = prefix.expected_prefix
                  AND pg_catalog.substr(
                    qt.image_url,
                    pg_catalog.char_length(prefix.expected_prefix) + 1
                  ) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
                THEN qt.image_url
                ELSE NULL
              END
              FROM trusted_origin AS origin
              CROSS JOIN LATERAL (
                SELECT
                  origin.supabase_public_origin
                  || '/storage/v1/object/public/quest-images/teachers/'
                  || q.author_id::text
                  || '/quests/'
                  || q.id::text
                  || '/tasks/'
                  || qt.id::text
                  || '/' AS expected_prefix
              ) AS prefix
            ),
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
              ) WITH ORDINALITY AS option(value, ordinality)
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

ALTER FUNCTION public.get_public_runtime_quest(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest(uuid) TO authenticated;
