import type { PublicRuntimeResult } from "@/types/public-runtime";

export type StudentAttemptStart = {
  attemptId: string;
  questId: string;
  status: "started";
  startedAt: string;
};

export type StudentAttemptSubmission = {
  attemptId: string;
  result: PublicRuntimeResult;
};
