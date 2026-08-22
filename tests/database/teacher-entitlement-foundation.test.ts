import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "database/migrations/045_add_teacher_entitlement_foundation.sql"),
  "utf8"
);

describe("M045 teacher entitlement foundation contract", () => {
  it("is an atomic migration with profile and collision preflight", () => {
    const beginIndex = migration.indexOf("BEGIN;");
    const firstChangeIndex = migration.indexOf("DO $$");
    const commitIndex = migration.lastIndexOf("COMMIT;");

    expect(beginIndex).toBeGreaterThan(-1);
    expect(beginIndex).toBeLessThan(firstChangeIndex);
    expect(migration).toContain("public.profiles is required before applying M045");
    expect(migration).toContain("profiles_role_check must preserve teacher/student roles before applying M045");
    expect(migration).toContain("commercial entitlement tables already exist; inspect before applying M045");
    expect(migration.slice(commitIndex).trim()).toBe("COMMIT;");
  });

  it("defines one nonblank, validated entitlement per profile", () => {
    expect(migration).toContain("CREATE TABLE public.teacher_entitlements");
    expect(migration).toContain("user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT");
    expect(migration).toContain("CONSTRAINT teacher_entitlements_user_id_key UNIQUE (user_id)");
    expect(migration).toContain("pg_catalog.btrim(provider) <> ''");
    expect(migration).toContain("pg_catalog.btrim(plan_code) <> ''");
    expect(migration).toContain("teacher_entitlements_provider_customer_id_nonblank_check");
    expect(migration).toContain("teacher_entitlements_provider_subscription_id_nonblank_check");
    expect(migration).toContain("status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')");
    expect(migration).toContain("teacher_entitlements_provider_subscription_id_key");
    expect(migration).toContain("teacher_entitlements_provider_customer_id_key");
  });

  it("keeps active access limited to current trialing or active rows", () => {
    const predicate = migration.slice(
      migration.indexOf("CREATE FUNCTION qwestum_private.has_active_teacher_entitlement"),
      migration.indexOf("ALTER FUNCTION qwestum_private.has_active_teacher_entitlement")
    );

    expect(predicate).toContain("te.status IN ('trialing', 'active')");
    expect(predicate).toContain("te.access_expires_at IS NULL OR te.access_expires_at > now()");
    expect(predicate).not.toContain("past_due");
    expect(predicate).not.toContain("canceled");
    expect(predicate).not.toContain("expired");
  });

  it("keeps commercial tables private from browser mutation and webhook audit invisible", () => {
    expect(migration).toContain("ALTER TABLE public.teacher_entitlements ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("CREATE POLICY teacher_entitlements_select_own");
    expect(migration).toContain("USING (user_id = auth.uid())");
    expect(migration).toContain("REVOKE ALL ON TABLE public.teacher_entitlements FROM authenticated");
    expect(migration).toContain("GRANT SELECT ON TABLE public.teacher_entitlements TO authenticated");
    expect(migration).toContain("ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("billing_webhook_events_provider_event_id_key UNIQUE (provider, event_id)");
    expect(migration).toContain("REVOKE ALL ON TABLE public.billing_webhook_events FROM authenticated");
  });

  it("hardens the private predicate and leaves current authoring and identity behavior untouched", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = pg_catalog, public");
    expect(migration).toContain("REVOKE ALL ON FUNCTION qwestum_private.has_active_teacher_entitlement(uuid) FROM PUBLIC");
    expect(migration).toContain("REVOKE ALL ON FUNCTION qwestum_private.has_active_teacher_entitlement(uuid) FROM authenticated");
    expect(migration).not.toContain("enforce_teacher_authoring_mutation");
    expect(migration).not.toContain("current_actor_is_teacher");
    expect(migration).not.toContain("provision_student_profile");
    expect(migration).not.toContain("ALTER COLUMN role");
  });
});
