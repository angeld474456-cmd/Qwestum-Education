export type PublicRuntimeSingleChoiceOption = {
  id: string;
  text: string;
};

export type PublicRuntimeTextTask = {
  id: string;
  taskType: "text";
  title: string;
  description: string | null;
};

export type PublicRuntimeSingleChoiceTask = {
  id: string;
  taskType: "single_choice";
  title: string;
  description: string | null;
  options: PublicRuntimeSingleChoiceOption[];
};

export type PublicRuntimeTask =
  | PublicRuntimeTextTask
  | PublicRuntimeSingleChoiceTask;

export type PublicRuntimeQuest = {
  id: string;
  title: string;
  description: string | null;
  tasks: PublicRuntimeTask[];
};

export type PublicRuntimeSubmissionAnswer =
  | {
      taskId: string;
    }
  | {
      taskId: string;
      selectedOptionId: string;
    };

export type PublicRuntimeSubmission = {
  answers: PublicRuntimeSubmissionAnswer[];
};

export type PublicRuntimeTaskStatus =
  | "correct"
  | "incorrect"
  | "unanswered"
  | "not_scored";

export type PublicRuntimeTaskResult = {
  taskId: string;
  status: PublicRuntimeTaskStatus;
};

export type PublicRuntimeResult = {
  earnedPoints: number;
  possiblePoints: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  notScoredCount: number;
  taskResults: PublicRuntimeTaskResult[];
};
