import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "database/migrations/049_add_quest_narrative_fields.sql"),
  "utf8"
);

const questWriter = migration.slice(
  migration.indexOf("CREATE FUNCTION public.update_owned_quest_metadata_v2"),
  migration.indexOf("ALTER FUNCTION public.update_owned_quest_metadata_v2")
);
const taskWriter = migration.slice(
  migration.indexOf("CREATE FUNCTION public.update_owned_quest_task_content_v2"),
  migration.indexOf("ALTER FUNCTION public.update_owned_quest_task_content_v2")
);
const duplicate = migration.slice(
  migration.indexOf("CREATE OR REPLACE FUNCTION public.duplicate_owned_quest"),
  migration.indexOf("ALTER FUNCTION public.duplicate_owned_quest")
);
const runtime = migration.slice(
  migration.indexOf("CREATE OR REPLACE FUNCTION public.get_public_runtime_quest"),
  migration.indexOf("ALTER FUNCTION public.get_public_runtime_quest")
);
const runtimeV2 = migration.slice(
  migration.indexOf("CREATE FUNCTION public.get_public_runtime_quest_v2"),
  migration.indexOf("ALTER FUNCTION public.get_public_runtime_quest_v2")
);

describe("M049 quest narrative fields contract", () => {
  it("is an additive, atomic migration with defensive predecessor checks", () => {
    const begin = migration.indexOf("BEGIN;");
    const preflight = migration.indexOf("DO $$");
    const firstMutation = migration.indexOf("ALTER TABLE public.quests");
    const commit = migration.lastIndexOf("COMMIT;");
    expect(begin).toBeGreaterThan(-1);
    expect(begin).toBeLessThan(preflight);
    expect(preflight).toBeLessThan(firstMutation);
    expect(migration.slice(commit).trim()).toBe("COMMIT;");
    expect(migration).toContain("M049 narrative columns already exist; inspect before applying");
    expect(migration).toContain("existing owner-safe narrative prerequisites are required before applying M049");
  });

  it("adds four nullable bounded narrative fields without data rewrite", () => {
    for (const column of ["mission_intro", "mission_outro", "narrative_intro", "narrative_success"]) {
      expect(migration).toContain(`${column} text NULL`);
      expect(migration).toContain(`${column} IS NULL OR (`);
      expect(migration).toContain(`pg_catalog.char_length(${column}) <= 4000`);
    }
    expect(migration).toContain("~ '[^[:space:]]'");
    expect(migration).toContain("!~ E'[\\\\x00-\\\\x08\\\\x0B\\\\x0C\\\\x0E-\\\\x1F\\\\x7F]'");
    const schemaAndPreflight = migration.slice(
      0,
      migration.indexOf("CREATE FUNCTION public.update_owned_quest_metadata_v2")
    );
    expect(schemaAndPreflight).not.toMatch(/(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+)?public\.(?:quests|quest_tasks)/);
  });

  it("preserves direct-table protections and leaves publication readiness optional", () => {
    expect(migration).not.toContain("CREATE POLICY");
    expect(migration).not.toContain("GRANT UPDATE ON TABLE");
    expect(migration).not.toContain("GRANT INSERT ON TABLE");
    expect(migration).not.toContain("GRANT DELETE ON TABLE");
    expect(migration).not.toContain("is_public_runtime_eligible(q.id) AND q.mission_intro");
    expect(migration).not.toContain("is_public_runtime_eligible(q.id) AND q.mission_outro");
  });

  it("adds hardened authenticated-only versioned owner write boundaries while retaining predecessors", () => {
    expect(migration).toContain("public.update_owned_quest_metadata(uuid,text,text,integer,uuid,boolean,text,boolean,text,boolean,text[],boolean,integer,boolean,integer,boolean,integer,boolean)");
    expect(migration).toContain("public.update_owned_quest_task_content(uuid,uuid,text,text,integer,jsonb)");
    for (const fn of [questWriter, taskWriter]) {
      expect(fn).toContain("SECURITY DEFINER");
      expect(fn).toContain("SET search_path = pg_catalog, public");
      expect(fn).toContain("auth.uid()");
      expect(fn).toContain("FOR UPDATE");
    }
    expect(taskWriter).toContain("FROM public.quests AS q");
    expect(taskWriter.indexOf("FROM public.quests AS q")).toBeLessThan(taskWriter.indexOf("FROM public.quest_tasks AS qt"));
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.update_owned_quest_metadata_v2");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.update_owned_quest_task_content_v2");
    expect(migration).toContain("FROM anon;");
    expect(migration).toContain("FROM PUBLIC;");
  });

  it("normalizes whitespace-only values to null while permitting normal multiline narrative", () => {
    for (const fn of [questWriter, taskWriter]) {
      expect(fn).toContain("NULLIF(pg_catalog.regexp_replace(p_");
      expect(fn).toContain("'^[[:space:]]+|[[:space:]]+$'");
      expect(fn).toContain("pg_catalog.char_length(v_");
      expect(fn).toContain("~ E'[");
      expect(fn).toContain("x00-");
      expect(fn).toContain("x0B");
      expect(fn).toContain("x0E-");
      expect(fn).toContain("x7F]'");
    }
    const allowedExamples = ["Первая строка\nВторая строка", "Жол\r\nжалғасады", "Сцена\t✨"];
    expect(allowedExamples.every((value) => /[^\s]/u.test(value))).toBe(true);
    expect(/^[\t\n\r ]+$/.test(" \t\r\n ")).toBe(true);
    expect("\u0000").toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
  });

  it("copies narrative while preserving draft-only and no-media duplication", () => {
    expect(duplicate).toContain("mission_intro, mission_outro");
    expect(duplicate).toContain("narrative_intro, narrative_success");
    expect(duplicate).toContain("auth.uid(), FALSE");
    expect(duplicate).toContain("NULL, v_source.mission_intro, v_source.mission_outro");
    expect(duplicate).toContain("NULL, NULL, NULL,");
  });

  it("preserves the legacy runtime task contract and isolates narrative in v2", () => {
    expect(runtime).not.toContain("narrative_intro");
    expect(runtime).not.toContain("narrative_success");
    expect(runtime).not.toContain("'content', qt.content");
    expect(runtime).not.toContain("'correctOptionId', qt.content");
    expect(runtime).not.toContain("'correctOptionIds', qt.content");
    expect(runtime).toContain("public.is_public_runtime_eligible(q.id)");
    expect(runtime).toContain("ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC");

    expect(runtimeV2).toContain("mission_intro text");
    expect(runtimeV2).toContain("mission_outro text");
    expect(runtimeV2).toContain("'narrative_intro', qt.narrative_intro");
    expect(runtimeV2).toContain("'narrative_success', qt.narrative_success");
    expect(runtimeV2).toContain("public.is_public_runtime_eligible(q.id)");
    expect(runtimeV2).toContain("ORDER BY qt.sort_order ASC NULLS LAST, qt.id ASC");
    expect(runtimeV2).toContain("SECURITY DEFINER");
    expect(runtimeV2).toContain("SET search_path = pg_catalog, public");
    for (const privateProjection of [
      "'content', qt.content",
      "'correctOptionId', qt.content",
      "'correctOptionIds', qt.content",
      "'author_id'",
      "'points'",
      "'cover_image_path'",
      "storage.objects",
    ]) {
      expect(runtimeV2).not.toContain(privateProjection);
    }
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest_v2(uuid) TO anon");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.get_public_runtime_quest_v2(uuid) TO authenticated");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.get_public_runtime_quest_v2(uuid) FROM PUBLIC");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.get_public_runtime_quest_v2(uuid) FROM anon");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.get_public_runtime_quest_v2(uuid) FROM service_role");
    expect(migration).not.toContain("GRANT SELECT ON TABLE public.quests TO anon");
    expect(migration).not.toContain("GRANT SELECT ON TABLE public.quest_tasks TO anon");
  });
});
