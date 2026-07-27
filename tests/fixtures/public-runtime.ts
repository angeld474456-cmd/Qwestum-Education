export const runtimeQuestId = "11111111-1111-4111-8111-111111111111";
export const missingQuestId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const unknownTaskId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const unknownOptionId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
export const foreignOptionId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

export const textTaskIds = [
  "22222222-2222-4222-8222-222222222221",
  "22222222-2222-4222-8222-222222222222",
  "22222222-2222-4222-8222-222222222223",
  "22222222-2222-4222-8222-222222222224",
] as const;

export const singleChoiceTaskIds = [
  "33333333-3333-4333-8333-333333333331",
  "33333333-3333-4333-8333-333333333332",
] as const;

export const optionIds = [
  "44444444-4444-4444-8444-444444444441",
  "44444444-4444-4444-8444-444444444442",
  "44444444-4444-4444-8444-444444444443",
  "44444444-4444-4444-8444-444444444444",
] as const;

export const validSubmission = {
  answers: [
    ...textTaskIds.map((taskId) => ({ taskId })),
    { taskId: singleChoiceTaskIds[0], selectedOptionId: optionIds[0] },
    { taskId: singleChoiceTaskIds[1], selectedOptionId: optionIds[3] },
  ],
};

export const publicRuntimeQuestRow = {
  id: runtimeQuestId,
  title: "Public runtime quest",
  description: "Sanitized fixture",
  author_id: "owner-must-not-leak",
  tasks: [
    ...textTaskIds.map((id, index) => ({
      id,
      task_type: "text",
      title: `Text task ${index + 1}`,
      description: null,
      answer: "private answer",
    })),
    {
      id: singleChoiceTaskIds[0],
      task_type: "single_choice",
      title: "Choice task one",
      description: "Choose one option",
      correctOptionId: optionIds[0],
      options: [
        { id: optionIds[0], text: "Option one", internal: "ignored" },
        { id: optionIds[1], text: "Option two" },
      ],
    },
    {
      id: singleChoiceTaskIds[1],
      task_type: "single_choice",
      title: "Choice task two",
      description: null,
      options: [
        { id: optionIds[2], text: "Option three" },
        { id: optionIds[3], text: "Option four" },
      ],
    },
  ],
};

export const publicRuntimeResultRow = {
  earned_points: 1,
  possible_points: 2,
  correct_count: 1,
  incorrect_count: 1,
  unanswered_count: 0,
  not_scored_count: 4,
  task_results: [
    ...textTaskIds.map((taskId) => ({ taskId, status: "not_scored" })),
    { taskId: singleChoiceTaskIds[0], status: "correct", secret: "ignored" },
    { taskId: singleChoiceTaskIds[1], status: "incorrect" },
  ],
  answer_key: "must-not-leak",
};

export const publicRuntimeResult = {
  earnedPoints: 1,
  possiblePoints: 2,
  correctCount: 1,
  incorrectCount: 1,
  unansweredCount: 0,
  notScoredCount: 4,
  taskResults: [
    ...textTaskIds.map((taskId) => ({ taskId, status: "not_scored" as const })),
    { taskId: singleChoiceTaskIds[0], status: "correct" as const },
    { taskId: singleChoiceTaskIds[1], status: "incorrect" as const },
  ],
};

export const publicRuntimeResultWithUnansweredRow = {
  earned_points: 1,
  possible_points: 3,
  correct_count: 1,
  incorrect_count: 1,
  unanswered_count: 1,
  not_scored_count: 3,
  task_results: [
    ...textTaskIds.slice(0, 3).map((taskId) => ({
      taskId,
      status: "not_scored",
    })),
    { taskId: textTaskIds[3], status: "unanswered", internal: "ignored" },
    { taskId: singleChoiceTaskIds[0], status: "correct" },
    { taskId: singleChoiceTaskIds[1], status: "incorrect" },
  ],
  answer_key: "must-not-leak",
};

export const publicRuntimeResultWithUnanswered = {
  earnedPoints: 1,
  possiblePoints: 3,
  correctCount: 1,
  incorrectCount: 1,
  unansweredCount: 1,
  notScoredCount: 3,
  taskResults: [
    ...textTaskIds.slice(0, 3).map((taskId) => ({
      taskId,
      status: "not_scored" as const,
    })),
    { taskId: textTaskIds[3], status: "unanswered" as const },
    { taskId: singleChoiceTaskIds[0], status: "correct" as const },
    { taskId: singleChoiceTaskIds[1], status: "incorrect" as const },
  ],
};

export const malformedRuntimeQuestRow = {
  ...publicRuntimeQuestRow,
  tasks: [],
};

export const malformedRuntimeResultRow = {
  ...publicRuntimeResultRow,
  correct_count: 2,
};
