import { type Timestamp } from "firebase/firestore";

interface BaseModel {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Add ItemsSort type
interface ItemsSort {
  field: "name" | "createdAt" | "updatedAt";
  direction: "asc" | "desc";
}

// Add WorkspacePreferences type
interface WorkspacePreferences {
  itemsSort?: ItemsSort;
  // Add other preference types here as needed
}

interface Workspace extends BaseModel {
  name: string;
  userId: string;
  preferences?: WorkspacePreferences;
}

type Item = DocumentItem | FolderItem;

interface BaseItem extends BaseModel {
  name: string;
  userId: string;
  workspaceId: string;
}

interface DocumentItem extends BaseItem {
  type: "document";
  content: string;
}

interface FolderItem extends BaseItem {
  type: "folder";
  itemsIds: string[];
}

export type {
  BaseModel,
  Workspace,
  Item,
  DocumentItem,
  FolderItem,
  ItemsSort,
  WorkspacePreferences,
};
