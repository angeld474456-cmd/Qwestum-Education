import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const appDirectory = join(process.cwd(), "app");
const debugDirectories = [
  "test",
  "debug",
  "dev",
  "diagnostics",
  "playground",
  "sandbox",
  "inspect",
  "health",
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) return sourceFiles(entryPath);
    if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) return [];

    return [entryPath];
  });
}

describe("anonymous application surfaces", () => {
  it("does not retain a public debug route", () => {
    for (const directory of debugDirectories) {
      const directoryPath = join(appDirectory, directory);

      expect(existsSync(join(directoryPath, "page.tsx"))).toBe(false);
      expect(existsSync(join(directoryPath, "route.ts"))).toBe(false);
    }
  });

  it("does not serialize direct table rows or raw errors from public surfaces", () => {
    const publicSource = [
      ...sourceFiles(join(appDirectory, "catalog")),
      ...sourceFiles(join(appDirectory, "api", "public")),
    ]
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(publicSource).not.toContain('select("*")');
    expect(publicSource).not.toMatch(/JSON\.stringify\(\s*(data|error)\b/);
  });
});
