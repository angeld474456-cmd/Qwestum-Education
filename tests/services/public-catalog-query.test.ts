import { describe, expect, it } from "vitest";

import { parsePublicCatalogQuery } from "@/services/public-catalog-query";

describe("public catalog query parsing", () => {
  it("parses the supported catalog query parameters", () => {
    expect(
      parsePublicCatalogQuery({
        search: "  Silk   Road ",
        subject: " History ",
        grade: "6",
        difficulty: "2",
        offset: "24",
      })
    ).toEqual({
      search: "Silk Road",
      subject: "History",
      grade: 6,
      difficulty: 2,
      offset: 24,
    });
  });

  it.each(["-1", "1.5", "not-a-number", ""]) (
    "falls back safely for an invalid learner offset %s",
    (offset) => {
      expect(parsePublicCatalogQuery({ offset })).toMatchObject({ offset: 0 });
    }
  );

  it("caps a valid offset at the catalog pagination maximum", () => {
    expect(parsePublicCatalogQuery({ offset: "999999" })).toMatchObject({
      offset: 10_000,
    });
  });
});
