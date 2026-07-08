import TextTaskEditor, { TextTaskEditorProps } from "./TextTaskEditor";

export type TaskEditorComponent = (props: TextTaskEditorProps) => React.ReactNode;

export const taskTypeRegistry: Record<string, TaskEditorComponent> = {
  text: TextTaskEditor,
};

export const fallbackTaskEditor = TextTaskEditor;
