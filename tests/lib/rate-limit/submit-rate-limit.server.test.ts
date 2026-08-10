import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  checkPublicSubmitRateLimit,
  createConfiguredSubmitRateLimiter,
  createSubmitRateLimiter,
  deriveSubmitRateLimitKey,
} from "@/lib/rate-limit/submit-rate-limit.server";

const clientIdentity = "203.0.113.7";
const questId = "123e4567-e89b-12d3-a456-426614174000";

function checkResult(success: boolean, reset = 5_000, reason?: string) {
  return { success, reset, reason };
}

describe("public submit rate limiter", () => {
  it("derives deterministic opaque keys with distinct scopes and quest inputs", () => {
    const secret = "test-secret";
    const clientKey = deriveSubmitRateLimitKey({
      secret,
      scope: "client",
      clientIdentity,
    });
    const repeatedClientKey = deriveSubmitRateLimitKey({
      secret,
      scope: "client",
      clientIdentity,
    });
    const questKey = deriveSubmitRateLimitKey({
      secret,
      scope: "client-quest",
      clientIdentity,
      questId,
    });

    expect(clientKey).toBe(repeatedClientKey);
    expect(clientKey).not.toBe(questKey);
    expect(clientKey).not.toContain(clientIdentity);
    expect(questKey).not.toContain(clientIdentity);
    expect(questKey).not.toContain(questId);
    expect(clientKey).toMatch(/^v1:public-submit:client:[0-9a-f]{32}$/);
  });

  it("allows independent client and quest keys", async () => {
    const clientKeys: string[] = [];
    const questKeys: string[] = [];
    const limiter = createSubmitRateLimiter({
      secret: "test-secret",
      perClient: { limit: vi.fn(async (key: string) => {
        clientKeys.push(key);
        return checkResult(true);
      }) },
      perClientQuest: { limit: vi.fn(async (key: string) => {
        questKeys.push(key);
        return checkResult(true);
      }) },
    });

    await expect(limiter.check({ clientIdentity, questId })).resolves.toEqual({
      status: "allowed",
    });
    await limiter.check({ clientIdentity: "198.51.100.2", questId });
    await limiter.check({
      clientIdentity,
      questId: "123e4567-e89b-12d3-a456-426614174001",
    });

    expect(clientKeys[0]).toBe(clientKeys[2]);
    expect(clientKeys[0]).not.toBe(clientKeys[1]);
    expect(questKeys).toHaveLength(3);
    expect(new Set(questKeys).size).toBe(3);
  });

  it("uses the larger retry delay when either limit rejects", async () => {
    const limiter = createSubmitRateLimiter({
      secret: "test-secret",
      perClient: { limit: vi.fn().mockResolvedValue(checkResult(false, 2_100)) },
      perClientQuest: {
        limit: vi.fn().mockResolvedValue(checkResult(false, 5_100)),
      },
      now: () => 0,
    });

    await expect(limiter.check({ clientIdentity, questId })).resolves.toEqual({
      status: "limited",
      retryAfterSeconds: 6,
    });
  });

  it("fails closed for provider errors and timeout responses", async () => {
    const providerFailure = createSubmitRateLimiter({
      secret: "test-secret",
      perClient: { limit: vi.fn().mockRejectedValue(new Error("provider failure")) },
      perClientQuest: { limit: vi.fn().mockResolvedValue(checkResult(true)) },
    });
    const timeout = createSubmitRateLimiter({
      secret: "test-secret",
      perClient: { limit: vi.fn().mockResolvedValue(checkResult(true, 5_000, "timeout")) },
      perClientQuest: { limit: vi.fn().mockResolvedValue(checkResult(true)) },
    });

    await expect(providerFailure.check({ clientIdentity, questId })).resolves.toEqual({
      status: "unavailable",
    });
    await expect(timeout.check({ clientIdentity, questId })).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("fails closed for missing configuration and missing client identity", async () => {
    expect(createConfiguredSubmitRateLimiter({})).toBeNull();
    expect(
      createConfiguredSubmitRateLimiter({
        redisUrl: " ",
        redisToken: "token",
        hmacSecret: "secret",
      })
    ).toBeNull();
    expect(
      createConfiguredSubmitRateLimiter({
        redisUrl: "not a URL",
        redisToken: "token",
        hmacSecret: "secret",
      })
    ).toBeNull();

    const result = await checkPublicSubmitRateLimit(
      new Request("https://app.example/api/public/quests/id/submit"),
      questId
    );

    expect(result).toEqual({ status: "unavailable" });
  });
});
