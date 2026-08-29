import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "database/migrations/051_harden_quest_image_storage_ownership.sql"
  ),
  "utf8"
);

const writePolicies = [
  ["Teachers can upload own quest images", "INSERT", "WITH CHECK"],
  ["Teachers can delete own quest images", "DELETE", "USING"],
  ["Teachers can upload own quest covers", "INSERT", "WITH CHECK"],
  ["Teachers can delete own quest covers", "DELETE", "USING"],
] as const;

function policyBody(name: string) {
  const start = migration.indexOf(`CREATE POLICY "${name}"`);
  const end = migration.indexOf(");\n\nCREATE POLICY", start);

  if (start === -1) {
    throw new Error(`Missing ${name} policy.`);
  }

  return migration.slice(start, end === -1 ? migration.indexOf("\n\nCOMMIT;", start) : end);
}

function tablePrivilegePreflight() {
  const start = migration.indexOf(
    "IF NOT pg_catalog.has_table_privilege('authenticated', 'public.quests', 'SELECT')"
  );
  const end = migration.indexOf(
    "END IF;",
    start
  );

  if (start === -1 || end === -1) {
    throw new Error("Missing M051 table-privilege preflight.");
  }

  return migration.slice(start, end + "END IF;".length);
}

function extractTaggedPredicate(tag: string) {
  const match = migration.match(
    new RegExp(`\\$${tag}\\$([\\s\\S]*?)\\$${tag}\\$`)
  );

  if (!match) {
    throw new Error(`Missing ${tag} predecessor predicate in M051.`);
  }

  return match[1];
}

function normalizeKnownTaskSelectExpression(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s()]/g, "")
    .replaceAll("::text", "")
    .replace(
      /from(public[.])?quests(as)?parent_quest/g,
      "frompublic.questsparent_quest"
    );
}

