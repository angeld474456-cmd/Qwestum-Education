export type TeacherQuestAttemptSummary = {
  attemptId: string;
  studentDisplayName: string;
  submittedAt: string;
  earnedPoints: number;
  possiblePoints: number;
  percentage: number | null;
};
