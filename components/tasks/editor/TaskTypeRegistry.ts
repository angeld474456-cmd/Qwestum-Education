import SingleChoiceTaskEditor from "./SingleChoiceTaskEditor";
import MultipleChoiceTaskEditor from "./MultipleChoiceTaskEditor";
import TextTaskEditor, { TextTaskEditorProps } from "./TextTaskEditor";

export type TaskEditorComponent = (props: TextTaskEditorProps) => React.ReactNode;

export const taskTypeRegistry: Record<string, TaskEditorComponent> = {
  single_choice: SingleChoiceTaskEditor,
  multiple_choice: MultipleChoiceTaskEditor,
  text: TextTaskEditor,
};

export const fallbackTaskEditor = TextTaskEditor;
