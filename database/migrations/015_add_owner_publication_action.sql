-- Sprint 12.20.3C1: owner-safe atomic publication-state action.
-- The function returns only a fixed action outcome and never exposes quest or task data.

CREATE FUNCTION public.set_owned_quest_publication_state(
  p_quest_id uuid,
  p_publish boolean
)
RETURNS TABLE (
  is_public boolean,
  outcome text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_is_public boolean;
BEGIN
  -- An absent session or quest is deliberately indistinguishable from a non-owned quest.
  IF auth.uid() IS NULL OR p_quest_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'not_found'::text;
    RETURN;
  END IF;

  -- Lock the owned parent row before reading or changing publication state.
  SELECT q.is_public
  INTO v_is_public
  FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'not_found'::text;
    RETURN;
  END IF;

  -- A null action is deterministic and never changes publication state.
  IF p_publish IS NULL THEN
    RETURN QUERY SELECT v_is_public, 'blocked'::text;
    RETURN;
  END IF;

  IF NOT p_publish THEN
    -- Unpublishing is intentionally allowed without an eligibility check.
    IF NOT v_is_public THEN
      RETURN QUERY SELECT FALSE, 'already_draft'::text;
      RETURN;
    END IF;

    UPDATE public.quests AS q
    SET is_public = FALSE
    WHERE q.id = p_quest_id
      AND q.author_id = auth.uid();

    RETURN QUERY SELECT FALSE, 'unpublished'::text;
    RETURN;
  END IF;

  -- Serialize every task write while checking the canonical publish-time snapshot.
  -- This protects only this action; later task or settings edits can still make a
  -- public quest ineligible, and Migration 014 continues to hide it from public reads.
  LOCK TABLE public.quest_tasks IN SHARE ROW EXCLUSIVE MODE;

  -- Migration 014's canonical predicate requires is_public = TRUE. For a Draft,
  -- use a nested subtransaction: a blocked sentinel rolls back the temporary state,
  -- trigger effects, and every write in this block before returning blocked.
  IF v_is_public THEN
    IF public.is_public_runtime_eligible(p_quest_id) THEN
      RETURN QUERY SELECT TRUE, 'already_published'::text;
    END IF;

    RETURN QUERY SELECT TRUE, 'blocked'::text;
    RETURN;
  END IF;

  BEGIN
    UPDATE public.quests AS q
    SET is_public = TRUE
    WHERE q.id = p_quest_id
      AND q.author_id = auth.uid();

    IF NOT public.is_public_runtime_eligible(p_quest_id) THEN
      RAISE SQLSTATE 'P7501';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'P7501' THEN
      RETURN QUERY SELECT FALSE, 'blocked'::text;
      RETURN;
  END;

  RETURN QUERY SELECT TRUE, 'published'::text;
END;
$$;

-- SECURITY DEFINER is required because the canonical eligibility helper is not callable
-- by authenticated users directly. Ownership remains enforced with auth.uid() above.
REVOKE ALL ON FUNCTION public.set_owned_quest_publication_state(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_owned_quest_publication_state(uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.set_owned_quest_publication_state(uuid, boolean) FROM authenticated;
REVOKE ALL ON FUNCTION public.set_owned_quest_publication_state(uuid, boolean) FROM service_role;
GRANT EXECUTE ON FUNCTION public.set_owned_quest_publication_state(uuid, boolean) TO authenticated;
