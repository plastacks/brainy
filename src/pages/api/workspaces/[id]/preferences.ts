import type { APIRoute } from "astro";
import { db } from "@/firebase/db";
import { getAuth } from "firebase-admin/auth";
import { app } from "@/firebase/server";

// GET: Retrieve workspace preferences
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

    const workspace = docSnapshot.data();

    if (!workspace) {
      return new Response("Workspace not found", { status: 404 });
    }

    // Check if the user has access to this workspace
    if (workspace.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    // Return preferences or empty object if none exist
    const preferences = workspace.preferences || {};

    return new Response(JSON.stringify(preferences), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching workspace preferences:", error);
    return new Response("Error fetching workspace preferences", {
      status: 500,
    });
  }
};

// PUT: Update workspace preferences
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

    const workspace = docSnapshot.data();

    if (!workspace) {
      return new Response("Workspace not found", { status: 404 });
    }

    if (workspace.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    // Get update data
    const newPreferences = await request.json();

    // Get existing preferences or create empty object
    const currentPreferences = workspace.preferences || {};

    // Merge preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...newPreferences,
    };

    // Update the workspace
    await db.workspace(workspaceId).update({
      preferences: updatedPreferences,
    });

    return new Response(JSON.stringify(updatedPreferences), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating workspace preferences:", error);
    return new Response("Error updating workspace preferences", {
      status: 500,
    });
  }
};
