import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "database/migrations/047_enforce_storage_authoring_entitlement.sql"
  ),
  "utf8"
);

const policyNames = [
  "Teachers can upload own quest images",
  "Teachers can delete own quest images",
  "Teachers can upload own quest covers",
  "Teachers can delete own quest covers",
];

const coverPathRegex =
  "/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$";

type PolicyCommand = "a" | "d";

type PredecessorPolicyContract = {
  name: string;
  command: PolicyCommand;
  predicateSlot: "polqual" | "polwithcheck";
  predicate: string;
  requiresCoverRegex: boolean;
};

const preflight = migration.slice(
  migration.indexOf("DO $$"),
  migration.indexOf("CREATE FUNCTION public.current_actor_can_author_storage()")
);

function extractTaggedPredicate(tag: string) {
  const match = migration.match(
    new RegExp(`\\$${tag}\\$([\\s\\S]*?)\\$${tag}\\$`)
  );

  if (!match) {
    throw new Error(`Missing ${tag} predecessor predicate in M047.`);
  }

  return match[1];
}

function normalizePredecessorPredicate(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s()]/g, "")
    .replaceAll("::text", "");
}

function extractPreflightBranch(policyName: string, exception: string) {
  const start = preflight.indexOf(`p.polname = '${policyName}'`);
  const end = preflight.indexOf(`RAISE EXCEPTION '${exception}'`, start);

  if (start === -1 || end === -1) {
    throw new Error(`Missing ${policyName} preflight branch in M047.`);
  }

  return preflight.slice(start, end);
}

const predecessorContracts: readonly PredecessorPolicyContract[] = [
  {
    name: "Teachers can upload own quest images",
    command: "a",
    predicateSlot: "polwithcheck",
    predicate: extractTaggedPredicate("task_insert"),
    requiresCoverRegex: false,
  },
  {
    name: "Teachers can delete own quest images",
    command: "d",
    predicateSlot: "polqual",
    predicate: extractTaggedPredicate("task_delete"),
    requiresCoverRegex: false,
  },
  {
    name: "Teachers can upload own quest covers",
    command: "a",
    predicateSlot: "polwithcheck",
    predicate: extractTaggedPredicate("cover_insert"),
    requiresCoverRegex: true,
  },
  {
    name: "Teachers can delete own quest covers",
    command: "d",
    predicateSlot: "polqual",
    predicate: extractTaggedPredicate("cover_delete"),
    requiresCoverRegex: true,
  },
];

function matchesM047PreflightContract(
  contract: PredecessorPolicyContract,
  actual: {
    command: PolicyCommand;
    roleOids: readonly string[];
    polqual: string | null;
    polwithcheck: string | null;
  }
) {
  const expectedPredicate = normalizePredecessorPredicate(contract.predicate);
  const actualPredicate = actual[contract.predicateSlot];
  const otherPredicateSlot =
    contract.predicateSlot === "polqual" ? actual.polwithcheck : actual.polqual;

  return (
    actual.command === contract.command &&
    actual.roleOids.length === 1 &&
    actual.roleOids[0] === "authenticated" &&
    otherPredicateSlot === null &&
    actualPredicate !== null &&
    normalizePredecessorPredicate(actualPredicate) === expectedPredicate &&
    (!contract.requiresCoverRegex ||
      actualPredicate.includes(
        "/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$"
      ))
  );
}

