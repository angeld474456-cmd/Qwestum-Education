import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "database/migrations/050_add_sequence_task_type.sql"),
  "utf8"
);

const predecessorBodies = [
  ["database/migrations/030_normalize_owned_task_creation_image_url.sql", "public.create_owned_quest_task", "public.create_owned_quest_task(uuid,text,text,text,text,integer,text,jsonb)"],
  ["database/migrations/049_add_quest_narrative_fields.sql", "public.update_owned_quest_task_content_v2", "public.update_owned_quest_task_content_v2(uuid,uuid,text,text,integer,jsonb,text,text)"],
  ["database/migrations/036_reject_duplicate_choice_option_text.sql", "public.is_public_runtime_eligible", "public.is_public_runtime_eligible(uuid)"],
  ["database/migrations/049_add_quest_narrative_fields.sql", "public.get_public_runtime_quest", "public.get_public_runtime_quest(uuid)"],
  ["database/migrations/049_add_quest_narrative_fields.sql", "public.get_public_runtime_quest_v2", "public.get_public_runtime_quest_v2(uuid)"],
  ["database/migrations/019_add_public_multiple_choice_runtime.sql", "public.score_public_runtime_quest", "public.score_public_runtime_quest(uuid,jsonb)"],
  ["database/migrations/044_add_student_attempt_history.sql", "public.submit_student_quest_attempt", "public.submit_student_quest_attempt(uuid,jsonb)"],
] as const;

function extractFunctionBody(source: string, name: string) {
  const createIndexes = [
    source.indexOf(`CREATE OR REPLACE FUNCTION ${name}`),
    source.indexOf(`CREATE FUNCTION ${name}`),
  ].filter((index) => index >= 0);
  const createIndex = Math.min(...createIndexes);
  const taggedBody = /AS\s+(\$[A-Za-z_]*\$)/.exec(source.slice(createIndex));
  if (!Number.isFinite(createIndex) || !taggedBody) {
    throw new Error(`Unable to extract ${name}`);
  }

  const tag = taggedBody[1];
  const bodyStart = createIndex + taggedBody.index + taggedBody[0].length;
  const bodyEnd = source.indexOf(`${tag};`, bodyStart);
  if (bodyEnd < 0) {
    throw new Error(`Unable to close ${name}`);
  }

  return source.slice(bodyStart, bodyEnd);
}

function normalizedBodyMd5(source: string) {
  return createHash("md5")
    .update(source.replace(/--[^\r\n]*/g, "").replace(/\s+/g, ""))
    .digest("hex");
}

function hasBalancedSqlParentheses(source: string) {
  let depth = 0;
  let inString = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (character === "'" && source[index + 1] === "'") {
        index += 1;
      } else if (character === "'") {
        inString = false;
      }
      continue;
    }
    if (character === "'") {
      inString = true;
    } else if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth < 0) return false;
    }
  }

  return !inString && depth === 0;
}

