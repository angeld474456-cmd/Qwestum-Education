-- P1D-A: provider-neutral commercial entitlement data only. Authoring
-- enforcement remains role-only until a later, separately reviewed migration.

BEGIN;

DO $$
BEGIN
  IF pg_catalog.to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'public.profiles is required before applying M045';
  END IF;

  IF pg_catalog.to_regnamespace('qwestum_private') IS NULL THEN
    RAISE EXCEPTION 'qwestum_private schema is required before applying M045';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_attribute AS a
    JOIN pg_catalog.pg_type AS t ON t.oid = a.atttypid
    JOIN pg_catalog.pg_index AS i
      ON i.indrelid = 'public.profiles'::pg_catalog.regclass
      AND i.indisprimary
      AND a.attnum = ANY (i.indkey)
    WHERE a.attrelid = 'public.profiles'::pg_catalog.regclass
      AND a.attname = 'id'
      AND a.attnotnull
      AND t.typname = 'uuid'
      AND NOT a.attisdropped
  ) THEN
    RAISE EXCEPTION 'public.profiles.id must be a non-null uuid primary key before applying M045';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.role IS NULL OR p.role NOT IN ('teacher', 'student')
  ) THEN
    RAISE EXCEPTION 'public.profiles contains an unsupported role; inspect before applying M045';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS c
    WHERE c.conrelid = 'public.profiles'::pg_catalog.regclass
      AND c.conname = 'profiles_role_check'
      AND pg_catalog.pg_get_constraintdef(c.oid) LIKE '%teacher%student%'
  ) THEN
    RAISE EXCEPTION 'profiles_role_check must preserve teacher/student roles before applying M045';
  END IF;

  IF pg_catalog.to_regclass('public.teacher_entitlements') IS NOT NULL
    OR pg_catalog.to_regclass('public.billing_webhook_events') IS NOT NULL THEN
    RAISE EXCEPTION 'commercial entitlement tables already exist; inspect before applying M045';
  END IF;

  IF pg_catalog.to_regprocedure('qwestum_private.has_active_teacher_entitlement(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'teacher entitlement predicate already exists; inspect before applying M045';
  END IF;
END;
$$;

CREATE TABLE public.teacher_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  provider text NOT NULL,
  provider_customer_id text NULL,
  provider_subscription_id text NULL,
  plan_code text NOT NULL,
  status text NOT NULL,
  access_expires_at timestamptz NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_entitlements_user_id_key UNIQUE (user_id),
  CONSTRAINT teacher_entitlements_provider_nonblank_check
    CHECK (pg_catalog.btrim(provider) <> ''),
  CONSTRAINT teacher_entitlements_plan_code_nonblank_check
    CHECK (pg_catalog.btrim(plan_code) <> ''),
  CONSTRAINT teacher_entitlements_provider_customer_id_nonblank_check
    CHECK (
      provider_customer_id IS NULL
      OR pg_catalog.btrim(provider_customer_id) <> ''
    ),
  CONSTRAINT teacher_entitlements_provider_subscription_id_nonblank_check
    CHECK (
      provider_subscription_id IS NULL
      OR pg_catalog.btrim(provider_subscription_id) <> ''
    ),
  CONSTRAINT teacher_entitlements_status_check
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired'))
);

CREATE UNIQUE INDEX teacher_entitlements_provider_customer_id_key
  ON public.teacher_entitlements (provider, provider_customer_id)
  WHERE provider_customer_id IS NOT NULL;

CREATE UNIQUE INDEX teacher_entitlements_provider_subscription_id_key
  ON public.teacher_entitlements (provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

ALTER TABLE public.teacher_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY teacher_entitlements_select_own
  ON public.teacher_entitlements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.teacher_entitlements FROM PUBLIC;
REVOKE ALL ON TABLE public.teacher_entitlements FROM anon;
REVOKE ALL ON TABLE public.teacher_entitlements FROM authenticated;
GRANT SELECT ON TABLE public.teacher_entitlements TO authenticated;

CREATE TABLE public.billing_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NULL,
  outcome text NULL,
  CONSTRAINT billing_webhook_events_provider_nonblank_check
    CHECK (pg_catalog.btrim(provider) <> ''),
  CONSTRAINT billing_webhook_events_event_id_nonblank_check
    CHECK (pg_catalog.btrim(event_id) <> ''),
  CONSTRAINT billing_webhook_events_provider_event_id_key UNIQUE (provider, event_id)
);

ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.billing_webhook_events FROM PUBLIC;
REVOKE ALL ON TABLE public.billing_webhook_events FROM anon;
REVOKE ALL ON TABLE public.billing_webhook_events FROM authenticated;

CREATE FUNCTION qwestum_private.has_active_teacher_entitlement(
  p_target_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT p_target_user_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.teacher_entitlements AS te
      WHERE te.user_id = p_target_user_id
        AND te.status IN ('trialing', 'active')
        AND (te.access_expires_at IS NULL OR te.access_expires_at > now())
    );
$$;

ALTER FUNCTION qwestum_private.has_active_teacher_entitlement(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION qwestum_private.has_active_teacher_entitlement(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION qwestum_private.has_active_teacher_entitlement(uuid) FROM anon;
REVOKE ALL ON FUNCTION qwestum_private.has_active_teacher_entitlement(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION qwestum_private.has_active_teacher_entitlement(uuid) FROM service_role;

-- Future privileged lifecycle updates must set updated_at explicitly. P1D-A
-- deliberately adds no broad trigger framework before a provider is selected.

COMMIT;
