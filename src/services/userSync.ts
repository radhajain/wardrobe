/**
 * User data from auth session
 */
interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

/**
 * Ensures a user exists in our database
 * This syncs the Neon Auth user to our users table via API route
 */
export async function ensureUserExists(authUser: AuthUser): Promise<void> {
  const response = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "ensureUser",
      userId: authUser.id,
      data: {
        email: authUser.email,
        name: authUser.name,
      },
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to sync user");
  }
}
