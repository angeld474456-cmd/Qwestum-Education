-- P1C-A: immutable, authenticated student attempt history. Anonymous runtime
-- scoring remains separate and unchanged.

BEGIN;

DO $$
BEGIN
  IF pg_catalog.to_regnamespace('qwestum_private') IS NULL THEN
    RAISE EXCEPTION 'qwestum_private schema is required before applying M044';
  END IF;

  IF pg_catalog.to_regclass('public.quest_attempts') IS NOT NULL
    OR pg_catalog.to_regclass('public.quest_attempt_answers') IS NOT NULL THEN
    RAISE EXCEPTION 'student attempt tables already exist; inspect before applying M044';
  END IF;

  IF pg_catalog.to_regprocedure('qwestum_private.current_actor_is_student()') IS NOT NULL
    OR pg_catalog.to_regprocedure('public.start_student_quest_attempt(uuid)') IS NOT NULL
    OR pg_catalog.to_regprocedure('public.submit_student_quest_attempt(uuid,jsonb)') IS NOT NULL THEN
    RAISE EXCEPTION 'student attempt functions already exist; inspect before applying M044';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies AS p
    WHERE p.schemaname = 'public'
      AND p.policyname IN (
        'quest_attempts_select_own',
        'quest_attempt_answers_select_own'
      )
  ) THEN
    RAISE EXCEPTION 'student attempt policies already exist; inspect before applying M044';
  END IF;

  IF pg_catalog.to_regprocedure('public.score_public_runtime_quest(uuid,jsonb)') IS NULL
    OR pg_catalog.to_regprocedure('public.get_public_runtime_quest(uuid)') IS NULL THEN
    RAISE EXCEPTION 'public runtime scoring functions are required before applying M044';
  END IF;
END;
$$;

CREATE TABLE public.quest_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id),
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE RESTRICT,
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz NULL,
  abandoned_at timestamptz NULL,
  quest_title_snapshot text NULL,
  earned_points bigint NULL,
  possible_points bigint NULL,
  correct_count integer NULL,
  incorrect_count integer NULL,
  unanswered_count integer NULL,
  not_scored_count integer NULL,
  CONSTRAINT quest_attempts_status_check
    CHECK (status IN ('started', 'submitted', 'abandoned')),
  CONSTRAINT quest_attempts_result_values_check
    CHECK (
      (earned_points IS NULL OR earned_points >= 0)
      AND (possible_points IS NULL OR possible_points >= 0)
      AND (earned_points IS NULL OR possible_points IS NULL OR earned_points <= possible_points)
      AND (correct_count IS NULL OR correct_count >= 0)
      AND (incorrect_count IS NULL OR incorrect_count >= 0)
      AND (unanswered_count IS NULL OR unanswered_count >= 0)
      AND (not_scored_count IS NULL OR not_scored_count >= 0)
    ),
  CONSTRAINT quest_attempts_state_check
    CHECK (
      (
        status = 'started'
        AND submitted_at IS NULL
        AND abandoned_at IS NULL
        AND quest_title_snapshot IS NULL
        AND earned_points IS NULL
        AND possible_points IS NULL
        AND correct_count IS NULL
        AND incorrect_count IS NULL
        AND unanswered_count IS NULL
        AND not_scored_count IS NULL
      )
      OR (
        status = 'submitted'
        AND submitted_at IS NOT NULL
        AND submitted_at >= started_at
        AND abandoned_at IS NULL
        AND quest_title_snapshot IS NOT NULL
        AND pg_catalog.btrim(quest_title_snapshot) <> ''
        AND earned_points IS NOT NULL
        AND possible_points IS NOT NULL
        AND correct_count IS NOT NULL
        AND incorrect_count IS NOT NULL
        AND unanswered_count IS NOT NULL
        AND not_scored_count IS NOT NULL
      )
      OR (
        status = 'abandoned'
        AND abandoned_at IS NOT NULL
        AND abandoned_at >= started_at
        AND submitted_at IS NULL
        AND quest_title_snapshot IS NULL
        AND earned_points IS NULL
        AND possible_points IS NULL
        AND correct_count IS NULL
        AND incorrect_count IS NULL
        AND unanswered_count IS NULL
        AND not_scored_count IS NULL
      )
    )
);

CREATE UNIQUE INDEX quest_attempts_one_started_per_student_quest_idx
  ON public.quest_attempts (student_id, quest_id)
  WHERE status = 'started';

