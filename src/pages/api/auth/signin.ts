import type { APIRoute } from "astro";
import { app } from "../../../firebase/server";
import { getAuth } from "firebase-admin/auth";

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const auth = getAuth(app);

  /* Get token from request headers */
  const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
  if (!idToken) {
    return new Response("No token found", { status: 401 });
  }

  /* Verify id token */
  try {
    // Store the verification result - we'll need the user ID
    const decodedToken = await auth.verifyIdToken(idToken);

    /* Create and set session cookie */
    const fiveDays = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: fiveDays,
    });

    cookies.set("__session", sessionCookie, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD, // Only secure in production
      sameSite: "lax",
      maxAge: fiveDays / 1000, // Convert to seconds
    });

    return redirect("/");
  } catch (error) {
    console.error("Token verification failed:", error);
    return new Response(
      `Invalid token: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 401 }
    );
  }
};