describe("M051 quest image Storage ownership hardening contract", () => {
  it("is transactional and completes all predecessor checks before policy mutation", () => {
    const begin = migration.indexOf("BEGIN;");
    const preflight = migration.indexOf("DO $$");
    const firstDrop = migration.indexOf("DROP POLICY");
    const commit = migration.lastIndexOf("COMMIT;");

    expect(begin).toBeGreaterThan(-1);
    expect(begin).toBeLessThan(preflight);
    expect(preflight).toBeLessThan(firstDrop);
    expect(migration.slice(commit).trim()).toBe("COMMIT;");
  });

  it("fails closed on exact M047 write policies, public read, bucket settings, RLS, and owner-read prerequisites", () => {
    expect(migration).toContain("storage.objects policy set has unexpected predecessor state before applying M051");
    expect(migration).toContain("public quest-images SELECT policy has an unexpected predecessor definition before applying M051");
    expect(migration).toContain("task-image INSERT policy has an unexpected predecessor definition before applying M051");
    expect(migration).toContain("task-image DELETE policy has an unexpected predecessor definition before applying M051");
    expect(migration).toContain("cover INSERT policy has an unexpected predecessor definition before applying M051");
    expect(migration).toContain("cover DELETE policy has an unexpected predecessor definition before applying M051");
    expect(migration).toContain("storage.objects must not have an UPDATE policy before applying M051");
    expect(migration).toContain("v_bucket_is_public IS DISTINCT FROM TRUE");
    expect(migration).toContain("v_file_size_limit IS DISTINCT FROM 5242880");
    expect(migration).toContain("ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]");
    expect(migration).toContain("public.quests and public.quest_tasks must retain RLS before applying M051");
    expect(migration).toContain("v_anon_role oid");
    expect(migration).toContain("has_table_privilege('authenticated', 'public.quests', 'SELECT')");
    expect(migration).toContain("has_table_privilege('authenticated', 'public.quest_tasks', 'SELECT')");
    expect(migration).toContain("p.polcmd IN ('a', 'w', 'd', '*')");
    expect(migration).toContain("p.polroles && ARRAY[0, v_anon_role, v_authenticated_role]::oid[]");
    expect(migration).toContain("public quest/task browser roles must not have INSERT, UPDATE, DELETE, or FOR ALL RLS policies before applying M051");
    expect(migration).not.toContain("has_table_privilege('anon'");
    expect(migration).not.toContain("has_table_privilege('authenticated', 'public.quests', 'UPDATE')");
    expect(migration).not.toContain("has_table_privilege('authenticated', 'public.quest_tasks', 'DELETE')");
    expect(migration).toContain("public quest/task owner-only SELECT policies have an unexpected contract before applying M051");
    expect(migration).toContain("current_actor_can_author_storage has an unexpected security or EXECUTE contract before applying M051");
  });

  it("permits broad predecessor table grants and uses only authenticated SELECT as the relation-preflight prerequisite", () => {
    const actualPreflight = tablePrivilegePreflight();
    const privilegeCalls = actualPreflight.match(/has_table_privilege\([^\n]+\)/g) ?? [];

    expect(privilegeCalls).toEqual([
      "has_table_privilege('authenticated', 'public.quests', 'SELECT')",
      "has_table_privilege('authenticated', 'public.quest_tasks', 'SELECT')",
    ]);
    expect(migration.match(/has_table_privilege\([^\n]+\)/g)).toEqual(privilegeCalls);
    expect(actualPreflight).not.toMatch(
      /has_table_privilege\(\s*'(?:anon|authenticated)'\s*,\s*'public\.(?:quests|quest_tasks)'\s*,\s*'(?:INSERT|UPDATE|DELETE)'\s*\)/i
    );
    expect(migration).not.toContain("REVOKE ");
    expect(migration).toContain("p.polcmd IN ('a', 'w', 'd', '*')");
    expect(migration).toContain(
      "p.polroles && ARRAY[0, v_anon_role, v_authenticated_role]::oid[]"
    );
  });

  it("normalizes only the known quest-table alias variants in the task owner SELECT predicate", () => {
    const expected = extractTaggedPredicate("task_select");
    const expectedNormalized = normalizeKnownTaskSelectExpression(expected);

    expect(migration).toContain(
      "'from(public[.])?quests(as)?parent_quest', 'frompublic.questsparent_quest', 'g'"
    );

    for (const fromClause of [
      "from quests parent_quest",
      "from quests as parent_quest",
      "from public.quests parent_quest",
      "from public.quests as parent_quest",
    ]) {
      expect(
        normalizeKnownTaskSelectExpression(
          expected.replace("from public.quests as parent_quest", fromClause)
        )
      ).toBe(expectedNormalized);
    }

    expect(
      normalizeKnownTaskSelectExpression(
        expected.replace("public.quests", "profiles")
      )
    ).not.toBe(expectedNormalized);
    expect(
      normalizeKnownTaskSelectExpression(
        expected.replace("and parent_quest.author_id = auth.uid()", "")
      )
    ).not.toBe(expectedNormalized);
    expect(
      normalizeKnownTaskSelectExpression(
        expected.replace("parent_quest.id = quest_tasks.quest_id", "parent_quest.id = quest_tasks.id")
      )
    ).not.toBe(expectedNormalized);
  });

  it("replaces only the four authenticated write policies and preserves public reads with no UPDATE policy", () => {
    expect(migration).toContain("p.polname = 'Public read quest images'");
    expect(migration).toContain("p.polcmd = 'r'");
    expect(migration).toContain("p.polroles = ARRAY[0]::oid[]");
    expect(migration).not.toContain("DROP POLICY \"Public read quest images\"");
    expect(migration).not.toContain("CREATE POLICY \"Public read quest images\"");
    expect(migration).not.toContain("FOR UPDATE");
    expect(migration).not.toContain("UPDATE storage.buckets");

    for (const [name, command, predicate] of writePolicies) {
      expect(migration).toContain(`DROP POLICY "${name}" ON storage.objects`);
      const body = policyBody(name);
      expect(body).toContain(`FOR ${command}`);
      expect(body).toContain("TO authenticated");
      expect(body).toContain(predicate);
    }
  });

  it("requires the canonical task path and real owned quest/task relation for INSERT and DELETE", () => {
    for (const name of [
      "Teachers can upload own quest images",
      "Teachers can delete own quest images",
    ]) {
      const body = policyBody(name);
      expect(body).toContain("bucket_id = 'quest-images'");
      expect(body).toContain("(storage.foldername(name))[1] = 'teachers'");
      expect(body).toContain("(storage.foldername(name))[2] = auth.uid()::text");
      expect(body).toContain("(storage.foldername(name))[3] = 'quests'");
      expect(body).toContain("(storage.foldername(name))[5] = 'tasks'");
      expect(body).toContain("(storage.foldername(name))[7] IS NULL");
      expect(body).toContain("/tasks/[0-9a-f]{8}");
      expect(body).toContain("[.](jpg|png|webp)$'");
      expect(body).toContain("FROM public.quests AS q");
      expect(body).toContain("q.author_id = auth.uid()");
      expect(body).toContain("FROM public.quest_tasks AS qt");
      expect(body).toContain("qt.id::text = (storage.foldername(name))[6]");
      expect(body).toContain("qt.quest_id::text = (storage.foldername(name))[4]");
      expect(body).toContain("public.current_actor_can_author_storage()");
    }
  });

  it("requires a real owned quest and canonical path for cover INSERT and DELETE", () => {
    for (const name of [
      "Teachers can upload own quest covers",
      "Teachers can delete own quest covers",
    ]) {
      const body = policyBody(name);
      expect(body).toContain("bucket_id = 'quest-images'");
      expect(body).toContain("(storage.foldername(name))[2] = auth.uid()::text");
      expect(body).toContain("(storage.foldername(name))[5] = 'cover'");
      expect(body).toContain("(storage.foldername(name))[6] IS NULL");
      expect(body).toContain("/cover/[0-9a-f]{8}");
      expect(body).toContain("[.](jpg|png|webp)$'");
      expect(body).toContain("FROM public.quests AS q");
      expect(body).toContain("q.id::text = (storage.foldername(name))[4]");
      expect(body).toContain("q.author_id = auth.uid()");
      expect(body).toContain("public.current_actor_can_author_storage()");
    }
  });

  it("uses direct RLS-respecting EXISTS predicates without changing table privileges or RLS", () => {
    const replacements = migration.slice(migration.indexOf("DROP POLICY"));

    expect(replacements).toContain("EXISTS (\n    SELECT 1\n    FROM public.quests AS q");
    expect(replacements).toContain("EXISTS (\n    SELECT 1\n    FROM public.quest_tasks AS qt");
    expect(migration).not.toContain("CREATE FUNCTION");
    expect(migration).not.toContain("SECURITY DEFINER");
    expect(migration).not.toContain("ALTER TABLE public.quests");
    expect(migration).not.toContain("ALTER TABLE public.quest_tasks");
    expect(migration).not.toContain("GRANT ");
    expect(migration).not.toContain("REVOKE ");
  });

  it("requires the referenced ownership rows to exist, so cleanup must precede row deletion", () => {
    const replacements = migration.slice(migration.indexOf("DROP POLICY"));

    expect(replacements).toContain("FROM public.quests AS q");
    expect(replacements).toContain("FROM public.quest_tasks AS qt");
    expect(replacements).toContain("qt.quest_id::text = (storage.foldername(name))[4]");
  });
});
