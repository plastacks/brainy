import { atom } from "nanostores";

// Store for the editor content
export const $editorContent = atom<string | null>(null);

// Action to set the editor content
export function setEditorContent(content: string | null) {
  $editorContent.set(content);
}
