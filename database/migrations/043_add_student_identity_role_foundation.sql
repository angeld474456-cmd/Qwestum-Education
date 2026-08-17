-- P1A: establish the minimum authoritative student/teacher identity boundary.
-- Existing profiles are preserved; unexpected historical role values abort safely.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.role IS NULL OR p.role NOT IN ('teacher', 'student')
  ) THEN
    RAISE EXCEPTION 'profiles contains an unsupported role; repair explicitly before applying M043';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS c
    WHERE c.conrelid = 'public.profiles'::pg_catalog.regclass
      AND c.conname = 'profiles_role_check'
      AND pg_catalog.pg_get_constraintdef(c.oid) NOT LIKE '%role%teacher%student%'
  ) THEN
    RAISE EXCEPTION 'profiles_role_check has an unexpected definition; inspect it before applying M043';
  ELSIF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS c
    WHERE c.conrelid = 'public.profiles'::pg_catalog.regclass
      AND c.conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('teacher', 'student'));
  END IF;
END;
$$;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'student';

CREATE FUNCTION qwestum_private.provision_student_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_full_name text;
BEGIN
  IF NEW.id IS NULL OR NEW.email IS NULL OR pg_catalog.btrim(NEW.email) = '' THEN
    RAISE EXCEPTION 'email-authenticated users require a nonblank email profile value';
  END IF;

  v_full_name := NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'full_name'), '');

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, v_full_name, 'student');

  RETURN NEW;
END;
$$;

ALTER FUNCTION qwestum_private.provision_student_profile() OWNER TO postgres;

REVOKE ALL ON FUNCTION qwestum_private.provision_student_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION qwestum_private.provision_student_profile() FROM anon;
REVOKE ALL ON FUNCTION qwestum_private.provision_student_profile() FROM authenticated;
REVOKE ALL ON FUNCTION qwestum_private.provision_student_profile() FROM service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS t
    WHERE t.tgrelid = 'auth.users'::pg_catalog.regclass
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'auth.users has an unexpected user-defined trigger; inspect it before applying M043';
  END IF;
END;
$$;

CREATE TRIGGER on_auth_user_created_provision_student_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION qwestum_private.provision_student_profile();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies AS p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'profiles'
  ) THEN
    RAISE EXCEPTION 'profiles has existing RLS policies; inspect them before applying M043';
  END IF;
END;
$$;

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

REVOKE ALL ON TABLE public.profiles FROM PUBLIC;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- This helper is callable only from privileged database code. It evaluates the
-- caller JWT through auth.uid(), not Auth metadata or client-provided input.
CREATE FUNCTION qwestum_private.current_actor_is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = auth.uid()
        AND p.role = 'teacher'
    );
$$;

ALTER FUNCTION qwestum_private.current_actor_is_teacher() OWNER TO postgres;

REVOKE ALL ON FUNCTION qwestum_private.current_actor_is_teacher() FROM PUBLIC;
REVOKE ALL ON FUNCTION qwestum_private.current_actor_is_teacher() FROM anon;
REVOKE ALL ON FUNCTION qwestum_private.current_actor_is_teacher() FROM authenticated;
REVOKE ALL ON FUNCTION qwestum_private.current_actor_is_teacher() FROM service_role;

-- Every supported authoring RPC ultimately mutates one of these tables. The
-- guard applies role authorization at that shared write boundary while the
-- existing RPCs retain their ownership, locking, and validation contracts.
-- Covered authoring RPC write families: create/update/delete/duplicate quests,
-- publication, cover mutations, and task create/update/delete/reorder/image mutations.
CREATE FUNCTION qwestum_private.enforce_teacher_authoring_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- SQL migrations run without an Auth JWT and remain administrative work.
  IF auth.uid() IS NULL OR qwestum_private.current_actor_is_teacher() THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;

    RETURN NEW;
  END IF;

  -- Suppress the write without exposing profile details. Existing RPCs map a
  -- zero-row mutation to their established unavailable/not-found outcome.
  RETURN NULL;
END;
$$;

ALTER FUNCTION qwestum_private.enforce_teacher_authoring_mutation() OWNER TO postgres;

REVOKE ALL ON FUNCTION qwestum_private.enforce_teacher_authoring_mutation() FROM PUBLIC;
REVOKE ALL ON FUNCTION qwestum_private.enforce_teacher_authoring_mutation() FROM anon;
REVOKE ALL ON FUNCTION qwestum_private.enforce_teacher_authoring_mutation() FROM authenticated;
REVOKE ALL ON FUNCTION qwestum_private.enforce_teacher_authoring_mutation() FROM service_role;

CREATE TRIGGER enforce_teacher_authoring_quest_mutation
  BEFORE INSERT OR UPDATE OR DELETE ON public.quests
  FOR EACH ROW
  EXECUTE FUNCTION qwestum_private.enforce_teacher_authoring_mutation();

CREATE TRIGGER enforce_teacher_authoring_task_mutation
  BEFORE INSERT OR UPDATE OR DELETE ON public.quest_tasks
  FOR EACH ROW
  EXECUTE FUNCTION qwestum_private.enforce_teacher_authoring_mutation();

COMMIT;
