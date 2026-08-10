-- Sprint 12.20.27: atomically delete one task from an owned quest.
-- The parent-first lock matches Migrations 020 and 021 so deletion serializes
-- with task creation and full-list ordering for the same quest.

CREATE FUNCTION public.delete_owned_quest_task(
  p_quest_id uuid,
  p_task_id uuid
)
RETURNS TABLE(
  outcome text,
  id uuid,
  image_url text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_is_public boolean;
  v_task_id uuid;
  v_task_count bigint;
BEGIN
  IF auth.uid() IS NULL
    OR p_quest_id IS NULL
    OR p_task_id IS NULL THEN
    RETURN;
  END IF;

  -- Lock the owned parent first so supported create, reorder, and delete
  -- operations serialize before checking the Public final-task invariant.
  SELECT q.is_public
  INTO v_is_public
  FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT qt.id
  INTO v_task_id
  FROM public.quest_tasks AS qt
  WHERE qt.id = p_task_id
    AND qt.quest_id = p_quest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF COALESCE(v_is_public, FALSE) THEN
    SELECT pg_catalog.count(*)
    INTO v_task_count
    FROM public.quest_tasks AS qt
    WHERE qt.quest_id = p_quest_id;

    IF v_task_count <= 1 THEN
      RETURN QUERY
      SELECT
        'last_public_task'::text,
        NULL::uuid,
        NULL::text;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
  DELETE FROM public.quest_tasks AS qt
  WHERE qt.id = v_task_id
    AND qt.quest_id = p_quest_id
  RETURNING
    'deleted'::text,
    qt.id,
    qt.image_url;
END;
$$;

ALTER FUNCTION public.delete_owned_quest_task(uuid, uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.delete_owned_quest_task(uuid, uuid) IS
  'Authenticated owner-only atomic task delete. Returns zero rows for absent, foreign, or stale membership and last_public_task without deleting the final task of a Public quest.';

REVOKE ALL ON FUNCTION public.delete_owned_quest_task(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_owned_quest_task(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.delete_owned_quest_task(uuid, uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.delete_owned_quest_task(uuid, uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.delete_owned_quest_task(uuid, uuid) TO authenticated;
