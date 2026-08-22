import { describe, expect, it } from "vitest";

import {
  getActorHome,
  getLoginRedirect,
  getProtectedAreaRedirect,
} from "@/services/actor-routing";

const teacher = {
  status: "authenticated" as const,
  actor: { id: "teacher", email: "teacher@example.test", role: "teacher" as const },
};
const student = {
  status: "authenticated" as const,
  actor: { id: "student", email: "student@example.test", role: "student" as const },
};

describe("actor routing", () => {
  it("routes protected areas by actor role", () => {
    expect(getProtectedAreaRedirect({ status: "unauthenticated" }, "dashboard")).toBe("/login");
    expect(getProtectedAreaRedirect({ status: "unauthenticated" }, "learn")).toBe("/login");
    expect(getProtectedAreaRedirect(teacher, "dashboard")).toBeNull();
    expect(getProtectedAreaRedirect(teacher, "learn")).toBe("/dashboard");
    expect(getProtectedAreaRedirect(student, "dashboard")).toBe("/learn");
    expect(getProtectedAreaRedirect(student, "learn")).toBeNull();
  });

  it("fails closed for profile-unavailable authenticated accounts", () => {
    expect(getProtectedAreaRedirect({ status: "profile_unavailable" }, "dashboard")).toBe("/account-unavailable");
    expect(getProtectedAreaRedirect({ status: "profile_unavailable" }, "learn")).toBe("/account-unavailable");
    expect(getLoginRedirect({ status: "profile_unavailable" })).toBe("/account-unavailable");
  });

  it("uses the correct role home for login and callback fallbacks", () => {
    expect(getLoginRedirect({ status: "unauthenticated" })).toBeNull();
    expect(getLoginRedirect(teacher)).toBe("/dashboard");
    expect(getLoginRedirect(student)).toBe("/learn");
    expect(getActorHome(teacher)).toBe("/dashboard");
    expect(getActorHome(student)).toBe("/learn");
  });
});
