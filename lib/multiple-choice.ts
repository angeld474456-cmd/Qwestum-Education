export {
  type ChoiceOption,
  type MultipleChoiceContent,
  parseMultipleChoiceContent,
} from "@/lib/task-choice-content";

export function haveSameOptionIds(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((id) => right.includes(id));
}
