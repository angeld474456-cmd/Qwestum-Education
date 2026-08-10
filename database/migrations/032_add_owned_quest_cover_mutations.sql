-- Sprint 12.20.30: owner-safe quest cover image mutation boundary.

CREATE FUNCTION public.set_owned_quest_cover_image(
  p_quest_id uuid,
  p_expected_cover_image_path text,
  p_new_object_path text
)
RETURNS TABLE (
  outcome text,
  id uuid,
  previous_cover_image_path text,
  cover_image_path text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_cover_image_path text;
BEGIN
  IF auth.uid() IS NULL
    OR p_quest_id IS NULL
    OR p_new_object_path IS NULL
    OR p_new_object_path = ''
    OR p_new_object_path <> pg_catalog.btrim(p_new_object_path)
    OR p_new_object_path !~ (
      '^teachers/'
      || auth.uid()::text
      || '/quests/'
      || p_quest_id::text
      || '/cover/'
      || '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
    ) THEN
    RETURN;
  END IF;

  PERFORM 1
  FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT q.cover_image_path
  INTO v_current_cover_image_path
  FROM public.quests AS q
  WHERE q.id = p_quest_id;

  PERFORM 1
  FROM storage.objects AS so
  WHERE so.bucket_id = 'quest-images'
    AND so.name = p_new_object_path;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_current_cover_image_path IS DISTINCT FROM p_expected_cover_image_path THEN
    RETURN QUERY
    SELECT
      'stale_cover'::text,
      p_quest_id,
      v_current_cover_image_path,
      v_current_cover_image_path;
    RETURN;
  END IF;

  IF p_new_object_path IS NOT DISTINCT FROM v_current_cover_image_path THEN
    RETURN QUERY
    SELECT
      'already_current'::text,
      p_quest_id,
      v_current_cover_image_path,
      v_current_cover_image_path;
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.quests AS q
  SET cover_image_path = p_new_object_path
  WHERE q.id = p_quest_id
  RETURNING
    'updated'::text,
    q.id,
    v_current_cover_image_path,
    q.cover_image_path;
END;
$$;

ALTER FUNCTION public.set_owned_quest_cover_image(uuid, text, text)
  OWNER TO postgres;

REVOKE ALL ON FUNCTION public.set_owned_quest_cover_image(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_owned_quest_cover_image(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.set_owned_quest_cover_image(uuid, text, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.set_owned_quest_cover_image(uuid, text, text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.set_owned_quest_cover_image(uuid, text, text) TO authenticated;

CREATE FUNCTION public.clear_owned_quest_cover_image_if_matches(
  p_quest_id uuid,
  p_expected_cover_image_path text
)
RETURNS TABLE (
  outcome text,
  id uuid,
  previous_cover_image_path text,
  cover_image_path text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_cover_image_path text;
BEGIN
  IF auth.uid() IS NULL OR p_quest_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM 1
  FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT q.cover_image_path
  INTO v_current_cover_image_path
  FROM public.quests AS q
  WHERE q.id = p_quest_id;

  IF v_current_cover_image_path IS DISTINCT FROM p_expected_cover_image_path THEN
    RETURN QUERY
    SELECT
      'stale_cover'::text,
      p_quest_id,
      v_current_cover_image_path,
      v_current_cover_image_path;
    RETURN;
  END IF;

  IF v_current_cover_image_path IS NULL THEN
    RETURN QUERY
    SELECT
      'already_clear'::text,
      p_quest_id,
      NULL::text,
      NULL::text;
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.quests AS q
  SET cover_image_path = NULL
  WHERE q.id = p_quest_id
  RETURNING
    'cleared'::text,
    q.id,
    v_current_cover_image_path,
    q.cover_image_path;
END;
$$;

ALTER FUNCTION public.clear_owned_quest_cover_image_if_matches(uuid, text)
  OWNER TO postgres;

REVOKE ALL ON FUNCTION public.clear_owned_quest_cover_image_if_matches(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clear_owned_quest_cover_image_if_matches(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.clear_owned_quest_cover_image_if_matches(uuid, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.clear_owned_quest_cover_image_if_matches(uuid, text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.clear_owned_quest_cover_image_if_matches(uuid, text) TO authenticated;