describe("M047 storage authoring entitlement enforcement contract", () => {
  it("is transactional and completes preflight before any policy or function mutation", () => {
    const beginIndex = migration.indexOf("BEGIN;");
    const preflightIndex = migration.indexOf("DO $$");
    const functionIndex = migration.indexOf(
      "CREATE FUNCTION public.current_actor_can_author_storage()"
    );
    const firstPolicyDropIndex = migration.indexOf("DROP POLICY");
    const commitIndex = migration.lastIndexOf("COMMIT;");

    expect(beginIndex).toBeGreaterThan(-1);
    expect(beginIndex).toBeLessThan(preflightIndex);
    expect(preflightIndex).toBeLessThan(functionIndex);
    expect(preflightIndex).toBeLessThan(firstPolicyDropIndex);
    expect(migration.slice(commitIndex).trim()).toBe("COMMIT;");
  });

  it("fails closed on the Storage, M046, wrapper, and exact predecessor-policy prerequisites", () => {
    expect(migration).toContain("pg_catalog.to_regclass('storage.objects')");
    expect(migration).toContain("M046 current authoring predicate is required before applying M047");
    expect(migration).toContain("pg_catalog.to_regprocedure('qwestum_private.current_actor_can_author()')");
    expect(migration).toContain("public.current_actor_can_author_storage already exists; inspect before applying M047");
    expect(migration).toContain("p.polroles = ARRAY[v_authenticated_role]::oid[]");
    expect(migration).toContain("p.polcmd = 'a'");
    expect(migration).toContain("p.polcmd = 'd'");
    expect(migration).toContain("p.polqual IS NULL");
    expect(migration).toContain("p.polwithcheck IS NULL");
    expect(migration).toContain("pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid)");
    expect(migration).toContain("pg_catalog.pg_get_expr(p.polqual, p.polrelid)");
    expect(migration).not.toContain("LIKE '%bucket_id");
    expect(migration).toContain("task-image INSERT policy has an unexpected predecessor definition; inspect before applying M047");
    expect(migration).toContain("task-image DELETE policy has an unexpected predecessor definition; inspect before applying M047");
    expect(migration).toContain("cover INSERT policy has an unexpected predecessor definition; inspect before applying M047");
    expect(migration).toContain("cover DELETE policy has an unexpected predecessor definition; inspect before applying M047");

    for (const policyName of policyNames) {
      expect(migration).toContain(`p.polname = '${policyName}'`);
    }
  });

  it("uses an unambiguous SQL literal for the exact cover regex and keeps every dollar quote balanced", () => {
    const exactCoverRegexLiteral = `'${coverPathRegex}'`;
    const dollarQuoteTags = migration.match(/\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/g) ?? [];
    const tagCounts = new Map<string, number>();

    for (const tag of dollarQuoteTags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }

    expect(preflight.split(exactCoverRegexLiteral)).toHaveLength(5);
    expect(preflight).toContain(
      `AND position(\n        ${exactCoverRegexLiteral}\n        IN pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid)`
    );
    expect(preflight).toContain(
      `AND position(\n        ${exactCoverRegexLiteral}\n        IN pg_catalog.pg_get_expr(p.polqual, p.polrelid)`
    );
    expect(migration).not.toContain("$cover_regex$");
    expect(migration).not.toContain("$$cover_regex$");

    for (const count of tagCounts.values()) {
      expect(count % 2).toBe(0);
    }
  });

  it("creates a narrow authenticated Storage RLS predicate wrapper", () => {
    const wrapper = migration.slice(
      migration.indexOf("CREATE FUNCTION public.current_actor_can_author_storage()"),
      migration.indexOf("ALTER FUNCTION public.current_actor_can_author_storage()")
    );

    expect(wrapper).toContain("RETURNS boolean");
    expect(wrapper).toContain("SECURITY DEFINER");
    expect(wrapper).toContain("SET search_path = pg_catalog, public");
    expect(wrapper).toContain("SELECT qwestum_private.current_actor_can_author();");
    expect(wrapper).not.toContain("p_user_id");
    expect(wrapper).not.toContain("raw_user_meta_data");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.current_actor_can_author_storage() FROM PUBLIC");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.current_actor_can_author_storage() FROM anon");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.current_actor_can_author_storage() FROM authenticated");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.current_actor_can_author_storage() FROM service_role");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.current_actor_can_author_storage() TO authenticated");
  });

  it("replaces exactly the four existing INSERT and DELETE authoring-media policies", () => {
    for (const policyName of policyNames) {
      expect(migration).toContain(`DROP POLICY "${policyName}" ON storage.objects`);
      expect(migration).toContain(`CREATE POLICY "${policyName}"`);
    }

    expect(migration).not.toContain("FOR UPDATE");
    expect(migration).not.toContain("FOR SELECT");
    expect(migration).not.toContain("storage.buckets");
  });

  it("preserves each predecessor owner/path predicate and appends authoring access", () => {
    expect(migration).toContain("(storage.foldername(name))[5] = 'tasks'");
    expect(migration).toContain("(storage.foldername(name))[5] = 'cover'");
    expect(migration).toContain("(storage.foldername(name))[4] <> ''");
    expect(migration).toContain("(storage.foldername(name))[6] IS NULL");
    expect(migration).toContain("[.](jpg|png|webp)$'");
    expect(migration).toContain("(storage.foldername(name))[2] = auth.uid()::text");

    const replacements = migration.slice(migration.indexOf("DROP POLICY"));
    expect(replacements.match(/public\.current_actor_can_author_storage\(\)/g)).toHaveLength(4);
  });

  it("uses complete canonical predecessor predicates in strict normalized equality branches", () => {
    for (const contract of predecessorContracts) {
      const exception = contract.name.includes("quest images")
        ? `task-image ${contract.command === "a" ? "INSERT" : "DELETE"} policy has an unexpected predecessor definition; inspect before applying M047`
        : `cover ${contract.command === "a" ? "INSERT" : "DELETE"} policy has an unexpected predecessor definition; inspect before applying M047`;
      const branch = extractPreflightBranch(contract.name, exception);
      const tag = contract.name.includes("quest images")
        ? contract.command === "a"
          ? "task_insert"
          : "task_delete"
        : contract.command === "a"
          ? "cover_insert"
          : "cover_delete";

      expect(branch).toContain(`p.polcmd = '${contract.command}'`);
      expect(branch).toContain("p.polroles = ARRAY[v_authenticated_role]::oid[]");
      expect(branch).toContain(
        contract.predicateSlot === "polqual"
          ? "p.polwithcheck IS NULL"
          : "p.polqual IS NULL"
      );
      expect(branch).toContain(
        `pg_catalog.pg_get_expr(p.${contract.predicateSlot}, p.polrelid)`
      );
      expect(branch).toContain(`$${tag}$`);
      expect(branch).toContain("= lower(regexp_replace(regexp_replace(");
      expect(normalizePredecessorPredicate(contract.predicate)).toContain(
        "bucket_id='quest-images'"
      );
      expect(normalizePredecessorPredicate(contract.predicate)).toContain(
        "storage.foldernamename[1]='teachers'"
      );
      expect(normalizePredecessorPredicate(contract.predicate)).toContain(
        "storage.foldernamename[2]=auth.uid"
      );
      expect(normalizePredecessorPredicate(contract.predicate)).toContain(
        "storage.foldernamename[3]='quests'"
      );
    }

    const [taskInsert, taskDelete, coverInsert, coverDelete] = predecessorContracts;
    expect(normalizePredecessorPredicate(taskInsert.predicate)).toContain(
      "storage.foldernamename[5]='tasks'"
    );
    expect(normalizePredecessorPredicate(taskDelete.predicate)).toContain(
      "storage.foldernamename[5]='tasks'"
    );
    expect(taskInsert.predicate).not.toContain("name ~");
    expect(taskDelete.predicate).not.toContain("name ~");

    for (const coverContract of [coverInsert, coverDelete]) {
      const normalized = normalizePredecessorPredicate(coverContract.predicate);
      expect(normalized).toContain("storage.foldernamename[4]<>''");
      expect(normalized).toContain("storage.foldernamename[5]='cover'");
      expect(normalized).toContain("storage.foldernamename[6]isnull");
      expect(coverContract.predicate).toContain(coverPathRegex);
    }
  });

  it("rejects real predecessor-contract mutations through the same command, role, slot, equality, and cover-regex checks", () => {
    for (const contract of predecessorContracts) {
      const validPolicy = {
        command: contract.command,
        roleOids: ["authenticated"],
        polqual: contract.predicateSlot === "polqual" ? contract.predicate : null,
        polwithcheck:
          contract.predicateSlot === "polwithcheck" ? contract.predicate : null,
      };

      expect(matchesM047PreflightContract(contract, validPolicy)).toBe(true);
      expect(
        matchesM047PreflightContract(contract, {
          ...validPolicy,
          command: contract.command === "a" ? "d" : "a",
        })
      ).toBe(false);
      expect(
        matchesM047PreflightContract(contract, { ...validPolicy, roleOids: ["anon"] })
      ).toBe(false);
      expect(
        matchesM047PreflightContract(contract, {
          ...validPolicy,
          roleOids: ["authenticated", "service_role"],
        })
      ).toBe(false);
      expect(
        matchesM047PreflightContract(contract, { ...validPolicy, roleOids: [] })
      ).toBe(false);
      expect(
        matchesM047PreflightContract(contract, {
          ...validPolicy,
          polqual: validPolicy.polwithcheck,
          polwithcheck: validPolicy.polqual,
        })
      ).toBe(false);
      expect(
        matchesM047PreflightContract(contract, {
          ...validPolicy,
          [contract.predicateSlot]: `${contract.predicate} AND unexpected_extra_condition`,
        })
      ).toBe(false);
    }

    const taskInsert = predecessorContracts[0];
    expect(
      matchesM047PreflightContract(taskInsert, {
        command: "a",
        roleOids: ["authenticated"],
        polqual: null,
        polwithcheck: taskInsert.predicate.replace("[5] = 'tasks'", "[5] = 'other'"),
      })
    ).toBe(false);

    const coverInsert = predecessorContracts[2];
    const validCover = {
      command: "a" as const,
      roleOids: ["authenticated"],
      polqual: null,
      polwithcheck: coverInsert.predicate,
    };
    expect(
      matchesM047PreflightContract(coverInsert, {
        ...validCover,
        polwithcheck: coverInsert.predicate.replace("[4] <> ''", "[4] = ''"),
      })
    ).toBe(false);
    expect(
      matchesM047PreflightContract(coverInsert, {
        ...validCover,
        polwithcheck: coverInsert.predicate.replace("jpg|png|webp", "jpg|png|gif"),
      })
    ).toBe(false);
    expect(
      matchesM047PreflightContract(coverInsert, {
        ...validCover,
        polwithcheck: "name ~ '^teachers/'",
      })
    ).toBe(false);
  });

  it("does not change unrelated commercial, identity, runtime, or media state", () => {
    expect(migration).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    expect(migration).not.toContain("INSERT INTO public.teacher_entitlements");
    expect(migration).not.toContain("UPDATE public.teacher_entitlements");
    expect(migration).not.toContain("DELETE FROM public.teacher_entitlements");
    expect(migration).not.toContain("ALTER TABLE public.profiles");
    expect(migration).not.toContain("CREATE OR REPLACE FUNCTION qwestum_private.current_actor_can_author");
    expect(migration).not.toContain("enforce_teacher_authoring_mutation");
    expect(migration).not.toContain("score_public_runtime_quest");
    expect(migration).not.toContain("start_student_quest_attempt");
    expect(migration).not.toContain("submit_student_quest_attempt");
  });
});
