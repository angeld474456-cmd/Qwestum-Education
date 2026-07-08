import SingleChoiceTaskEditor from "./SingleChoiceTaskEditor";
import TextTaskEditor, { TextTaskEditorProps } from "./TextTaskEditor";

export type TaskEditorComponent = (props: TextTaskEditorProps) => React.ReactNode;

export const taskTypeRegistry: Record<string, TaskEditorComponent> = {
  single_choice: SingleChoiceTaskEditor,
  text: TextTaskEditor,
};

export const fallbackTaskEditor = TextTaskEditor;
