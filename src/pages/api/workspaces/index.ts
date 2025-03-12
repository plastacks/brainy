import type { APIRoute } from "astro";
import { db } from "@/firebase/db";
import { getAuth } from "firebase-admin/auth";
import { app } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

// GET: List all workspaces for the authenticated user
export const GET: APIRoute = async ({ cookies }) => {
  const auth = getAuth(app);

  if (!cookies.has("__session")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sessionCookie = cookies.get("__session")!.value;

  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedCookie.uid;

    // Query workspaces for this user
    const snapshot = await db.workspaces.where("userId", "==", userId).get();

    const workspaces = snapshot.docs.map((doc) => doc.data());

    return new Response(JSON.stringify({ workspaces }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return new Response("Error fetching workspaces", { status: 500 });
  }
};

// POST: Create a new workspace for the authenticated user
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

    if (!data.name) {
      return new Response("Workspace name is required", { status: 400 });
    }

    // Create a new workspace with all required fields
    const workspaceData = {
      name: data.name,
      userId: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.workspaces.add(workspaceData);
    const workspaceId = docRef.id;

    return new Response(
      JSON.stringify({
        id: workspaceId,
        ...workspaceData,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating workspace:", error);
    return new Response("Error creating workspace", { status: 500 });
  }
};
