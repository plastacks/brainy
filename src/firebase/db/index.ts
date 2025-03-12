import type { BaseModel, Item, Workspace } from "@/firebase/db/types";
import { firestore } from "@/firebase/server";
import { Timestamp } from "firebase-admin/firestore";

const converter = <T extends BaseModel>() => ({
  toFirestore: (data: T) => {
    return { ...data, updatedAt: Timestamp.now() };
  },
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot<T>) => {
    return {
      ...snap.data(),
      id: snap.id,
    };
  },
});

const collection = <T extends BaseModel>(collectionPath: string) =>
  firestore.collection(collectionPath).withConverter(converter<T>());

const doc = <T extends BaseModel>(docPath: string) =>
  firestore.doc(docPath).withConverter(converter<T>());

const db = {
  workspaces: collection<Workspace>("workspaces"),
  workspace: (workspaceId: string) =>
    doc<Workspace>(`workspaces/${workspaceId}`),
  items: collection<Item>("items"),
  item: (itemId: string) => doc<Item>(`items/${itemId}`),
};

export { db };
