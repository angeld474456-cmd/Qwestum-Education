import "server-only";

import { createHmac } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { getTrustedClientIdentity } from "@/lib/rate-limit/client-identity.server";

const limiterVersion = "v1";
const limiterTimeoutMilliseconds = 250;

type SubmitRateLimitScope = "client" | "client-quest";

type RatelimitCheckResult = {
  success: boolean;
  reset: number;
  reason?: string;
};

type RatelimitCheck = {
  limit(identifier: string): Promise<RatelimitCheckResult>;
};

export type SubmitRateLimitResult =
  | { status: "allowed" }
  | { status: "limited"; retryAfterSeconds: number }
  | { status: "unavailable" };

export type SubmitRateLimiter = {
  check(input: {
    clientIdentity: string;
    questId: string;
  }): Promise<SubmitRateLimitResult>;
};

type SubmitRateLimitEnvironment = {
  redisUrl?: string;
  redisToken?: string;
  hmacSecret?: string;
};

function retryAfterSeconds(reset: number, now: number) {
  if (!Number.isFinite(reset)) return 1;

  return Math.max(1, Math.ceil((reset - now) / 1000));
}

function isUnavailableResult(result: RatelimitCheckResult) {
  return result.reason === "timeout" || !Number.isFinite(result.reset);
}

export function deriveSubmitRateLimitKey(input: {
  secret: string;
  scope: SubmitRateLimitScope;
  clientIdentity: string;
  questId?: string;
}) {
  const message = [
    limiterVersion,
    "public-submit",
    input.scope,
    input.clientIdentity,
    input.questId ?? "",
  ].join("\u0000");
  const digest = createHmac("sha256", input.secret)
    .update(message)
    .digest("hex")
    .slice(0, 32);

  return `${limiterVersion}:public-submit:${input.scope}:${digest}`;
}

export function createSubmitRateLimiter(input: {
  secret: string;
  perClient: RatelimitCheck;
  perClientQuest: RatelimitCheck;
  now?: () => number;
}): SubmitRateLimiter {
  const now = input.now ?? Date.now;

  return {
    async check({ clientIdentity, questId }) {
      const clientKey = deriveSubmitRateLimitKey({
        secret: input.secret,
        scope: "client",
        clientIdentity,
      });
      const clientQuestKey = deriveSubmitRateLimitKey({
        secret: input.secret,
        scope: "client-quest",
        clientIdentity,
        questId,
      });

      try {
        const [clientResult, clientQuestResult] = await Promise.all([
          input.perClient.limit(clientKey),
          input.perClientQuest.limit(clientQuestKey),
        ]);

        if (
          isUnavailableResult(clientResult) ||
          isUnavailableResult(clientQuestResult)
        ) {
          return { status: "unavailable" };
        }

        if (!clientResult.success || !clientQuestResult.success) {
          const currentTime = now();

          return {
            status: "limited",
            retryAfterSeconds: Math.max(
              retryAfterSeconds(clientResult.reset, currentTime),
              retryAfterSeconds(clientQuestResult.reset, currentTime)
            ),
          };
        }

        return { status: "allowed" };
      } catch {
        return { status: "unavailable" };
      }
    },
  };
}

function getEnvironment(): SubmitRateLimitEnvironment {
  return {
    redisUrl: process.env.UPSTASH_REDIS_REST_URL,
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    hmacSecret: process.env.RATE_LIMIT_HMAC_SECRET,
  };
}

export function createConfiguredSubmitRateLimiter(
  environment = getEnvironment()
): SubmitRateLimiter | null {
  if (
    !environment.redisUrl ||
    !environment.redisToken ||
    !environment.hmacSecret ||
    !environment.redisUrl.trim() ||
    !environment.redisToken.trim() ||
    !environment.hmacSecret.trim()
  ) {
    return null;
  }

  try {
    const redis = new Redis({
      url: environment.redisUrl,
      token: environment.redisToken,
    });

    return createSubmitRateLimiter({
      secret: environment.hmacSecret,
      perClient: new Ratelimit({
        redis,
        limiter: Ratelimit.tokenBucket(60, "60 s", 75),
        prefix: "questum:rate-limit:submit:client",
        analytics: false,
        ephemeralCache: false,
        timeout: limiterTimeoutMilliseconds,
      }),
      perClientQuest: new Ratelimit({
        redis,
        limiter: Ratelimit.tokenBucket(45, "60 s", 60),
        prefix: "questum:rate-limit:submit:client-quest",
        analytics: false,
        ephemeralCache: false,
        timeout: limiterTimeoutMilliseconds,
      }),
    });
  } catch {
    return null;
  }
}

let configuredLimiter: SubmitRateLimiter | null | undefined;

function getConfiguredLimiter() {
  if (configuredLimiter === undefined) {
    configuredLimiter = createConfiguredSubmitRateLimiter();
  }

  return configuredLimiter;
}

function isPresent(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function logPreviewUnavailable(input: {
  reason:
    | "missing-client-identity"
    | "limiter-not-configured"
    | "limiter-runtime-unavailable";
  request: Request;
  clientIdentityResolved: boolean;
  limiterConfigured: boolean;
}) {
  if (process.env.VERCEL_ENV !== "preview") return;

  const forwardedFor = input.request.headers.get("x-forwarded-for");
  const environment = getEnvironment();

  console.warn("[public-submit-rate-limit-unavailable]", {
    event: "public-submit-rate-limit-unavailable",
    reason: input.reason,
    headerPresent: forwardedFor !== null,
    containsComma: forwardedFor?.includes(",") ?? false,
    clientIdentityResolved: input.clientIdentityResolved,
    redisUrlPresent: isPresent(environment.redisUrl),
    redisTokenPresent: isPresent(environment.redisToken),
    hmacSecretPresent: isPresent(environment.hmacSecret),
    limiterConfigured: input.limiterConfigured,
  });
}

export async function checkPublicSubmitRateLimit(
  request: Request,
  questId: string
): Promise<SubmitRateLimitResult> {
  const clientIdentity = getTrustedClientIdentity(request);
  const limiter = getConfiguredLimiter();

  if (!clientIdentity || !limiter) {
    logPreviewUnavailable({
      reason: !clientIdentity
        ? "missing-client-identity"
        : "limiter-not-configured",
      request,
      clientIdentityResolved: Boolean(clientIdentity),
      limiterConfigured: Boolean(limiter),
    });
    return { status: "unavailable" };
  }

  const result = await limiter.check({ clientIdentity, questId });

  if (result.status === "unavailable") {
    logPreviewUnavailable({
      reason: "limiter-runtime-unavailable",
      request,
      clientIdentityResolved: true,
      limiterConfigured: true,
    });
  }

  return result;
}
