/**
 * API Keys Management Endpoints
 *
 * POST /api/keys - Create a new API key (requires auth session)
 * GET /api/keys - List user's API keys (masked)
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { eq, and, isNull, desc } from "drizzle-orm";
import {
  generateApiKey,
  getKeyPrefix,
  hashKey,
} from "../../../lib/auth/validateApiKey";

// Define schema inline
const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(),
  name: text("name").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
});

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not configured");
  const sql = neon(url);
  return drizzle(sql, { schema: { apiKeys } });
}

/**
 * GET /api/keys - List user's API keys
 * Requires userId in query params (validated by session on frontend)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const db = getDb();
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
      .orderBy(desc(apiKeys.createdAt));

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("Error listing API keys:", error);
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/keys - Create a new API key
 * Body: { userId: string, name: string }
 * Returns the full key (only shown once!)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "userId and name required" },
        { status: 400 },
      );
    }

    // Generate the key
    const fullKey = generateApiKey("live");
    const keyHash = await hashKey(fullKey);
    const keyPrefix = getKeyPrefix(fullKey);

    const db = getDb();
    const [created] = await db
      .insert(apiKeys)
      .values({
        userId,
        keyHash,
        keyPrefix,
        name,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
      });

    // Return the full key - this is the ONLY time it's shown!
    return NextResponse.json({
      key: {
        ...created,
        fullKey, // Only returned on creation
      },
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }
}
