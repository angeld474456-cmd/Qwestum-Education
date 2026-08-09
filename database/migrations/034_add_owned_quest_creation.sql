-- Sprint 12.20.31: owner-safe teacher quest creation boundary.

CREATE FUNCTION public.create_owned_quest(
  p_title text,
  p_description text,
  p_difficulty integer
)
RETURNS TABLE (
  outcome text,
  id uuid
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id uuid;
  v_title text;
  v_description text;
  v_quest_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  v_title := pg_catalog.btrim(p_title);
  v_description := COALESCE(pg_catalog.btrim(p_description), '');

  IF v_title IS NULL
    OR v_title = ''
    OR p_difficulty IS NULL
    OR p_difficulty NOT IN (1, 2, 3) THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid;
    RETURN;
  END IF;

  INSERT INTO public.quests AS q (
    title,
    description,
    difficulty,
    author_id,
    is_public
  )
  VALUES (
    v_title,
    v_description,
    p_difficulty,
    v_user_id,
    false
  )
  RETURNING q.id INTO v_quest_id;

  RETURN QUERY SELECT 'created'::text, v_quest_id;
END;
$$;

ALTER FUNCTION public.create_owned_quest(text, text, integer) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.create_owned_quest(text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_owned_quest(text, text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.create_owned_quest(text, text, integer) FROM authenticated;
REVOKE ALL ON FUNCTION public.create_owned_quest(text, text, integer) FROM service_role;
GRANT EXECUTE ON FUNCTION public.create_owned_quest(text, text, integer) TO authenticated;
