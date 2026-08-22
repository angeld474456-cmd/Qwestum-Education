import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const homepage = readFileSync(resolve(root, "app/page.tsx"), "utf8");
const header = readFileSync(resolve(root, "components/layout/Header.tsx"), "utf8");
const hero = readFileSync(resolve(root, "components/home/Hero.tsx"), "utf8");
const features = readFileSync(resolve(root, "components/home/Features.tsx"), "utf8");
const metadata = readFileSync(resolve(root, "app/layout.tsx"), "utf8");

describe("beta public homepage contract", () => {
  it("renders the existing homepage sections", () => {
    expect(homepage).toContain("<Header />");
    expect(homepage).toContain("<Hero />");
    expect(homepage).toContain("<Statistics />");
    expect(homepage).toContain("<Features />");
  });

  it("links public entry points to the real catalog and login routes", () => {
    expect(header).toContain('href="/catalog"');
    expect(header).toContain('href="/login"');
    expect(hero).toContain('href="/catalog"');
    expect(hero).toContain('href="/login"');
    expect(header).toContain('href="/#how-it-works"');
    expect(features).toContain('id="how-it-works"');
    expect(header).toContain('href: "/catalog?subject=История%20Казахстана"');
    expect(header).toContain('href: "/catalog?subject=Математика"');
    expect(header).toContain('href: "/catalog?subject=Английский%20язык"');
    expect(header).toContain("href={subject.href}");
  });

  it("uses Russian product copy without unsupported AI marketing claims", () => {
    expect(hero).toContain("Учёба превращается в квест");
    expect(hero).toContain("Создавайте интерактивные квесты для уроков или выбирайте готовые.");
    expect(hero).not.toMatch(/\bAI\b|искусственн(?:ый|ого) интеллект/i);
    expect(metadata).toContain("интерактивные учебные квесты");
  });
});
