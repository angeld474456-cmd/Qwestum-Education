import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createClient: vi.fn(),
  from: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { getTeacherSubjects } from "@/services/subject.server";

type Subject = { id: string; name: string; grade: number | null };

const legacyGenericLiteratureId = "12a38e01-8e61-45e9-a6b4-bd00a6b76cd9";

function createQuery(result: { data: Subject[] | null; error: unknown }) {
  const query = {
    select: vi.fn(),
    is: vi.fn(),
    neq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    then: (onfulfilled: (value: typeof result) => unknown, onrejected: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onfulfilled, onrejected),
  };

  query.select.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.neq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);

  return query;
}

function configure(
  canonicalSubjects: Subject[],
  includedSubjects: Subject[] = []
) {
  const canonicalQuery = createQuery({ data: canonicalSubjects, error: null });
  const includedQuery = createQuery({ data: includedSubjects, error: null });

  mocks.auth.mockResolvedValue({ data: { user: { id: "teacher-id" } } });
  mocks.from.mockReturnValueOnce(canonicalQuery).mockReturnValueOnce(includedQuery);
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.auth },
    from: mocks.from,
  });

  return { canonicalQuery, includedQuery };
}

describe("getTeacherSubjects", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns canonical grade-null subjects while excluding legacy generic Literature", async () => {
    const canonical = { id: "canonical", name: "Алгебра", grade: null };
    const { canonicalQuery } = configure([canonical]);

    await expect(getTeacherSubjects()).resolves.toEqual([canonical]);
    expect(canonicalQuery.is).toHaveBeenCalledWith("grade", null);
    expect(canonicalQuery.neq).toHaveBeenCalledWith(
      "id",
      legacyGenericLiteratureId
    );
    expect(mocks.from).toHaveBeenCalledOnce();
  });

  it("includes legacy generic Literature only when explicitly requested", async () => {
    const kazakhLiterature = {
      id: "kazakh-literature",
      name: "Казахская литература",
      grade: null,
    };
    const russianLiterature = {
      id: "russian-literature",
      name: "Русская литература",
      grade: null,
    };
    const legacyGenericLiterature = {
      id: legacyGenericLiteratureId,
      name: "Литература",
      grade: null,
    };
    const { canonicalQuery, includedQuery } = configure(
      [kazakhLiterature, russianLiterature],
      [legacyGenericLiterature]
    );

    await expect(
      getTeacherSubjects({ includeSubjectIds: [legacyGenericLiteratureId] })
    ).resolves.toEqual([
      kazakhLiterature,
      legacyGenericLiterature,
      russianLiterature,
    ]);
    expect(canonicalQuery.neq).toHaveBeenCalledWith(
      "id",
      legacyGenericLiteratureId
    );
    expect(includedQuery.in).toHaveBeenCalledWith("id", [legacyGenericLiteratureId]);
    expect(includedQuery.neq).not.toHaveBeenCalled();
  });

  it("keeps normal grade-specific legacy inclusion available", async () => {
    const canonical = { id: "canonical", name: "Алгебра", grade: null };
    const legacy = { id: "legacy", name: "Алгебра", grade: 7 };
    const { includedQuery } = configure([canonical], [legacy]);

    await expect(
      getTeacherSubjects({ includeSubjectIds: [legacy.id] })
    ).resolves.toEqual([canonical, legacy]);
    expect(includedQuery.in).toHaveBeenCalledWith("id", [legacy.id]);
    expect(includedQuery.neq).not.toHaveBeenCalled();
  });

  it("deduplicates included canonical subjects by ID", async () => {
    const canonical = { id: "canonical", name: "Алгебра", grade: null };
    configure([canonical], [canonical]);

    await expect(
      getTeacherSubjects({ includeSubjectIds: [canonical.id] })
    ).resolves.toEqual([canonical]);
  });

  it("sorts the merged lookup by name, grade with null first, then ID", async () => {
    const canonicalZ = { id: "z", name: "Язык", grade: null };
    const canonicalA = { id: "b", name: "Алгебра", grade: null };
    const legacyA = { id: "a", name: "Алгебра", grade: 6 };
    configure([canonicalZ, canonicalA], [legacyA]);

    await expect(
      getTeacherSubjects({ includeSubjectIds: [legacyA.id] })
    ).resolves.toEqual([canonicalA, legacyA, canonicalZ]);
  });

  it.each([undefined, []] as const)(
    "treats %j include IDs as canonical-only lookup",
    async (includeSubjectIds) => {
      const canonical = { id: "canonical", name: "Алгебра", grade: null };
      configure([canonical]);

      await expect(getTeacherSubjects({ includeSubjectIds })).resolves.toEqual([
        canonical,
      ]);
      expect(mocks.from).toHaveBeenCalledOnce();
    }
  );
});
