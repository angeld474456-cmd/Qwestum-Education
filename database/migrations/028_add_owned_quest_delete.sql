-- Sprint 12.20.29: atomically delete one owned quest and return only the
-- server-held cleanup references needed after the transaction commits.

CREATE FUNCTION public.delete_owned_quest(
  p_quest_id uuid
)
RETURNS TABLE(
  outcome text,
  id uuid,
  cover_image_path text,
  task_image_urls text[]
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id uuid;
  v_cover_image_path text;
  v_task_image_urls text[];
  v_deleted_quest_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL OR p_quest_id IS NULL THEN
    RETURN;
  END IF;

  -- Lock the owned parent first so task mutation RPCs serialize before the
  -- cleanup snapshot and parent deletion.
  SELECT q.cover_image_path
  INTO v_cover_image_path
  FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Lock existing children after the parent and snapshot only non-null image
  -- references in deterministic task-ID order for server-side cleanup.
  PERFORM 1
  FROM public.quest_tasks AS qt
  WHERE qt.quest_id = p_quest_id
  FOR UPDATE;

  SELECT COALESCE(
    pg_catalog.array_agg(qt.image_url ORDER BY qt.id)
      FILTER (WHERE qt.image_url IS NOT NULL),
    ARRAY[]::text[]
  )
  INTO v_task_image_urls
  FROM public.quest_tasks AS qt
  WHERE qt.quest_id = p_quest_id;

  DELETE FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = v_user_id
  RETURNING q.id
  INTO v_deleted_quest_id;

  IF NOT FOUND OR v_deleted_quest_id IS DISTINCT FROM p_quest_id THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    'deleted'::text,
    v_deleted_quest_id,
    v_cover_image_path,
    v_task_image_urls;
END;
$$;

ALTER FUNCTION public.delete_owned_quest(uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.delete_owned_quest(uuid) IS
  'Authenticated owner-only quest delete with a parent-first cleanup snapshot. Child tasks are removed by the existing ON DELETE CASCADE foreign key.';

REVOKE ALL ON FUNCTION public.delete_owned_quest(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_owned_quest(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.delete_owned_quest(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.delete_owned_quest(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.delete_owned_quest(uuid) TO authenticated;
