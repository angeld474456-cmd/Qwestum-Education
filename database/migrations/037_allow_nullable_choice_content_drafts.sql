-- Sprint P1: allow incomplete null-content choice drafts through the existing
-- owner-safe metadata/content update boundary. Public eligibility remains
-- authoritative and fail-closed in Migration 036.

CREATE OR REPLACE FUNCTION public.update_owned_quest_task_content(
  p_quest_id uuid,
  p_task_id uuid,
  p_title text,
  p_description text,
  p_points integer,
  p_content jsonb
)
RETURNS TABLE(
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
  v_task_type text;
BEGIN
  IF auth.uid() IS NULL
    OR p_quest_id IS NULL
    OR p_task_id IS NULL
    OR p_title IS NULL
    OR p_title !~ '[^[:space:]]'
    OR pg_catalog.char_length(p_title) > 500
    OR p_description IS NULL
    OR pg_catalog.char_length(p_description) > 10000
    OR p_points IS NULL
    OR p_points < 1
    OR (p_content IS NOT NULL AND pg_catalog.jsonb_typeof(p_content) <> 'object') THEN
    RETURN;
  END IF;

  -- Match the parent-first order used by task create, reorder, and delete.
  PERFORM 1
  FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT qt.task_type
  INTO v_task_type
  FROM public.quest_tasks AS qt
  WHERE qt.id = p_task_id
    AND qt.quest_id = p_quest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_task_type IS NULL
    OR v_task_type NOT IN ('text', 'single_choice', 'multiple_choice') THEN
    RETURN;
  END IF;

  IF v_task_type = 'single_choice' AND p_content IS NOT NULL THEN
    IF pg_catalog.jsonb_typeof(p_content -> 'options') IS DISTINCT FROM 'array'
      OR pg_catalog.jsonb_typeof(p_content -> 'correctOptionId') IS DISTINCT FROM 'string'
      OR COALESCE((p_content ->> 'correctOptionId') !~ '[^[:space:]]', TRUE) THEN
      RETURN;
    END IF;

    IF pg_catalog.jsonb_array_length(p_content -> 'options') < 2 THEN
      RETURN;
    END IF;
  END IF;

  IF v_task_type = 'multiple_choice' AND p_content IS NOT NULL THEN
    IF pg_catalog.jsonb_typeof(p_content -> 'options') IS DISTINCT FROM 'array'
      OR pg_catalog.jsonb_typeof(p_content -> 'correctOptionIds') IS DISTINCT FROM 'array' THEN
      RETURN;
    END IF;

    IF pg_catalog.jsonb_array_length(p_content -> 'options') < 2
      OR pg_catalog.jsonb_array_length(p_content -> 'correctOptionIds') < 2 THEN
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
  UPDATE public.quest_tasks AS qt
  SET
    title = pg_catalog.btrim(p_title),
    description = pg_catalog.btrim(p_description),
    points = p_points,
    content = p_content
  WHERE qt.id = p_task_id
    AND qt.quest_id = p_quest_id
  RETURNING
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

ALTER FUNCTION public.update_owned_quest_task_content(
  uuid,
  uuid,
  text,
  text,
  integer,
  jsonb
) OWNER TO postgres;

COMMENT ON FUNCTION public.update_owned_quest_task_content(
  uuid,
  uuid,
  text,
  text,
  integer,
  jsonb
) IS
  'Authenticated owner-only metadata/content task update. Returns zero rows for invalid input, absent, foreign, stale, or unsupported task state.';

REVOKE ALL ON FUNCTION public.update_owned_quest_task_content(uuid, uuid, text, text, integer, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_owned_quest_task_content(uuid, uuid, text, text, integer, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.update_owned_quest_task_content(uuid, uuid, text, text, integer, jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.update_owned_quest_task_content(uuid, uuid, text, text, integer, jsonb) FROM service_role;
GRANT EXECUTE ON FUNCTION public.update_owned_quest_task_content(uuid, uuid, text, text, integer, jsonb) TO authenticated;