CREATE INDEX quest_attempts_student_submitted_at_idx
  ON public.quest_attempts (student_id, submitted_at DESC)
  WHERE status = 'submitted';

CREATE INDEX quest_attempts_quest_id_idx
  ON public.quest_attempts (quest_id);

CREATE TABLE public.quest_attempt_answers (
  attempt_id uuid NOT NULL REFERENCES public.quest_attempts(id) ON DELETE CASCADE,
  source_task_id uuid NOT NULL,
  task_order integer NOT NULL,
  task_type text NOT NULL,
  task_snapshot jsonb NOT NULL,
  answer_snapshot jsonb NOT NULL,
  status text NOT NULL,
  earned_points bigint NOT NULL,
  possible_points bigint NOT NULL,
  PRIMARY KEY (attempt_id, source_task_id),
  CONSTRAINT quest_attempt_answers_task_order_key UNIQUE (attempt_id, task_order),
  CONSTRAINT quest_attempt_answers_task_order_check CHECK (task_order > 0),
  CONSTRAINT quest_attempt_answers_task_type_check
    CHECK (task_type IN ('text', 'single_choice', 'multiple_choice')),
  CONSTRAINT quest_attempt_answers_status_check
    CHECK (status IN ('correct', 'incorrect', 'unanswered', 'not_scored')),
  CONSTRAINT quest_attempt_answers_points_check
    CHECK (
      earned_points >= 0
      AND possible_points >= 0
      AND earned_points <= possible_points
    ),
  CONSTRAINT quest_attempt_answers_snapshot_check
    CHECK (
      pg_catalog.jsonb_typeof(task_snapshot) = 'object'
      AND pg_catalog.jsonb_typeof(answer_snapshot) = 'object'
      AND NOT (task_snapshot ? 'content')
      AND NOT (task_snapshot ? 'correctOptionId')
      AND NOT (task_snapshot ? 'correctOptionIds')
    )
);

ALTER TABLE public.quest_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY quest_attempts_select_own
  ON public.quest_attempts
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY quest_attempt_answers_select_own
  ON public.quest_attempt_answers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quest_attempts AS qa
      WHERE qa.id = quest_attempt_answers.attempt_id
        AND qa.student_id = auth.uid()
    )
  );

REVOKE ALL ON TABLE public.quest_attempts FROM PUBLIC;
REVOKE ALL ON TABLE public.quest_attempts FROM anon;
REVOKE ALL ON TABLE public.quest_attempts FROM authenticated;
GRANT SELECT ON TABLE public.quest_attempts TO authenticated;

REVOKE ALL ON TABLE public.quest_attempt_answers FROM PUBLIC;
REVOKE ALL ON TABLE public.quest_attempt_answers FROM anon;
REVOKE ALL ON TABLE public.quest_attempt_answers FROM authenticated;
GRANT SELECT ON TABLE public.quest_attempt_answers TO authenticated;

CREATE FUNCTION qwestum_private.current_actor_is_student()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = auth.uid()
        AND p.role = 'student'
    );
$$;

ALTER FUNCTION qwestum_private.current_actor_is_student() OWNER TO postgres;

REVOKE ALL ON FUNCTION qwestum_private.current_actor_is_student() FROM PUBLIC;
REVOKE ALL ON FUNCTION qwestum_private.current_actor_is_student() FROM anon;
REVOKE ALL ON FUNCTION qwestum_private.current_actor_is_student() FROM authenticated;
REVOKE ALL ON FUNCTION qwestum_private.current_actor_is_student() FROM service_role;

