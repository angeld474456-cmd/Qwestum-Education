-- Sprint 12.19.6: anonymous public runtime boundary; source preparation only.
-- Zero rows are the generic unavailable or invalid-submission signal. The
-- application maps that outcome to: "Квест недоступен для прохождения".

CREATE FUNCTION public.get_public_runtime_quest(
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

CREATE FUNCTION public.score_public_runtime_quest(
  p_quest_id uuid,
  p_answers jsonb
)
RETURNS TABLE (
  earned_points bigint,
  possible_points bigint,
  correct_count integer,
  incorrect_count integer,
  unanswered_count integer,
  not_scored_count integer,
  task_results jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH eligible_quest AS (
    -- Reuse the fetch RPC as the authoritative public-runtime eligibility gate.
    SELECT runtime_quest.id
    FROM public.get_public_runtime_quest(p_quest_id) AS runtime_quest
  ),
  runtime_tasks AS (
    SELECT
      qt.id,
      qt.task_type,
      qt.points,
      qt.sort_order,
      qt.content
    FROM public.quest_tasks AS qt
    INNER JOIN eligible_quest AS q ON q.id = qt.quest_id
  ),
  submission_shape AS (
    SELECT TRUE AS is_valid
    WHERE pg_catalog.jsonb_typeof(p_answers) = 'object'
      AND pg_catalog.jsonb_typeof(p_answers -> 'answers') = 'array'
      AND pg_catalog.pg_column_size(p_answers) <= 32768
      AND (
        CASE
          WHEN pg_catalog.jsonb_typeof(p_answers -> 'answers') = 'array'
            THEN pg_catalog.jsonb_array_length(p_answers -> 'answers')
          ELSE 0
        END
      ) BETWEEN 1 AND 100
  ),
  answer_entries AS (
    SELECT entry.value AS answer
    FROM pg_catalog.jsonb_array_elements(
      CASE
        WHEN pg_catalog.jsonb_typeof(p_answers -> 'answers') = 'array'
          THEN p_answers -> 'answers'
        ELSE '[]'::jsonb
      END
    ) AS entry(value)
  ),
  answer_values AS (
    SELECT
      answer_entries.answer,
      answer_entries.answer ->> 'taskId' AS task_id,
      CASE
        WHEN pg_catalog.jsonb_typeof(answer_entries.answer -> 'selectedOptionId') = 'string'
          THEN answer_entries.answer ->> 'selectedOptionId'
        ELSE NULL
      END AS selected_option_id
    FROM answer_entries
  ),
  valid_submission AS (
    SELECT q.id
    FROM eligible_quest AS q
    WHERE EXISTS (SELECT 1 FROM submission_shape)
      AND (
        SELECT pg_catalog.count(*)
        FROM answer_entries
      ) = (
        SELECT pg_catalog.count(*)
        FROM runtime_tasks
      )
      AND (
        SELECT pg_catalog.count(*)
        FROM answer_values
      ) = (
        SELECT pg_catalog.count(DISTINCT answer_values.task_id)
        FROM answer_values
      )
      AND NOT EXISTS (
        SELECT 1
        FROM answer_entries
        WHERE pg_catalog.jsonb_typeof(answer_entries.answer) <> 'object'
          OR NOT (answer_entries.answer ? 'taskId')
          OR pg_catalog.jsonb_typeof(answer_entries.answer -> 'taskId') <> 'string'
          OR NOT (answer_entries.answer ->> 'taskId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
          OR EXISTS (
            SELECT 1
            FROM pg_catalog.jsonb_object_keys(
              CASE
                WHEN pg_catalog.jsonb_typeof(answer_entries.answer) = 'object'
                  THEN answer_entries.answer
                ELSE '{}'::jsonb
              END
            ) AS answer_key(key)
            WHERE answer_key.key NOT IN ('taskId', 'selectedOptionId')
          )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM answer_values
        LEFT JOIN runtime_tasks AS qt ON qt.id::text = answer_values.task_id
        WHERE qt.id IS NULL
      )
      AND NOT EXISTS (
        SELECT 1
        FROM runtime_tasks AS qt
        LEFT JOIN answer_values ON answer_values.task_id = qt.id::text
        WHERE answer_values.task_id IS NULL
      )
      AND NOT EXISTS (
        SELECT 1
        FROM runtime_tasks AS qt
        INNER JOIN answer_values ON answer_values.task_id = qt.id::text
        WHERE (
          qt.task_type = 'text'
          AND (
            answer_values.answer ? 'selectedOptionId'
            AND pg_catalog.jsonb_typeof(answer_values.answer -> 'selectedOptionId') <> 'null'
          )
        )
        OR (
          qt.task_type = 'single_choice'
          AND (
            (
              answer_values.answer ? 'selectedOptionId'
              AND pg_catalog.jsonb_typeof(answer_values.answer -> 'selectedOptionId') NOT IN ('null', 'string')
            )
            OR (
              pg_catalog.jsonb_typeof(answer_values.answer -> 'selectedOptionId') = 'string'
              AND pg_catalog.regexp_replace(
                answer_values.selected_option_id,
                '[[:space:]]+',
                '',
                'g'
              ) <> ''
              AND (
                pg_catalog.char_length(answer_values.selected_option_id) > 128
                OR NOT EXISTS (
                  SELECT 1
                  FROM pg_catalog.jsonb_array_elements(
                    CASE
                      WHEN pg_catalog.jsonb_typeof(qt.content -> 'options') = 'array'
                        THEN qt.content -> 'options'
                      ELSE '[]'::jsonb
                    END
                  ) AS option(value)
                  WHERE option.value ->> 'id' = answer_values.selected_option_id
                )
              )
            )
          )
        )
      )
  ),
  scored_tasks AS (
    SELECT
      qt.id,
      qt.task_type,
      qt.points,
      qt.sort_order,
      CASE
        WHEN qt.task_type = 'text' THEN 'not_scored'
        WHEN answer_values.selected_option_id IS NULL
          OR pg_catalog.regexp_replace(
            answer_values.selected_option_id,
            '[[:space:]]+',
            '',
            'g'
          ) = '' THEN 'unanswered'
        WHEN answer_values.selected_option_id = qt.content ->> 'correctOptionId' THEN 'correct'
        ELSE 'incorrect'
      END AS status
    FROM runtime_tasks AS qt
    INNER JOIN valid_submission AS q ON q.id = p_quest_id
    INNER JOIN answer_values ON answer_values.task_id = qt.id::text
  )
  SELECT
    COALESCE(
      pg_catalog.sum(
        CASE
          WHEN scored_tasks.status = 'correct' THEN scored_tasks.points
          ELSE 0
        END
      ),
      0
    )::bigint AS earned_points,
    COALESCE(
      pg_catalog.sum(
        CASE
          WHEN scored_tasks.task_type = 'single_choice' THEN scored_tasks.points
          ELSE 0
        END
      ),
      0
    )::bigint AS possible_points,
    pg_catalog.count(*) FILTER (WHERE scored_tasks.status = 'correct')::integer AS correct_count,
    pg_catalog.count(*) FILTER (WHERE scored_tasks.status = 'incorrect')::integer AS incorrect_count,
    pg_catalog.count(*) FILTER (WHERE scored_tasks.status = 'unanswered')::integer AS unanswered_count,
    pg_catalog.count(*) FILTER (WHERE scored_tasks.status = 'not_scored')::integer AS not_scored_count,
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'taskId', scored_tasks.id::text,
        'status', scored_tasks.status
      )
      ORDER BY scored_tasks.sort_order ASC NULLS LAST, scored_tasks.id ASC
    ) AS task_results
  FROM scored_tasks
  HAVING pg_catalog.count(*) > 0;
$$;

REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_public_runtime_quest(uuid) FROM service_role;

REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) FROM service_role;

GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.score_public_runtime_quest(uuid, jsonb) TO authenticated;
