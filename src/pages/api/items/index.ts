import type { APIRoute } from "astro";
import { db } from "@/firebase/db";
import type { Item, DocumentItem, FolderItem } from "@/firebase/db/types";
import { getAuth } from "firebase-admin/auth";
import { app } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

// GET: List all items for a specific workspace
export const GET: APIRoute = async ({ cookies, request, url }) => {
  const auth = getAuth(app);
  const workspaceId = url.searchParams.get("workspaceId");

  if (!workspaceId) {
    return new Response("Workspace ID is required", { status: 400 });
  }

  if (!cookies.has("__session")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sessionCookie = cookies.get("__session")!.value;

  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedCookie.uid;

    // Verify the user has access to this workspace
    const workspaceDoc = await db.workspace(workspaceId).get();

    if (!workspaceDoc.exists) {
      return new Response("Workspace not found", { status: 404 });
    }

    const workspace = workspaceDoc.data();

    if (workspace?.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    // Query items for this workspace
    const snapshot = await db.items
      .where("workspaceId", "==", workspaceId)
      .where("userId", "==", userId)
      .get();

    const items = snapshot.docs.map((doc) => doc.data());

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return new Response("Error fetching items", { status: 500 });
  }
};

// POST: Create a new item in a workspace
export const POST: APIRoute = async ({ cookies, request }) => {
  const auth = getAuth(app);

  if (!cookies.has("__session")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sessionCookie = cookies.get("__session")!.value;

  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedCookie.uid;

    const data = await request.json();

    if (!data.name || !data.workspaceId || !data.type) {
      return new Response("Name, workspaceId, and type are required", {
        status: 400,
      });
    }

    // Verify the user has access to this workspace
    const workspaceDoc = await db.workspace(data.workspaceId).get();

    if (!workspaceDoc.exists) {
      return new Response("Workspace not found", { status: 404 });
    }

    const workspace = workspaceDoc.data();

    if (workspace?.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    // Create item data based on type
    if (data.type === "document") {
      const documentItem = {
        name: data.name,
        userId: userId,
        workspaceId: data.workspaceId,
        type: "document" as const,
        content: data.content || "",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Create the item
      const docRef = await db.items.add(documentItem);
      const itemId = docRef.id;

      return new Response(
        JSON.stringify({
          id: itemId,
          ...documentItem,
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else if (data.type === "folder") {
      const folderItem = {
        name: data.name,
        userId: userId,
        workspaceId: data.workspaceId,
        type: "folder" as const,
        itemsIds: data.itemsIds || [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Create the item
      const docRef = await db.items.add(folderItem);
      const itemId = docRef.id;

      return new Response(
        JSON.stringify({
          id: itemId,
          ...folderItem,
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      return new Response("Invalid item type. Must be 'document' or 'folder'", {
        status: 400,
      });
    }
  } catch (error) {
    console.error("Error creating item:", error);
    return new Response("Error creating item", { status: 500 });
  }
};