CREATE FUNCTION public.start_student_quest_attempt(
  p_quest_id uuid
)
RETURNS TABLE (
  attempt_id uuid,
  quest_id uuid,
  status text,
  started_at timestamptz
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_student_id uuid;
  v_attempt public.quest_attempts%ROWTYPE;
BEGIN
  v_student_id := auth.uid();

  IF v_student_id IS NULL
    OR p_quest_id IS NULL
    OR NOT qwestum_private.current_actor_is_student() THEN
    RETURN;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_student_id::text || ':' || p_quest_id::text, 0)
  );

  PERFORM 1
  FROM public.quests AS q
  WHERE q.id = p_quest_id
  FOR SHARE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF NOT qwestum_private.current_actor_is_student() THEN
    RETURN;
  END IF;

  SELECT qa.*
  INTO v_attempt
  FROM public.quest_attempts AS qa
  WHERE qa.student_id = v_student_id
    AND qa.quest_id = p_quest_id
    AND qa.status = 'started'
  FOR UPDATE;

  IF FOUND THEN
    RETURN QUERY
    SELECT v_attempt.id, v_attempt.quest_id, v_attempt.status, v_attempt.started_at;
    RETURN;
  END IF;

  PERFORM 1
  FROM public.quest_tasks AS qt
  WHERE qt.quest_id = p_quest_id
  ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC
  FOR SHARE;

  IF NOT public.is_public_runtime_eligible(p_quest_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.quest_attempts (student_id, quest_id, status)
  VALUES (v_student_id, p_quest_id, 'started')
  RETURNING * INTO v_attempt;

  RETURN QUERY
  SELECT v_attempt.id, v_attempt.quest_id, v_attempt.status, v_attempt.started_at;
END;
$$;

ALTER FUNCTION public.start_student_quest_attempt(uuid) OWNER TO postgres;

CREATE FUNCTION public.submit_student_quest_attempt(
  p_attempt_id uuid,
  p_answers jsonb
)
RETURNS TABLE (
  attempt_id uuid,
  earned_points bigint,
  possible_points bigint,
  correct_count integer,
  incorrect_count integer,
  unanswered_count integer,
  not_scored_count integer,
  task_results jsonb
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_student_id uuid;
  v_attempt public.quest_attempts%ROWTYPE;
  v_quest_id uuid;
  v_quest_title text;
  v_runtime_tasks jsonb;
  v_earned_points bigint;
  v_possible_points bigint;
  v_correct_count integer;
  v_incorrect_count integer;
  v_unanswered_count integer;
  v_not_scored_count integer;
  v_task_results jsonb;
  v_inserted_count integer;
BEGIN
  v_student_id := auth.uid();

  IF v_student_id IS NULL
    OR p_attempt_id IS NULL
    OR NOT qwestum_private.current_actor_is_student() THEN
    RETURN;
  END IF;

  -- This preliminary lookup only identifies the parent to lock. Revalidate the
  -- same owner and quest after the canonical quest -> attempt lock sequence.
  SELECT qa.quest_id
  INTO v_quest_id
  FROM public.quest_attempts AS qa
  WHERE qa.id = p_attempt_id
    AND qa.student_id = v_student_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM 1
  FROM public.quests AS q
  WHERE q.id = v_quest_id
  FOR SHARE;

  IF NOT FOUND OR NOT qwestum_private.current_actor_is_student() THEN
    RETURN;
  END IF;

  SELECT qa.*
  INTO v_attempt
  FROM public.quest_attempts AS qa
  WHERE qa.id = p_attempt_id
    AND qa.student_id = v_student_id
    AND qa.quest_id = v_quest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_attempt.status = 'submitted' THEN
    RETURN QUERY
    SELECT
      v_attempt.id,
      v_attempt.earned_points,
      v_attempt.possible_points,
      v_attempt.correct_count,
      v_attempt.incorrect_count,
      v_attempt.unanswered_count,
      v_attempt.not_scored_count,
      COALESCE(
        (
          SELECT pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
              'taskId', qaa.source_task_id::text,
              'status', qaa.status
            )
            ORDER BY qaa.task_order ASC
          )
          FROM public.quest_attempt_answers AS qaa
          WHERE qaa.attempt_id = v_attempt.id
        ),
        '[]'::jsonb
      );
    RETURN;
  END IF;

  IF v_attempt.status <> 'started' THEN
    RETURN;
  END IF;

  SELECT q.title
  INTO v_quest_title
  FROM public.quests AS q
  WHERE q.id = v_attempt.quest_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM 1
  FROM public.quest_tasks AS qt
  WHERE qt.quest_id = v_attempt.quest_id
  ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC
  FOR SHARE;

  IF NOT public.is_public_runtime_eligible(v_attempt.quest_id) THEN
    RETURN;
  END IF;

  SELECT
    score.earned_points,
    score.possible_points,
    score.correct_count,
    score.incorrect_count,
    score.unanswered_count,
    score.not_scored_count,
    score.task_results
  INTO
    v_earned_points,
    v_possible_points,
    v_correct_count,
    v_incorrect_count,
    v_unanswered_count,
    v_not_scored_count,
    v_task_results
  FROM public.score_public_runtime_quest(v_attempt.quest_id, p_answers) AS score;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT runtime_quest.title, runtime_quest.tasks
  INTO v_quest_title, v_runtime_tasks
  FROM public.get_public_runtime_quest(v_attempt.quest_id) AS runtime_quest;

  IF NOT FOUND OR pg_catalog.jsonb_typeof(v_runtime_tasks) <> 'array' THEN
    RETURN;
  END IF;

  UPDATE public.quest_attempts AS qa
  SET
    status = 'submitted',
    submitted_at = now(),
    quest_title_snapshot = v_quest_title,
    earned_points = v_earned_points,
    possible_points = v_possible_points,
    correct_count = v_correct_count,
    incorrect_count = v_incorrect_count,
    unanswered_count = v_unanswered_count,
    not_scored_count = v_not_scored_count
  WHERE qa.id = v_attempt.id;

  INSERT INTO public.quest_attempt_answers (
    attempt_id,
    source_task_id,
    task_order,
    task_type,
    task_snapshot,
    answer_snapshot,
    status,
    earned_points,
    possible_points
  )
  SELECT
    v_attempt.id,
    (runtime_task.value ->> 'id')::uuid,
    runtime_task.ordinality::integer,
    runtime_task.value ->> 'task_type',
    -- This is the already-sanitized public runtime task DTO. It can retain a
    -- canonical public image URL, but binary-object retention is deferred.
    runtime_task.value,
    CASE runtime_task.value ->> 'task_type'
      WHEN 'text' THEN '{}'::jsonb
      WHEN 'single_choice' THEN pg_catalog.jsonb_build_object(
        'selectedOptionId',
        COALESCE(answer.value -> 'selectedOptionId', 'null'::jsonb)
      )
      WHEN 'multiple_choice' THEN pg_catalog.jsonb_build_object(
        'selectedOptionIds',
        COALESCE(answer.value -> 'selectedOptionIds', '[]'::jsonb)
      )
    END,
    task_result.value ->> 'status',
    CASE
      WHEN task_result.value ->> 'status' = 'correct' THEN qt.points::bigint
      ELSE 0::bigint
    END,
    CASE
      WHEN runtime_task.value ->> 'task_type' IN ('single_choice', 'multiple_choice')
        THEN qt.points::bigint
      ELSE 0::bigint
    END
  FROM pg_catalog.jsonb_array_elements(v_runtime_tasks)
    WITH ORDINALITY AS runtime_task(value, ordinality)
  INNER JOIN public.quest_tasks AS qt
    ON qt.id::text = runtime_task.value ->> 'id'
    AND qt.quest_id = v_attempt.quest_id
  INNER JOIN LATERAL (
    SELECT entry.value
    FROM pg_catalog.jsonb_array_elements(
      CASE
        WHEN pg_catalog.jsonb_typeof(p_answers -> 'answers') = 'array'
          THEN p_answers -> 'answers'
        ELSE '[]'::jsonb
      END
    ) AS entry(value)
    WHERE entry.value ->> 'taskId' = runtime_task.value ->> 'id'
  ) AS answer ON TRUE
  INNER JOIN LATERAL (
    SELECT entry.value
    FROM pg_catalog.jsonb_array_elements(v_task_results) AS entry(value)
    WHERE entry.value ->> 'taskId' = runtime_task.value ->> 'id'
  ) AS task_result ON TRUE;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  IF v_inserted_count <> pg_catalog.jsonb_array_length(v_runtime_tasks) THEN
    RAISE EXCEPTION 'student attempt snapshot did not contain every scored task';
  END IF;

  RETURN QUERY
  SELECT
    v_attempt.id,
    v_earned_points,
    v_possible_points,
    v_correct_count,
    v_incorrect_count,
    v_unanswered_count,
    v_not_scored_count,
    v_task_results;
END;
$$;

ALTER FUNCTION public.submit_student_quest_attempt(uuid, jsonb) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.start_student_quest_attempt(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_student_quest_attempt(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.start_student_quest_attempt(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.start_student_quest_attempt(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.start_student_quest_attempt(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.submit_student_quest_attempt(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_student_quest_attempt(uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.submit_student_quest_attempt(uuid, jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.submit_student_quest_attempt(uuid, jsonb) FROM service_role;
GRANT EXECUTE ON FUNCTION public.submit_student_quest_attempt(uuid, jsonb) TO authenticated;

COMMIT;
