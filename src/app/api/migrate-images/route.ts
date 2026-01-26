/**
 * Image Migration API
 *
 * Migrates images from external URLs to Vercel Blob storage.
 *
 * POST /api/migrate-images
 *
 * Body parameters:
 *   - secret: (optional) Migration secret for auth if MIGRATION_SECRET env var is set
 *   - dryRun: (optional) If true, returns list of pieces to migrate without actually migrating
 *   - pieceIds: (optional) Array of piece IDs to migrate. If provided, only these pieces will be
 *               processed (and their persisted_image_url will be overwritten even if it exists).
 *               If not provided, migrates all pieces where persisted_image_url is null.
 *   - force: (optional) If true, re-uploads images even if persisted_image_url already exists.
 *            Only applies when pieceIds is provided.
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull, isNotNull, and, inArray } from "drizzle-orm";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { put } from "@vercel/blob";

// Define pieces schema inline
const pieces = pgTable("pieces", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  color: text("color").notNull().default(""),
  style: text("style").notNull().default(""),
  designer: text("designer").notNull().default(""),
  productUrl: text("product_url"),
  originalImageUrl: text("original_image_url"),
  persistedImageUrl: text("persisted_image_url"),
  orderNumber: text("order_number"),
  orderDate: text("order_date"),
  orderRetailer: text("order_retailer"),
  createdAt: timestamp("created_at").defaultNow(),
});

function generateFilename(originalUrl?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  let extension = "jpg";
  if (originalUrl) {
    const ext = originalUrl.split(".").pop()?.toLowerCase().split("?")[0];
    if (ext && ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) {
      extension = ext === "jpeg" ? "jpg" : ext;
    }
  }

  return `wardrobe/${timestamp}-${random}.${extension}`;
}

async function uploadImageToBlob(imageUrl: string): Promise<string | null> {
  try {
    // Fetch the image
    let imageBlob: Blob;
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }
      imageBlob = await response.blob();
    } catch {
      // Try with CORS proxy
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch image via proxy");
      }
      imageBlob = await response.blob();
    }

    const contentType = imageBlob.type || "image/jpeg";
    const filename = generateFilename(imageUrl);

    const blob = await put(filename, imageBlob, {
      access: "public",
      contentType,
    });

    return blob.url;
  } catch (error) {
    console.error(`Failed to upload image ${imageUrl}:`, error);
    return null;
  }
}

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL not configured");
  }
  const sql = neon(url);
  return drizzle(sql);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret, dryRun, pieceIds, force } = body || {};

    // Optional: Add a secret key for protection
    const expectedSecret = process.env.MIGRATION_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Blob storage not configured" },
        { status: 500 },
      );
    }

    const db = getDb();

    // Get pieces to migrate based on parameters
    let piecesToMigrate;

    if (pieceIds && Array.isArray(pieceIds) && pieceIds.length > 0) {
      // Migrate specific pieces by ID (optionally forcing re-upload)
      const baseQuery = db
        .select({
          id: pieces.id,
          name: pieces.name,
          originalImageUrl: pieces.originalImageUrl,
          persistedImageUrl: pieces.persistedImageUrl,
        })
        .from(pieces)
        .where(
          and(inArray(pieces.id, pieceIds), isNotNull(pieces.originalImageUrl)),
        );

      const allPieces = await baseQuery;

      // If force is true, include all pieces; otherwise only those without persisted URL
      piecesToMigrate = force
        ? allPieces
        : allPieces.filter((p) => !p.persistedImageUrl);
    } else {
      // Default: migrate all pieces without persisted images
      piecesToMigrate = await db
        .select({
          id: pieces.id,
          name: pieces.name,
          originalImageUrl: pieces.originalImageUrl,
        })
        .from(pieces)
        .where(
          and(
            isNull(pieces.persistedImageUrl),
            isNotNull(pieces.originalImageUrl),
          ),
        );
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        piecesToMigrate: piecesToMigrate.length,
        pieces: piecesToMigrate.map((p) => ({ id: p.id, name: p.name })),
      });
    }

    const results: Array<{
      id: number;
      name: string;
      success: boolean;
      persistedUrl?: string;
      error?: string;
    }> = [];

    for (const piece of piecesToMigrate) {
      if (!piece.originalImageUrl) continue;

      const persistedUrl = await uploadImageToBlob(piece.originalImageUrl);

      if (persistedUrl) {
        // Update the piece with the new URL
        await db
          .update(pieces)
          .set({ persistedImageUrl: persistedUrl })
          .where(eq(pieces.id, piece.id));

        results.push({
          id: piece.id,
          name: piece.name,
          success: true,
          persistedUrl,
        });
      } else {
        results.push({
          id: piece.id,
          name: piece.name,
          success: false,
          error: "Failed to upload image",
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: "Migration complete",
      total: piecesToMigrate.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
