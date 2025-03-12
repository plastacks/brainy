import type { APIRoute } from "astro";
import { app } from "../../../firebase/server";
import { getAuth } from "firebase-admin/auth";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const auth = getAuth(app);
  auth;
  // Get the session cookie
  const sessionCookie = cookies.get("__session")?.value;
  if (!sessionCookie) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Verify the session cookie and get the user
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    const uid = decodedClaims.uid;

    // Delete the user
    await auth.deleteUser(uid);

    // Clear the session cookie
    cookies.delete("__session", {
      path: "/",
    });

    return redirect("/signin");
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return new Response(`Failed to delete account: ${error.message}`, {
      status: 400,
    });
  }
};
