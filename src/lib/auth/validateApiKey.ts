/**
 * API Key Validation for MCP Authentication
 *
 * Validates Bearer tokens against the api_keys table.
 * Keys are stored as SHA256 hashes for security.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { eq, and, isNull } from "drizzle-orm";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

// Define schema inline for Edge compatibility
const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(),
  name: text("name").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
});

/**
 * Hash a key using SHA256 (Web Crypto API for Edge compatibility)
 */
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validates an API key and returns the associated user ID
 *
 * @param request - The incoming request
 * @param bearerToken - The Bearer token from Authorization header (extracted by withMcpAuth)
 * @returns AuthInfo with userId if valid, undefined otherwise
 */
export async function validateApiKey(
  _request: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  // Check if token exists and has correct prefix
  if (!bearerToken) {
    return undefined;
  }

  // Validate key format: wdrb_live_xxx or wdrb_test_xxx
  if (!bearerToken.startsWith("wdrb_")) {
    return undefined;
  }

  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error("DATABASE_URL not configured for API key validation");
      return undefined;
    }

    const keyHash = await hashKey(bearerToken);
    const sql = neon(url);
    const db = drizzle(sql, { schema: { apiKeys } });

    // Find active (non-revoked) key
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)));

    if (!apiKey) {
      return undefined;
    }

    // Update last_used_at asynchronously (don't block the request)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))
      .execute()
      .catch((err) => console.error("Failed to update lastUsedAt:", err));

    // Return AuthInfo with userId in the extra field
    return {
      token: bearerToken,
      clientId: apiKey.id,
      scopes: ["wardrobe:read", "wardrobe:write"],
      extra: {
        userId: apiKey.userId,
      },
    };
  } catch (error) {
    console.error("API key validation error:", error);
    return undefined;
  }
}

/**
 * Generate a new API key
 *
 * @param prefix - "live" or "test"
 * @returns The full API key (only returned once, must be shown to user immediately)
 */
export function generateApiKey(prefix: "live" | "test" = "live"): string {
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const randomPart = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `wdrb_${prefix}_${randomPart}`;
}

/**
 * Get the display prefix from a full API key
 * Shows first 12 chars of the random part for identification
 */
export function getKeyPrefix(fullKey: string): string {
  // wdrb_live_abc123... -> wdrb_live_abc123
  const parts = fullKey.split("_");
  if (parts.length >= 3) {
    const randomPart = parts.slice(2).join("_");
    return `wdrb_${parts[1]}_${randomPart.substring(0, 8)}...`;
  }
  return fullKey.substring(0, 20) + "...";
}

export { hashKey };
