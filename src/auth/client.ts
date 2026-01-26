import { createAuthClient } from "@neondatabase/neon-js/auth";

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL;

if (!authUrl) {
  console.error(
    "NEXT_PUBLIC_NEON_AUTH_URL is not set. Please add it to your .env.local file.",
  );
}

export const authClient = createAuthClient(authUrl || "");
