-- Sprint 12.20.28B: establish the trusted origin and owner-safe task-image
-- mutation RPCs. No environment-specific origin is inserted by this migration.
-- Direct task UPDATE remains until Migration 027 after route migration verification.

CREATE SCHEMA qwestum_private AUTHORIZATION postgres;

ALTER SCHEMA qwestum_private OWNER TO postgres;

REVOKE ALL ON SCHEMA qwestum_private FROM PUBLIC;
REVOKE ALL ON SCHEMA qwestum_private FROM anon;
REVOKE ALL ON SCHEMA qwestum_private FROM authenticated;
REVOKE ALL ON SCHEMA qwestum_private FROM service_role;

CREATE TABLE qwestum_private.task_image_runtime_config (
  singleton boolean PRIMARY KEY CHECK (singleton = TRUE),
  supabase_public_origin text NOT NULL CHECK (
    supabase_public_origin = pg_catalog.btrim(supabase_public_origin)
    AND supabase_public_origin = pg_catalog.lower(supabase_public_origin)
    AND pg_catalog.char_length(supabase_public_origin) BETWEEN 12 AND 261
    AND supabase_public_origin !~ '[[:space:]]'
    AND supabase_public_origin ~
      '^https://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
  )
);

ALTER TABLE qwestum_private.task_image_runtime_config OWNER TO postgres;

COMMENT ON TABLE qwestum_private.task_image_runtime_config IS
  'Private singleton configuration for the trusted Supabase Storage public origin. Zero rows is a valid fail-closed pre-bootstrap state.';

COMMENT ON COLUMN qwestum_private.task_image_runtime_config.singleton IS
  'The only permitted key is TRUE, structurally limiting the table to zero or one row.';

COMMENT ON COLUMN qwestum_private.task_image_runtime_config.supabase_public_origin IS
  'Trusted lower-case HTTPS Storage public origin only; no path, query, fragment, credentials, port, or trailing slash.';

REVOKE ALL ON TABLE qwestum_private.task_image_runtime_config FROM PUBLIC;
REVOKE ALL ON TABLE qwestum_private.task_image_runtime_config FROM anon;
REVOKE ALL ON TABLE qwestum_private.task_image_runtime_config FROM authenticated;
REVOKE ALL ON TABLE qwestum_private.task_image_runtime_config FROM service_role;

