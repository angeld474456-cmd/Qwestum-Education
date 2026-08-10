-- Sprint 12.20.25: atomically append one task to an owned quest.
-- The parent lock matches Migration 020's parent-first ordering so task
-- creation and full-list reordering serialize for the same quest.

CREATE FUNCTION public.create_owned_quest_task(
  p_quest_id uuid,
  p_title text,
  p_description text,
  p_answer text,
  p_hint text,
  p_points integer,
  p_task_type text,
  p_content jsonb
)
RETURNS TABLE(
  outcome text,
  id uuid,
  quest_id uuid,
  title text,
  description text,
  answer text,
  hint text,
  image_url text,
  video_url text,
  audio_url text,
  content jsonb,
  points integer,
  task_type text,
  sort_order integer
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_task_count integer;
  v_max_sort_order integer;
  v_next_sort_order integer;
  v_has_null_sort_order boolean;
  v_normalized_count integer;
BEGIN
  IF auth.uid() IS NULL
    OR p_quest_id IS NULL
    OR p_title IS NULL
    OR pg_catalog.btrim(p_title) = ''
    OR p_points IS NULL
    OR p_points < 1
    OR p_task_type IS NULL
    OR p_task_type NOT IN ('text', 'single_choice', 'multiple_choice') THEN
    RETURN;
  END IF;

  -- Lock the owned parent first. A child insert's foreign-key check needs a
  -- conflicting key lock, so concurrent direct child inserts also serialize.
  PERFORM 1
  FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Lock the children in the same deterministic order used by every read.
  -- This protects a legacy NULL-position normalization before appending.
  WITH locked_tasks AS (
    SELECT qt.id, qt.sort_order
    FROM public.quest_tasks AS qt
    WHERE qt.quest_id = p_quest_id
    ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC
    FOR UPDATE
  )
  SELECT
    pg_catalog.count(*)::integer,
    COALESCE(pg_catalog.bool_or(locked.sort_order IS NULL), FALSE),
    pg_catalog.max(locked.sort_order)
  INTO v_task_count, v_has_null_sort_order, v_max_sort_order
  FROM locked_tasks AS locked;

  IF v_task_count >= 100 THEN
    RETURN QUERY
    SELECT
      'task_limit_reached'::text,
      NULL::uuid,
      NULL::uuid,
      NULL::text,
      NULL::text,
      NULL::text,
      NULL::text,
      NULL::text,
      NULL::text,
      NULL::text,
      NULL::jsonb,
      NULL::integer,
      NULL::text,
      NULL::integer;
    RETURN;
  END IF;

  IF v_has_null_sort_order OR v_max_sort_order = 2147483647 THEN
    -- Preserve the current visible order while moving legacy NULL positions
    -- or an INT_MAX position ahead of this append. No normalization occurs for
    -- ordinary numeric rows.
    WITH ordered_tasks AS (
      SELECT
        qt.id,
        pg_catalog.row_number() OVER (
          ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC
        )::integer AS normalized_sort_order
      FROM public.quest_tasks AS qt
      WHERE qt.quest_id = p_quest_id
    ),
    updated_tasks AS (
      UPDATE public.quest_tasks AS qt
      SET sort_order = ordered.normalized_sort_order
      FROM ordered_tasks AS ordered
      WHERE qt.id = ordered.id
      RETURNING qt.id
    )
    SELECT pg_catalog.count(*)::integer
    INTO v_normalized_count
    FROM updated_tasks;

    IF v_normalized_count <> v_task_count THEN
      RAISE EXCEPTION 'Owned task order normalization failed';
    END IF;

    v_next_sort_order := v_task_count + 1;
  ELSE
    v_next_sort_order := COALESCE(v_max_sort_order, 0) + 1;
  END IF;

  RETURN QUERY
  INSERT INTO public.quest_tasks AS qt (
    quest_id,
    title,
    description,
    answer,
    hint,
    image_url,
    video_url,
    audio_url,
    points,
    task_type,
    content,
    sort_order
  )
  VALUES (
    p_quest_id,
    p_title,
    p_description,
    p_answer,
    p_hint,
    '',
    '',
    '',
    p_points,
    p_task_type,
    p_content,
    v_next_sort_order
  )
  RETURNING
    'created'::text,
    qt.id,
    qt.quest_id,
    qt.title,
    qt.description,
    qt.answer,
    qt.hint,
    qt.image_url,
    qt.video_url,
    qt.audio_url,
    qt.content,
    qt.points,
    qt.task_type,
    qt.sort_order;
END;
$$;

ALTER FUNCTION public.create_owned_quest_task(uuid, text, text, text, text, integer, text, jsonb) OWNER TO postgres;

COMMENT ON FUNCTION public.create_owned_quest_task(uuid, text, text, text, text, integer, text, jsonb) IS
  'Authenticated owner-only atomic task append. Returns zero rows for absent, foreign, or invalid input and task_limit_reached for an owned quest at the 100-task limit.';

REVOKE ALL ON FUNCTION public.create_owned_quest_task(uuid, text, text, text, text, integer, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_owned_quest_task(uuid, text, text, text, text, integer, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.create_owned_quest_task(uuid, text, text, text, text, integer, text, jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.create_owned_quest_task(uuid, text, text, text, text, integer, text, jsonb) FROM service_role;
GRANT EXECUTE ON FUNCTION public.create_owned_quest_task(uuid, text, text, text, text, integer, text, jsonb) TO authenticated;
