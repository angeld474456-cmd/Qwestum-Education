import type {
  PublicRuntimeSingleChoiceOption,
  PublicRuntimeTaskStatus,
} from "@/types/public-runtime";

export type StudentAttemptHistoryItem = {
  attemptId: string;
  questId: string;
  questTitle: string;
  earnedPoints: number;
  possiblePoints: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  notScoredCount: number;
  startedAt: string;
  submittedAt: string;
};

type StudentAttemptHistoryTaskBase = {
  sourceTaskId: string;
  taskOrder: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: PublicRuntimeTaskStatus;
  earnedPoints: number;
  possiblePoints: number;
};

export type StudentAttemptHistoryTextTask = StudentAttemptHistoryTaskBase & {
  taskType: "text";
};

export type StudentAttemptHistorySingleChoiceTask =
  StudentAttemptHistoryTaskBase & {
    taskType: "single_choice";
    options: PublicRuntimeSingleChoiceOption[];
    selectedOptionId: string | null;
  };

export type StudentAttemptHistoryMultipleChoiceTask =
  StudentAttemptHistoryTaskBase & {
    taskType: "multiple_choice";
    options: PublicRuntimeSingleChoiceOption[];
    selectedOptionIds: string[];
  };

export type StudentAttemptHistoryTask =
  | StudentAttemptHistoryTextTask
  | StudentAttemptHistorySingleChoiceTask
  | StudentAttemptHistoryMultipleChoiceTask;

export type StudentAttemptHistoryDetail = StudentAttemptHistoryItem & {
  tasks: StudentAttemptHistoryTask[];
};

export type StudentAttemptHistoryResult = {
  items: StudentAttemptHistoryItem[];
  hasMore: boolean;
  nextOffset: number | null;
};