CREATE FUNCTION public.set_owned_quest_task_image(
  p_quest_id uuid,
  p_task_id uuid,
  p_expected_image_url text,
  p_new_object_path text
)
RETURNS TABLE(
  outcome text,
  id uuid,
  previous_image_url text,
  image_url text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_image_url text;
  v_origin text;
  v_new_image_url text;
BEGIN
  IF auth.uid() IS NULL
    OR p_quest_id IS NULL
    OR p_task_id IS NULL
    OR p_new_object_path IS NULL
    OR p_new_object_path = ''
    OR p_new_object_path <> pg_catalog.btrim(p_new_object_path)
    OR pg_catalog.char_length(p_new_object_path) > 174
    OR p_new_object_path !~
      (
        '^teachers/'
        || auth.uid()::text
        || '/quests/'
        || p_quest_id::text
        || '/tasks/'
        || p_task_id::text
        || '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
      ) THEN
    RETURN;
  END IF;

  -- Parent-first locking matches task reorder, creation, deletion, and
  -- metadata/content update boundaries.
  PERFORM 1
  FROM public.quests AS q
  WHERE q.id = p_quest_id
    AND q.author_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT qt.image_url
  INTO v_current_image_url
  FROM public.quest_tasks AS qt
  WHERE qt.id = p_task_id
    AND qt.quest_id = p_quest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT c.supabase_public_origin
  INTO v_origin
  FROM qwestum_private.task_image_runtime_config AS c
  WHERE c.singleton = TRUE;

  IF NOT FOUND
    OR v_origin IS NULL
    OR v_origin <> pg_catalog.btrim(v_origin)
    OR v_origin <> pg_catalog.lower(v_origin)
    OR pg_catalog.char_length(v_origin) NOT BETWEEN 12 AND 261
    OR v_origin ~ '[[:space:]]'
    OR v_origin !~
      '^https://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$' THEN
    RETURN;
  END IF;

  PERFORM 1
  FROM storage.objects AS so
  WHERE so.bucket_id = 'quest-images'
    AND so.name = p_new_object_path;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_new_image_url :=
    v_origin
    || '/storage/v1/object/public/quest-images/'
    || p_new_object_path;

  IF pg_catalog.char_length(v_new_image_url) > 512 THEN
    RETURN;
  END IF;

  IF v_current_image_url IS DISTINCT FROM p_expected_image_url THEN
    RETURN QUERY
    SELECT
      'stale_image'::text,
      p_task_id,
      v_current_image_url,
      v_current_image_url;
    RETURN;
  END IF;

  -- Never report an update whose previous URL is still the active URL.
  IF v_new_image_url IS NOT DISTINCT FROM v_current_image_url THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.quest_tasks AS qt
  SET image_url = v_new_image_url
  WHERE qt.id = p_task_id
    AND qt.quest_id = p_quest_id
  RETURNING
    'updated'::text,
    qt.id,
    v_current_image_url,
    qt.image_url;
END;
$$;

ALTER FUNCTION public.set_owned_quest_task_image(uuid, uuid, text, text)
  OWNER TO postgres;

COMMENT ON FUNCTION public.set_owned_quest_task_image(uuid, uuid, text, text) IS
  'Authenticated owner-only canonical task image set with a trusted private origin, Storage object existence check, and compare-and-swap image mutation.';

REVOKE ALL ON FUNCTION public.set_owned_quest_task_image(uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_owned_quest_task_image(uuid, uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.set_owned_quest_task_image(uuid, uuid, text, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.set_owned_quest_task_image(uuid, uuid, text, text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.set_owned_quest_task_image(uuid, uuid, text, text) TO authenticated;

CREATE FUNCTION public.clear_owned_quest_task_image_if_matches(
  p_quest_id uuid,
  p_task_id uuid,
  p_expected_image_url text
)
RETURNS TABLE(
  outcome text,
  id uuid,
  previous_image_url text,
  image_url text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_image_url text;
BEGIN
  IF auth.uid() IS NULL
    OR p_quest_id IS NULL
    OR p_task_id IS NULL
    OR p_expected_image_url IS NULL
    OR p_expected_image_url = ''
    OR p_expected_image_url <> pg_catalog.btrim(p_expected_image_url)
    OR pg_catalog.char_length(p_expected_image_url) > 512 THEN
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

  SELECT qt.image_url
  INTO v_current_image_url
  FROM public.quest_tasks AS qt
  WHERE qt.id = p_task_id
    AND qt.quest_id = p_quest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_current_image_url IS DISTINCT FROM p_expected_image_url THEN
    RETURN QUERY
    SELECT
      'stale_image'::text,
      p_task_id,
      v_current_image_url,
      v_current_image_url;
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.quest_tasks AS qt
  SET image_url = NULL
  WHERE qt.id = p_task_id
    AND qt.quest_id = p_quest_id
  RETURNING
    'cleared'::text,
    qt.id,
    v_current_image_url,
    qt.image_url;
END;
$$;

ALTER FUNCTION public.clear_owned_quest_task_image_if_matches(uuid, uuid, text)
  OWNER TO postgres;

COMMENT ON FUNCTION public.clear_owned_quest_task_image_if_matches(uuid, uuid, text) IS
  'Authenticated owner-only task image clear with compare-and-swap semantics.';

REVOKE ALL ON FUNCTION public.clear_owned_quest_task_image_if_matches(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clear_owned_quest_task_image_if_matches(uuid, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.clear_owned_quest_task_image_if_matches(uuid, uuid, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.clear_owned_quest_task_image_if_matches(uuid, uuid, text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.clear_owned_quest_task_image_if_matches(uuid, uuid, text) TO authenticated;
