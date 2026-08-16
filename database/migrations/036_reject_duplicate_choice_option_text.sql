-- Sprint P1: reject duplicate normalized choice-option text at the authoritative
-- public eligibility boundary without rewriting stored task content.

CREATE OR REPLACE FUNCTION public.is_public_runtime_eligible(
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
              AND NOT EXISTS (
                SELECT 1
                FROM pg_catalog.jsonb_array_elements(
                  CASE
                    WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array'
                      THEN qt.content -> 'options'
                    ELSE '[]'::jsonb
                  END
                ) AS option(value)
                GROUP BY pg_catalog.lower(pg_catalog.btrim(option.value ->> 'text'))
                HAVING pg_catalog.count(*) > 1
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
            )
            OR
            (
              qt.task_type = 'multiple_choice'
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
              AND pg_catalog.jsonb_typeof(qt.content -> 'correctOptionIds') = 'array'
              AND (
                CASE
                  WHEN pg_catalog.jsonb_typeof(qt.content -> 'correctOptionIds') = 'array'
                    THEN pg_catalog.jsonb_array_length(qt.content -> 'correctOptionIds')
                  ELSE 0
                END
              ) BETWEEN 2 AND 100
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
              AND NOT EXISTS (
                SELECT 1
                FROM pg_catalog.jsonb_array_elements(
                  CASE
                    WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array'
                      THEN qt.content -> 'options'
                    ELSE '[]'::jsonb
                  END
                ) AS option(value)
                GROUP BY pg_catalog.lower(pg_catalog.btrim(option.value ->> 'text'))
                HAVING pg_catalog.count(*) > 1
              )
              AND NOT EXISTS (
                SELECT 1
                FROM pg_catalog.jsonb_array_elements(
                  CASE
                    WHEN pg_catalog.jsonb_typeof(qt.content -> 'correctOptionIds') = 'array'
                      THEN qt.content -> 'correctOptionIds'
                    ELSE '[]'::jsonb
                  END
                ) AS correct_option_id(value)
                WHERE pg_catalog.jsonb_typeof(correct_option_id.value) IS DISTINCT FROM 'string'
                  OR pg_catalog.regexp_replace(
                    correct_option_id.value #>> '{}',
                    '[[:space:]]+',
                    '',
                    'g'
                  ) = ''
                  OR pg_catalog.char_length(correct_option_id.value #>> '{}') > 128
              )
              AND (
                SELECT pg_catalog.count(*)
                FROM pg_catalog.jsonb_array_elements(
                  CASE
                    WHEN pg_catalog.jsonb_typeof(qt.content -> 'correctOptionIds') = 'array'
                      THEN qt.content -> 'correctOptionIds'
                    ELSE '[]'::jsonb
                  END
                ) AS correct_option_id(value)
              ) = (
                SELECT pg_catalog.count(DISTINCT correct_option_id.value #>> '{}')
                FROM pg_catalog.jsonb_array_elements(
                  CASE
                    WHEN pg_catalog.jsonb_typeof(qt.content -> 'correctOptionIds') = 'array'
                      THEN qt.content -> 'correctOptionIds'
                    ELSE '[]'::jsonb
                  END
                ) AS correct_option_id(value)
              )
              AND NOT EXISTS (
                SELECT 1
                FROM pg_catalog.jsonb_array_elements(
                  CASE
                    WHEN pg_catalog.jsonb_typeof(qt.content -> 'correctOptionIds') = 'array'
                      THEN qt.content -> 'correctOptionIds'
                    ELSE '[]'::jsonb
                  END
                ) AS correct_option_id(value)
                WHERE NOT EXISTS (
                  SELECT 1
                  FROM pg_catalog.jsonb_array_elements(
                    CASE
                      WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array'
                        THEN qt.content -> 'options'
                      ELSE '[]'::jsonb
                    END
                  ) AS option(value)
                  WHERE option.value ->> 'id' = correct_option_id.value #>> '{}'
                )
              )
            ),
            FALSE
          )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM service_role;