describe("M050 sequence task type contract", () => {
  it("is atomic and refuses unexpected predecessor task-type constraints", () => {
    const begin = migration.indexOf("BEGIN;");
    const preflight = migration.indexOf("DO $$");
    const firstMutation = migration.indexOf("CREATE FUNCTION qwestum_private.is_valid_sequence_task_content");
    expect(begin).toBeGreaterThan(-1);
    expect(begin).toBeLessThan(preflight);
    expect(preflight).toBeLessThan(firstMutation);
    expect(migration.trimEnd()).toMatch(/COMMIT;$/);
    expect(migration).toContain("unexpected quest_tasks task_type CHECK exists");
    expect(migration).toContain("quest_attempt_answers_task_type_check has an unexpected definition");
    expect(migration).toContain("M050 predecessor function EXECUTE contract is unexpected");
    expect(migration).toContain("M050 predecessor function must not grant EXECUTE to PUBLIC");
    expect(migration).toContain("p.proowner <> 'postgres'::pg_catalog.regrole");
    expect(migration).toContain("pg_catalog.has_function_privilege(");
    expect(migration).toContain("acl.grantee = 0");
    expect(migration).toContain("p.provolatile <> 'v'");
    expect(migration).toContain("p.prorettype <> 'record'::pg_catalog.regtype");
    expect(migration).toContain("p.prorettype <> 'boolean'::pg_catalog.regtype");
    expect(migration).toContain("FROM pg_catalog.pg_depend AS d");
    expect(migration).toContain("c.conkey @> ARRAY[");
    expect(migration).toContain("M050 public task image helper already exists");
  });

  it("fingerprints complete normalized authoritative predecessor bodies", () => {
    for (const [path, name, signature] of predecessorBodies) {
      const source = readFileSync(resolve(process.cwd(), path), "utf8");
      const digest = normalizedBodyMd5(extractFunctionBody(source, name));
      expect(migration).toContain(`'${signature}'::pg_catalog.regprocedure, '${digest}'`);
    }
    expect(migration).toContain("pg_catalog.regexp_replace(p.prosrc, E'--[^\\\\r\\\\n]*', '', 'g')");
    expect(migration).toContain("M050 predecessor function body is unexpected");
  });

  it("uses M030 as the authoritative create-task predecessor and preserves its nullable image contract", () => {
    const m030 = readFileSync(
      resolve(process.cwd(), "database/migrations/030_normalize_owned_task_creation_image_url.sql"),
      "utf8"
    );
    const m021 = readFileSync(
      resolve(process.cwd(), "database/migrations/021_add_owned_task_creation.sql"),
      "utf8"
    );
    const m030Body = extractFunctionBody(m030, "public.create_owned_quest_task");
    const m021Body = extractFunctionBody(m021, "public.create_owned_quest_task");
    const createTask = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.create_owned_quest_task"),
      migration.indexOf("ALTER FUNCTION public.create_owned_quest_task")
    );

    expect(predecessorBodies[0][0]).toBe(
      "database/migrations/030_normalize_owned_task_creation_image_url.sql"
    );
    expect(normalizedBodyMd5(m030Body)).toBe("a577e0832116b34c2306677396704c5d");
    expect(normalizedBodyMd5(m030Body)).not.toBe(normalizedBodyMd5(m021Body));
    expect(createTask).toContain("p_hint,NULL,'','',p_points,p_task_type,p_content,v_next_sort_order");
    expect(createTask).not.toContain("p_hint,'','','',p_points,p_task_type,p_content,v_next_sort_order");
    expect(createTask).not.toContain("p_content IS NOT NULL AND pg_catalog.jsonb_typeof(p_content) <> 'object'");
  });

  it("would reject meaningful drift even when old marker strings remain", () => {
    const source = readFileSync(
      resolve(process.cwd(), "database/migrations/019_add_public_multiple_choice_runtime.sql"),
      "utf8"
    );
    const scorer = extractFunctionBody(source, "public.score_public_runtime_quest");
    const changedScorer = scorer.replace("status = 'correct'", "status = 'incorrect'");

    expect(changedScorer).toContain("selectedOptionIds");
    expect(normalizedBodyMd5(changedScorer)).not.toBe(normalizedBodyMd5(scorer));

    for (const restrictiveCheck of [
      "task_type <> 'sequence'",
      "task_type NOT IN ('sequence')",
      "'text' = task_type",
      "task_type = ANY (ARRAY['text'])",
      "lower(task_type) = 'text'",
    ]) {
      expect(restrictiveCheck).toContain("task_type");
    }
    expect(migration).toContain("a.attname = 'task_type'");
  });

  it("defines strict three-to-eight item Sequence content with 1000-character text", () => {
    const validator = migration.slice(
      migration.indexOf("CREATE FUNCTION qwestum_private.is_valid_sequence_task_content"),
      migration.indexOf("ALTER FUNCTION qwestum_private.is_valid_sequence_task_content")
    );
    expect(validator).toContain("jsonb_array_length(p_content -> 'items') BETWEEN 3 AND 8");
    expect(validator).toContain("jsonb_array_length(p_content -> 'correctOrder') = pg_catalog.jsonb_array_length(p_content -> 'items')");
    expect(validator).toContain("NOT items.value ? 'id' OR NOT items.value ? 'text'");
    expect(validator).toContain("count(DISTINCT value ->> 'id')");
    expect(validator).toContain("char_length(items.value ->> 'text') > 1000");
    expect(validator).toContain("GROUP BY pg_catalog.lower(pg_catalog.btrim(value ->> 'text'))");
    expect(validator).toContain("correctOrder");
  });

  it("keeps Sequence validation private and preserves legacy writer semantics", () => {
    expect(migration).toContain("REVOKE ALL ON FUNCTION qwestum_private.is_valid_sequence_task_content(jsonb) FROM PUBLIC");
    for (const name of ["create_owned_quest_task", "update_owned_quest_task_content_v2"]) {
      const start = migration.indexOf(`FUNCTION public.${name}`);
      expect(start).toBeGreaterThan(-1);
      expect(migration.slice(start, start + 6000)).toContain("SECURITY DEFINER");
      expect(migration.slice(start, start + 6000)).toContain("qwestum_private.is_valid_sequence_task_content");
    }
    expect(migration).not.toContain("CREATE POLICY");
    expect(migration).not.toContain("GRANT UPDATE ON TABLE");
    expect(migration).not.toContain("p_task_type = 'text' AND p_content IS NOT NULL");
    expect(migration).not.toContain("v_task_type='text' AND p_content IS NOT NULL");
  });

  it("uses guarded JSON arrays for legacy eligibility and submitted answer parsing", () => {
    const eligibility = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.is_public_runtime_eligible"),
      migration.indexOf("ALTER FUNCTION public.is_public_runtime_eligible")
    );
    const scoring = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.score_public_runtime_quest"),
      migration.indexOf("ALTER FUNCTION public.score_public_runtime_quest")
    );

    expect(eligibility).toContain("jsonb_array_length(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'options')='array'");
    expect(eligibility).toContain("jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'options')='array'");
    expect(eligibility).toContain("jsonb_array_length(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'correctOptionIds')='array'");
    expect(eligibility).toContain("jsonb_array_elements(CASE WHEN pg_catalog.jsonb_typeof(qt.content->'correctOptionIds')='array'");
    expect(scoring).toContain("jsonb_array_length(CASE WHEN pg_catalog.jsonb_typeof(p_answers->'answers')='array'");
    expect(scoring).toContain("ordered_item_ids_safe");
    expect(scoring).toContain("selected_option_ids_safe");
  });

  it("allows Sequence attempt rows and persists only sanitized items plus submitted IDs", () => {
    expect(migration).toContain("'text', 'single_choice', 'multiple_choice', 'sequence'");
    expect(migration).toContain("'orderedItemIds'");
    expect(migration).toContain("WHEN 'sequence' THEN pg_catalog.jsonb_build_object('orderedItemIds'");
    expect(migration).toContain("IN('single_choice','multiple_choice','sequence')");
  });

  it("projects deterministic noncanonical items and never projects correctOrder", () => {
    const runtime = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.get_public_runtime_quest"),
      migration.indexOf("ALTER FUNCTION public.get_public_runtime_quest(uuid)")
    );
    const runtimeV2 = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.get_public_runtime_quest_v2"),
      migration.indexOf("ALTER FUNCTION public.get_public_runtime_quest_v2(uuid)")
    );
    expect(runtime).toContain("ORDER BY pg_catalog.md5(qt.id::text||(h.value->>'id')),h.value->>'id'");
    expect(runtime).not.toContain("qt.id::text||h.value->>'id'");
    expect(runtime).toContain("hashed.ids=canonical.ids AND hashed.count>1");
    expect(runtime).toContain("'items'");
    expect(runtime).not.toContain("'correctOrder', qt.content");
    expect(runtime).not.toContain("'content', qt.content");
    expect(runtimeV2).toContain("'narrative_intro',qt.narrative_intro");
    expect(runtimeV2).toContain("'narrative_success',qt.narrative_success");
    expect(runtimeV2).toContain("ORDER BY pg_catalog.md5(qt.id::text||(h.value->>'id')),h.value->>'id'");
    expect(runtimeV2).not.toContain("qt.id::text||h.value->>'id'");
    expect(runtimeV2).toContain("pg_catalog.array_position(hashed.ids,s.value->>'id')");
    expect(runtimeV2).not.toContain("'correctOrder', qt.content");
    expect(runtimeV2).not.toContain("'content', qt.content");
  });

  it("scores Sequence all-or-nothing and rejects malformed ordered IDs", () => {
    const scoring = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.score_public_runtime_quest"),
      migration.indexOf("ALTER FUNCTION public.score_public_runtime_quest")
    );
    expect(scoring).toContain("'orderedItemIds'");
    expect(scoring).toContain("task_type='sequence' AND a.ordered_item_ids IS NULL THEN 'unanswered'");
    expect(scoring).toContain("FULL JOIN pg_catalog.jsonb_array_elements(t.content->'correctOrder')");
    expect(scoring).toContain("THEN 'correct'");
    expect(scoring).toContain("WHEN t.task_type='sequence' THEN 'incorrect'");
    expect(hasBalancedSqlParentheses(scoring)).toBe(true);

    const invalidScoring = scoring.replace(
      "a.ordered_item_ids_safe)x(value)))) ))\n      )",
      "a.ordered_item_ids_safe)x(value)))) )\n      )"
    );
    expect(invalidScoring).not.toBe(scoring);
    expect(hasBalancedSqlParentheses(invalidScoring)).toBe(false);
  });

  it("has balanced parentheses in every M050-created or replaced function body", () => {
    for (const name of [
      "qwestum_private.is_valid_sequence_task_content",
      "qwestum_private.public_task_image_url",
      "public.create_owned_quest_task",
      "public.update_owned_quest_task_content_v2",
      "public.is_public_runtime_eligible",
      "public.get_public_runtime_quest",
      "public.get_public_runtime_quest_v2",
      "public.score_public_runtime_quest",
      "public.submit_student_quest_attempt",
    ]) {
      expect(hasBalancedSqlParentheses(extractFunctionBody(migration, name))).toBe(true);
    }
  });

  it("preserves M044 submit identity, idempotency, quest-title, and sanitized snapshot boundaries", () => {
    const submit = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.submit_student_quest_attempt"),
      migration.indexOf("ALTER FUNCTION public.submit_student_quest_attempt")
    );

    expect(submit).toContain("qwestum_private.current_actor_is_student()");
    expect(submit).toContain("FOR SHARE");
    expect(submit).toContain("FOR UPDATE");
    expect(submit).toContain("IF v_attempt.status='submitted'");
    expect(submit).toContain("SELECT q.title INTO v_quest_title");
    expect(submit).toContain("SELECT r.tasks INTO v_runtime_tasks");
    expect(submit).toContain("WHEN 'sequence' THEN pg_catalog.jsonb_build_object('orderedItemIds'");
    expect(submit).not.toContain("'correctOrder', r.value");
    expect(submit).not.toContain("'content', r.value");
    expect(submit).not.toContain("qt.content AS task_snapshot");
  });
});
