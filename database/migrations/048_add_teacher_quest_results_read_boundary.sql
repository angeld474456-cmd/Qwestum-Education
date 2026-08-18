-- P1-TR1: narrow teacher-owned historical attempt reads. Student self-history
-- RLS remains unchanged; teachers receive data only through these RPCs.

BEGIN;

DO $$
BEGIN
  IF pg_catalog.to_regclass('public.quest_attempts') IS NULL
    OR pg_catalog.to_regclass('public.quest_attempt_answers') IS NULL
    OR pg_catalog.to_regclass('public.quests') IS NULL
    OR pg_catalog.to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'M043/M044 profile, quest, and student attempt tables are required before applying M048';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('public.quest_attempts'::pg_catalog.regclass, 'id'),
        ('public.quest_attempts'::pg_catalog.regclass, 'student_id'),
        ('public.quest_attempts'::pg_catalog.regclass, 'quest_id'),
        ('public.quest_attempts'::pg_catalog.regclass, 'status'),
        ('public.quest_attempts'::pg_catalog.regclass, 'submitted_at'),
        ('public.quest_attempts'::pg_catalog.regclass, 'quest_title_snapshot'),
        ('public.quest_attempts'::pg_catalog.regclass, 'earned_points'),
        ('public.quest_attempts'::pg_catalog.regclass, 'possible_points'),
        ('public.quest_attempt_answers'::pg_catalog.regclass, 'attempt_id'),
        ('public.quest_attempt_answers'::pg_catalog.regclass, 'task_order'),
        ('public.quest_attempt_answers'::pg_catalog.regclass, 'task_type'),
        ('public.quest_attempt_answers'::pg_catalog.regclass, 'task_snapshot'),
        ('public.quest_attempt_answers'::pg_catalog.regclass, 'answer_snapshot'),
        ('public.quest_attempt_answers'::pg_catalog.regclass, 'status'),
        ('public.quest_attempt_answers'::pg_catalog.regclass, 'earned_points'),
        ('public.quest_attempt_answers'::pg_catalog.regclass, 'possible_points'),
        ('public.quests'::pg_catalog.regclass, 'id'),
        ('public.quests'::pg_catalog.regclass, 'author_id'),
        ('public.profiles'::pg_catalog.regclass, 'id'),
        ('public.profiles'::pg_catalog.regclass, 'full_name'),
        ('public.profiles'::pg_catalog.regclass, 'role')
    ) AS required_columns(table_oid, column_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_attribute AS a
      WHERE a.attrelid = required_columns.table_oid
        AND a.attname = required_columns.column_name
        AND a.attnum > 0
        AND NOT a.attisdropped
    )
  ) THEN
    RAISE EXCEPTION 'M048 predecessor tables are missing an expected column; inspect before applying';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS c
    WHERE c.conrelid = 'public.quest_attempts'::pg_catalog.regclass
      AND c.contype = 'c'
      AND pg_catalog.pg_get_constraintdef(c.oid) LIKE '%status%submitted%'
  ) THEN
    RAISE EXCEPTION 'quest_attempts must retain submitted status semantics before applying M048';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'quest_attempts'
      AND c.relrowsecurity
  ) OR NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'quest_attempt_answers'
      AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'student attempt tables must retain RLS before applying M048';
  END IF;

  IF pg_catalog.to_regprocedure('public.list_teacher_quest_attempts(uuid,integer,integer)') IS NOT NULL
    OR pg_catalog.to_regprocedure('public.get_teacher_quest_attempt_detail(uuid,uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'teacher quest result RPCs already exist; inspect before applying M048';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS index_class
    JOIN pg_catalog.pg_namespace AS index_namespace
      ON index_namespace.oid = index_class.relnamespace
    WHERE index_namespace.nspname = 'public'
      AND index_class.relname = 'quest_attempts_quest_submitted_at_id_idx'
  ) OR EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index AS i
    WHERE i.indrelid = 'public.quest_attempts'::pg_catalog.regclass
      AND pg_catalog.pg_get_indexdef(i.indexrelid) LIKE '%(quest_id, submitted_at DESC, id DESC)%'
  ) THEN
    RAISE EXCEPTION 'teacher result listing index already or unexpectedly exists; inspect before applying M048';
  END IF;
END;
$$;

