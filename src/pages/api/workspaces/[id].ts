import type { APIRoute } from "astro";
import { db } from "@/firebase/db";
import type { Workspace } from "@/firebase/db/types";
import { getAuth } from "firebase-admin/auth";
import { app } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

// GET: Retrieve a specific workspace by ID
export const GET: APIRoute = async ({ params, cookies }) => {
  const auth = getAuth(app);
  const workspaceId = params.id;

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

    // Get the workspace document
    const docSnapshot = await db.workspace(workspaceId).get();

    if (!docSnapshot.exists) {
      return new Response("Workspace not found", { status: 404 });
    }

    const workspace = docSnapshot.data() as Workspace;

    // Check if the user has access to this workspace
    if (workspace.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    return new Response(JSON.stringify(workspace), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return new Response("Error fetching workspace", { status: 500 });
  }
};

// PUT: Update a specific workspace
export const PUT: APIRoute = async ({ params, cookies, request }) => {
  const auth = getAuth(app);
  const workspaceId = params.id;

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

    // Check if workspace exists and if user has access
    const docSnapshot = await db.workspace(workspaceId).get();

    if (!docSnapshot.exists) {
      return new Response("Workspace not found", { status: 404 });
    }

    const workspace = docSnapshot.data() as Workspace;

    if (workspace.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    // Get update data
    const data = await request.json();

    if (!data.name) {
      return new Response("Workspace name is required", { status: 400 });
    }

    // Update the workspace
    const updateData = {
      name: data.name,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.workspace(workspaceId).update(updateData);

    return new Response(
      JSON.stringify({
        id: workspaceId,
        ...updateData,
        userId,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error updating workspace:", error);
    return new Response("Error updating workspace", { status: 500 });
  }
};

// DELETE: Delete a specific workspace
export const DELETE: APIRoute = async ({ params, cookies }) => {
  const auth = getAuth(app);
  const workspaceId = params.id;

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

    // Check if workspace exists and if user has access
    const docSnapshot = await db.workspace(workspaceId).get();

    if (!docSnapshot.exists) {
      return new Response("Workspace not found", { status: 404 });
    }

    const workspace = docSnapshot.data() as Workspace;

    if (workspace.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    // Delete the workspace
    await db.workspace(workspaceId).delete();

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return new Response("Error deleting workspace", { status: 500 });
  }
};
