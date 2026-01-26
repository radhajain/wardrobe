/**
 * API Key Delete Endpoint
 *
 * DELETE /api/keys/[id] - Revoke an API key
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { eq, and } from "drizzle-orm";

// Define schema inline
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

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not configured");
  const sql = neon(url);
  return drizzle(sql, { schema: { apiKeys } });
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/keys/[id] - Revoke an API key
 * Query: ?userId=xxx (for authorization check)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const db = getDb();

    // Soft delete by setting revokedAt (ensures key belongs to user)
    const [revoked] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .returning({ id: apiKeys.id });

    if (!revoked) {
      return NextResponse.json(
        { error: "API key not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, revokedId: revoked.id });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 },
    );
  }
}
