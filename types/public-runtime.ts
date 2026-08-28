export type PublicRuntimeSingleChoiceOption = {
  id: string;
  text: string;
};

export type PublicRuntimeSequenceItem = {
  id: string;
  text: string;
};

export type PublicRuntimeSequenceTask = {
  id: string;
  taskType: "sequence";
  title: string;
  description: string | null;
  imageUrl: string | null;
  items: PublicRuntimeSequenceItem[];
};

export type PublicRuntimeMultipleChoiceTask = {
  id: string;
  taskType: "multiple_choice";
  title: string;
  description: string | null;
  imageUrl: string | null;
  options: PublicRuntimeSingleChoiceOption[];
};

export type PublicRuntimeTextTask = {
  id: string;
  taskType: "text";
  title: string;
  description: string | null;
  imageUrl: string | null;
};

export type PublicRuntimeSingleChoiceTask = {
  id: string;
  taskType: "single_choice";
  title: string;
  description: string | null;
  imageUrl: string | null;
  options: PublicRuntimeSingleChoiceOption[];
};

export type PublicRuntimeTask =
  | PublicRuntimeTextTask
  | PublicRuntimeSingleChoiceTask
  | PublicRuntimeMultipleChoiceTask
  | PublicRuntimeSequenceTask;

export type PublicRuntimeQuest = {
  id: string;
  title: string;
  description: string | null;
  tasks: PublicRuntimeTask[];
};

export type PublicRuntimeNarrativeTask = PublicRuntimeTask & {
  narrativeIntro: string | null;
  narrativeSuccess: string | null;
};

export type PublicRuntimeQuestV2 = Omit<PublicRuntimeQuest, "tasks"> & {
  missionIntro: string | null;
  missionOutro: string | null;
  tasks: PublicRuntimeNarrativeTask[];
};

export type PublicRuntimeSubmissionAnswer =
  | {
      taskId: string;
    }
  | {
      taskId: string;
      selectedOptionId: string;
    }
  | {
      taskId: string;
      selectedOptionIds: string[];
    }
  | {
      taskId: string;
      orderedItemIds: string[];
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
