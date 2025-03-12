import type { APIRoute } from "astro";
import { app } from "@/firebase/server";
import { getAuth } from "firebase-admin/auth";

export const GET: APIRoute = async ({ cookies }) => {
  const auth = getAuth(app);

  // Get the session cookie
  const sessionCookie = cookies.get("__session")?.value;
  if (!sessionCookie) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Verify the session cookie and get the user
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);

    // Get the full user record from Firebase Auth
    const user = await auth.getUser(decodedClaims.uid);

    // Return user data (excluding sensitive information)
    return new Response(
      JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error getting user:", error);
    return new Response("Error getting user data", { status: 500 });
  }
};
