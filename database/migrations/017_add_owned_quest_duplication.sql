-- Sprint 12.20.21: atomically duplicate an owned quest into a new Draft.
-- Instructional fields are allowlisted explicitly. Media paths and public state
-- are intentionally omitted so the duplicate has no cross-quest Storage references.

CREATE FUNCTION public.duplicate_owned_quest(
  source_quest_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_title public.quests.title%TYPE;
  v_description public.quests.description%TYPE;
  v_difficulty public.quests.difficulty%TYPE;
  v_subject_id public.quests.subject_id%TYPE;
  v_grade_min public.quests.grade_min%TYPE;
  v_grade_max public.quests.grade_max%TYPE;
  v_estimated_duration_minutes public.quests.estimated_duration_minutes%TYPE;
  v_language_code public.quests.language_code%TYPE;
  v_category public.quests.category%TYPE;
  v_tags public.quests.tags%TYPE;
  v_new_quest_id uuid;
BEGIN
  -- An absent session, missing quest, and foreign-owned quest are indistinguishable.
  IF source_quest_id IS NULL OR auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Lock the owned source metadata so settings cannot change during the copy.
  SELECT
    q.title,
    q.description,
    q.difficulty,
    q.subject_id,
    q.grade_min,
    q.grade_max,
    q.estimated_duration_minutes,
    q.language_code,
    q.category,
    q.tags
  INTO
    v_title,
    v_description,
    v_difficulty,
    v_subject_id,
    v_grade_min,
    v_grade_max,
    v_estimated_duration_minutes,
    v_language_code,
    v_category,
    v_tags
  FROM public.quests AS q
  WHERE q.id = source_quest_id
    AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- New identifiers and timestamps use table defaults. Every duplicate is Draft
  -- and has no cover path, regardless of the source quest's public or media state.
  INSERT INTO public.quests (
    title,
    description,
    difficulty,
    subject_id,
    grade_min,
    grade_max,
    estimated_duration_minutes,
    language_code,
    category,
    tags,
    author_id,
    is_public,
    cover_image_path
  )
  VALUES (
    v_title,
    v_description,
    v_difficulty,
    v_subject_id,
    v_grade_min,
    v_grade_max,
    v_estimated_duration_minutes,
    v_language_code,
    v_category,
    v_tags,
    auth.uid(),
    FALSE,
    NULL
  )
  RETURNING id INTO v_new_quest_id;

  -- Existing source tasks are locked while their explicit instructional fields
  -- are copied. New task identifiers/timestamps use defaults; every media field
  -- is deliberately NULL to avoid copying Storage references or objects.
  WITH source_tasks AS (
    SELECT
      qt.sort_order,
      qt.title,
      qt.description,
      qt.answer,
      qt.hint,
      qt.content,
      qt.points,
      qt.task_type
    FROM public.quest_tasks AS qt
    WHERE qt.quest_id = source_quest_id
    ORDER BY qt.sort_order
    FOR SHARE
  )
  INSERT INTO public.quest_tasks (
    quest_id,
    sort_order,
    title,
    description,
    answer,
    hint,
    content,
    points,
    task_type,
    image_url,
    video_url,
    audio_url
  )
  SELECT
    v_new_quest_id,
    st.sort_order,
    st.title,
    st.description,
    st.answer,
    st.hint,
    st.content,
    st.points,
    st.task_type,
    NULL,
    NULL,
    NULL
  FROM source_tasks AS st;

  RETURN v_new_quest_id;
END;
$$;

ALTER FUNCTION public.duplicate_owned_quest(uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.duplicate_owned_quest(uuid) IS
  'Authenticated owner-only atomic quest duplicate. Copies allowlisted instructional fields into a new Draft and omits all media paths.';

REVOKE ALL ON FUNCTION public.duplicate_owned_quest(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.duplicate_owned_quest(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.duplicate_owned_quest(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.duplicate_owned_quest(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.duplicate_owned_quest(uuid) TO authenticated;
