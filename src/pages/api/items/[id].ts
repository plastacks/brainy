import type { APIRoute } from "astro";
import { db } from "@/firebase/db";
import type { Item, DocumentItem, FolderItem } from "@/firebase/db/types";
import { getAuth } from "firebase-admin/auth";
import { app } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

// GET: Retrieve a specific item by ID
export const GET: APIRoute = async ({ params, cookies }) => {
  const auth = getAuth(app);
  const itemId = params.id;

  if (!itemId) {
    return new Response("Item ID is required", { status: 400 });
  }

  if (!cookies.has("__session")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sessionCookie = cookies.get("__session")!.value;

  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedCookie.uid;

    // Get the item document
    const docSnapshot = await db.item(itemId).get();

    if (!docSnapshot.exists) {
      return new Response("Item not found", { status: 404 });
    }

    const item = docSnapshot.data() as Item;

    // Check if the user has access to this item
    if (item.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    return new Response(JSON.stringify(item), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    return new Response("Error fetching item", { status: 500 });
  }
};

// PUT: Update a specific item
export const PUT: APIRoute = async ({ params, cookies, request }) => {
  const auth = getAuth(app);
  const itemId = params.id;

  if (!itemId) {
    return new Response("Item ID is required", { status: 400 });
  }

  if (!cookies.has("__session")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sessionCookie = cookies.get("__session")!.value;

  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedCookie.uid;

    // Check if item exists and if user has access
    const docSnapshot = await db.item(itemId).get();

    if (!docSnapshot.exists) {
      return new Response("Item not found", { status: 404 });
    }

    const item = docSnapshot.data() as Item;

    if (item.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    // Get update data
    const data = await request.json();

    if (!data.name) {
      return new Response("Item name is required", { status: 400 });
    }

    // Create update data based on item type
    let updateData;

    if (item.type === "document") {
      updateData = {
        name: data.name,
        content:
          data.content !== undefined
            ? data.content
            : (item as DocumentItem).content,
        updatedAt: FieldValue.serverTimestamp(),
      };
    } else if (item.type === "folder") {
      updateData = {
        name: data.name,
        itemsIds:
          data.itemsIds !== undefined
            ? data.itemsIds
            : (item as FolderItem).itemsIds,
        updatedAt: FieldValue.serverTimestamp(),
      };
    } else {
      return new Response("Invalid item type", { status: 400 });
    }

    // Update the item
    await db.item(itemId).update(updateData);

    return new Response(
      JSON.stringify({
        id: itemId,
        ...updateData,
        type: item.type,
        userId: item.userId,
        workspaceId: item.workspaceId,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error updating item:", error);
    return new Response("Error updating item", { status: 500 });
  }
};

// DELETE: Delete a specific item
export const DELETE: APIRoute = async ({ params, cookies }) => {
  const auth = getAuth(app);
  const itemId = params.id;

  if (!itemId) {
    return new Response("Item ID is required", { status: 400 });
  }

  if (!cookies.has("__session")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sessionCookie = cookies.get("__session")!.value;

  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedCookie.uid;

    // Check if item exists and if user has access
    const docSnapshot = await db.item(itemId).get();

    if (!docSnapshot.exists) {
      return new Response("Item not found", { status: 404 });
    }

    const item = docSnapshot.data() as Item;

    if (item.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    // Delete the item
    await db.item(itemId).delete();

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting item:", error);
    return new Response("Error deleting item", { status: 500 });
  }
};
