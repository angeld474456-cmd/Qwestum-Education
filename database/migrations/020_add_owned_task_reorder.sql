-- Sprint 12.20.24: atomically reorder every task in an owned quest.
-- A complete ordered ID list prevents stale or partial client state from
-- changing task order. Owner and membership mismatches return zero rows.

CREATE FUNCTION public.reorder_owned_quest_tasks(
  p_quest_id uuid,
  p_task_ids uuid[]
)
RETURNS TABLE(
  task_id uuid,
  sort_order integer
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_requested_count integer;
  v_current_task_ids uuid[];
  v_updated_count integer;
BEGIN
  IF auth.uid() IS NULL
    OR p_quest_id IS NULL
    OR p_task_ids IS NULL THEN
    RETURN;
  END IF;

  v_requested_count := pg_catalog.cardinality(p_task_ids);

  IF v_requested_count < 1
    OR v_requested_count > 100
    OR pg_catalog.array_position(p_task_ids, NULL) IS NOT NULL
    OR (
      SELECT pg_catalog.count(DISTINCT requested.task_id)
      FROM pg_catalog.unnest(p_task_ids) AS requested(task_id)
    ) <> v_requested_count THEN
    RETURN;
  END IF;

  -- Lock the owned parent first. The FK check for an insert into quest_tasks
  -- requires a conflicting key lock on this row, serializing child creation.
  PERFORM 1
  FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Lock the current children before comparing the complete membership set.
  SELECT pg_catalog.array_agg(locked.task_id ORDER BY locked.sort_order ASC NULLS LAST, locked.task_id ASC)
  INTO v_current_task_ids
  FROM (
    SELECT qt.id AS task_id, qt.sort_order
    FROM public.quest_tasks AS qt
    WHERE qt.quest_id = p_quest_id
    ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC
    FOR UPDATE
  ) AS locked;

  IF COALESCE(pg_catalog.cardinality(v_current_task_ids), 0) <> v_requested_count
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.unnest(p_task_ids) AS requested(task_id)
      WHERE NOT (requested.task_id = ANY(v_current_task_ids))
    ) THEN
    RETURN;
  END IF;

  WITH requested AS (
    SELECT request.task_id, request.ordinality::integer AS next_sort_order
    FROM pg_catalog.unnest(p_task_ids) WITH ORDINALITY AS request(task_id, ordinality)
  )
  UPDATE public.quest_tasks AS qt
  SET sort_order = requested.next_sort_order
  FROM requested
  WHERE qt.quest_id = p_quest_id
    AND qt.id = requested.task_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count <> v_requested_count THEN
    RAISE EXCEPTION 'Owned task reorder persistence failed';
  END IF;

  RETURN QUERY
  SELECT request.task_id, request.ordinality::integer
  FROM pg_catalog.unnest(p_task_ids) WITH ORDINALITY AS request(task_id, ordinality)
  ORDER BY request.ordinality;
END;
$$;

ALTER FUNCTION public.reorder_owned_quest_tasks(uuid, uuid[]) OWNER TO postgres;

COMMENT ON FUNCTION public.reorder_owned_quest_tasks(uuid, uuid[]) IS
  'Authenticated owner-only atomic full-list task reorder. Returns zero rows for absent, foreign, stale, or malformed membership.';

REVOKE ALL ON FUNCTION public.reorder_owned_quest_tasks(uuid, uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reorder_owned_quest_tasks(uuid, uuid[]) FROM anon;
REVOKE ALL ON FUNCTION public.reorder_owned_quest_tasks(uuid, uuid[]) FROM authenticated;
REVOKE ALL ON FUNCTION public.reorder_owned_quest_tasks(uuid, uuid[]) FROM service_role;
GRANT EXECUTE ON FUNCTION public.reorder_owned_quest_tasks(uuid, uuid[]) TO authenticated;
