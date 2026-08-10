-- Sprint 12.20.23: extend the strict public runtime boundary with Multiple Choice.
-- Invalid public eligibility or submission returns zero rows so callers receive the
-- existing generic unavailable outcome without an answer-key oracle.

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
              ) WITH ORDINALITY AS option(value, ordinality)
            )
          )
          WHEN qt.task_type = 'multiple_choice' THEN pg_catalog.jsonb_build_object(
            'id', qt.id::text,
            'task_type', 'multiple_choice',
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

CREATE OR REPLACE FUNCTION public.score_public_runtime_quest(
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
      END AS selected_option_id,
      CASE
        WHEN pg_catalog.jsonb_typeof(answer_entries.answer -> 'selectedOptionIds') = 'array'
          THEN answer_entries.answer -> 'selectedOptionIds'
        ELSE NULL
      END AS selected_option_ids
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
            WHERE answer_key.key NOT IN ('taskId', 'selectedOptionId', 'selectedOptionIds')
          )
          OR (
            answer_entries.answer ? 'selectedOptionId'
            AND answer_entries.answer ? 'selectedOptionIds'
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
            (answer_values.answer ? 'selectedOptionId'
              AND pg_catalog.jsonb_typeof(answer_values.answer -> 'selectedOptionId') <> 'null')
            OR answer_values.answer ? 'selectedOptionIds'
          )
        )
        OR (
          qt.task_type = 'single_choice'
          AND (
            answer_values.answer ? 'selectedOptionIds'
            OR (
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
        OR (
          qt.task_type = 'multiple_choice'
          AND (
            answer_values.answer ? 'selectedOptionId'
            OR (
              answer_values.answer ? 'selectedOptionIds'
              AND pg_catalog.jsonb_typeof(answer_values.answer -> 'selectedOptionIds') <> 'array'
            )
            OR (
              pg_catalog.jsonb_typeof(answer_values.answer -> 'selectedOptionIds') = 'array'
              AND (
                EXISTS (
                  SELECT 1
                  FROM pg_catalog.jsonb_array_elements(answer_values.selected_option_ids) AS selected_option_id(value)
                  WHERE pg_catalog.jsonb_typeof(selected_option_id.value) IS DISTINCT FROM 'string'
                    OR pg_catalog.regexp_replace(
                      selected_option_id.value #>> '{}',
                      '[[:space:]]+',
                      '',
                      'g'
                    ) = ''
                    OR pg_catalog.char_length(selected_option_id.value #>> '{}') > 128
                )
                OR (
                  SELECT pg_catalog.count(*)
                  FROM pg_catalog.jsonb_array_elements(answer_values.selected_option_ids) AS selected_option_id(value)
                ) <> (
                  SELECT pg_catalog.count(DISTINCT selected_option_id.value #>> '{}')
                  FROM pg_catalog.jsonb_array_elements(answer_values.selected_option_ids) AS selected_option_id(value)
                )
                OR EXISTS (
                  SELECT 1
                  FROM pg_catalog.jsonb_array_elements(answer_values.selected_option_ids) AS selected_option_id(value)
                  WHERE NOT EXISTS (
                    SELECT 1
                    FROM pg_catalog.jsonb_array_elements(qt.content -> 'options') AS option(value)
                    WHERE option.value ->> 'id' = selected_option_id.value #>> '{}'
                  )
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
        WHEN qt.task_type = 'single_choice'
          AND (
            answer_values.selected_option_id IS NULL
            OR pg_catalog.regexp_replace(
              answer_values.selected_option_id,
              '[[:space:]]+',
              '',
              'g'
            ) = ''
          ) THEN 'unanswered'
        WHEN qt.task_type = 'single_choice'
          AND answer_values.selected_option_id = qt.content ->> 'correctOptionId' THEN 'correct'
        WHEN qt.task_type = 'single_choice' THEN 'incorrect'
        WHEN qt.task_type = 'multiple_choice'
          AND (
            answer_values.selected_option_ids IS NULL
            OR pg_catalog.jsonb_array_length(answer_values.selected_option_ids) = 0
          ) THEN 'unanswered'
        WHEN qt.task_type = 'multiple_choice'
          AND NOT EXISTS (
            (
              SELECT selected_option_id.value #>> '{}'
              FROM pg_catalog.jsonb_array_elements(answer_values.selected_option_ids) AS selected_option_id(value)
            )
            EXCEPT
            (
              SELECT correct_option_id.value #>> '{}'
              FROM pg_catalog.jsonb_array_elements(qt.content -> 'correctOptionIds') AS correct_option_id(value)
            )
          )
          AND NOT EXISTS (
            (
              SELECT correct_option_id.value #>> '{}'
              FROM pg_catalog.jsonb_array_elements(qt.content -> 'correctOptionIds') AS correct_option_id(value)
            )
            EXCEPT
            (
              SELECT selected_option_id.value #>> '{}'
              FROM pg_catalog.jsonb_array_elements(answer_values.selected_option_ids) AS selected_option_id(value)
            )
          ) THEN 'correct'
        WHEN qt.task_type = 'multiple_choice' THEN 'incorrect'
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
          WHEN scored_tasks.task_type IN ('single_choice', 'multiple_choice') THEN scored_tasks.points
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

REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.is_public_runtime_eligible(uuid) FROM service_role;

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