CREATE INDEX quest_attempts_quest_submitted_at_id_idx
  ON public.quest_attempts (quest_id, submitted_at DESC, id DESC)
  WHERE status = 'submitted';

CREATE FUNCTION public.list_teacher_quest_attempts(
  p_quest_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  attempt_id uuid,
  student_display_name text,
  submitted_at timestamptz,
  earned_points bigint,
  possible_points bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor_id uuid;
  v_limit integer;
BEGIN
  v_actor_id := auth.uid();
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);

  -- Invalid, missing, foreign, and unauthorized requests all return no rows.
  IF v_actor_id IS NULL
    OR p_quest_id IS NULL
    OR p_offset IS NULL
    OR p_offset < 0
    OR p_offset > 10000
    OR NOT EXISTS (
      SELECT 1
      FROM public.quests AS q
      INNER JOIN public.profiles AS actor ON actor.id = v_actor_id
      WHERE q.id = p_quest_id
        AND q.author_id = v_actor_id
        AND actor.role = 'teacher'
    ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    qa.id,
    COALESCE(NULLIF(pg_catalog.btrim(student.full_name), ''), 'Ученик'),
    qa.submitted_at,
    qa.earned_points,
    qa.possible_points
  FROM public.quest_attempts AS qa
  LEFT JOIN public.profiles AS student ON student.id = qa.student_id
  WHERE qa.quest_id = p_quest_id
    AND qa.status = 'submitted'
  ORDER BY qa.submitted_at DESC, qa.id DESC
  LIMIT v_limit
  OFFSET p_offset;
END;
$$;

ALTER FUNCTION public.list_teacher_quest_attempts(uuid, integer, integer) OWNER TO postgres;

CREATE FUNCTION public.get_teacher_quest_attempt_detail(
  p_quest_id uuid,
  p_attempt_id uuid
)
RETURNS TABLE (
  attempt_id uuid,
  student_display_name text,
  quest_title_snapshot text,
  submitted_at timestamptz,
  earned_points bigint,
  possible_points bigint,
  task_order integer,
  task_type text,
  task_snapshot jsonb,
  answer_snapshot jsonb,
  result_status text,
  task_earned_points bigint,
  task_possible_points bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor_id uuid;
BEGIN
  v_actor_id := auth.uid();

  -- Missing, foreign, and unauthorized attempts are intentionally
  -- indistinguishable from a caller that lacks access.
  IF v_actor_id IS NULL
    OR p_quest_id IS NULL
    OR p_attempt_id IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM public.quests AS q
      INNER JOIN public.profiles AS actor ON actor.id = v_actor_id
      WHERE q.id = p_quest_id
        AND q.author_id = v_actor_id
        AND actor.role = 'teacher'
    ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    qa.id,
    COALESCE(NULLIF(pg_catalog.btrim(student.full_name), ''), 'Ученик'),
    qa.quest_title_snapshot,
    qa.submitted_at,
    qa.earned_points,
    qa.possible_points,
    qaa.task_order,
    qaa.task_type,
    qaa.task_snapshot,
    qaa.answer_snapshot,
    qaa.status,
    qaa.earned_points,
    qaa.possible_points
  FROM public.quest_attempts AS qa
  INNER JOIN public.quest_attempt_answers AS qaa ON qaa.attempt_id = qa.id
  LEFT JOIN public.profiles AS student ON student.id = qa.student_id
  WHERE qa.id = p_attempt_id
    AND qa.quest_id = p_quest_id
    AND qa.status = 'submitted'
  ORDER BY qaa.task_order ASC;
END;
$$;

ALTER FUNCTION public.get_teacher_quest_attempt_detail(uuid, uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.list_teacher_quest_attempts(uuid, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_teacher_quest_attempts(uuid, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.list_teacher_quest_attempts(uuid, integer, integer) FROM authenticated;
REVOKE ALL ON FUNCTION public.list_teacher_quest_attempts(uuid, integer, integer) FROM service_role;
GRANT EXECUTE ON FUNCTION public.list_teacher_quest_attempts(uuid, integer, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.get_teacher_quest_attempt_detail(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_teacher_quest_attempt_detail(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_teacher_quest_attempt_detail(uuid, uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_teacher_quest_attempt_detail(uuid, uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.get_teacher_quest_attempt_detail(uuid, uuid) TO authenticated;

COMMIT;
