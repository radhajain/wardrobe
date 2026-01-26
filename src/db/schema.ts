import {
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { CanvasItemPosition, ClothingType, CropSettings } from "../types";

/**
 * Users table - stores user profile data
 * The id matches the Clerk user ID (format: user_xxx)
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Wardrobe pieces table
 * Note: Has a partial unique index on (user_id, product_url) WHERE product_url IS NOT NULL
 */
export const pieces = pgTable("pieces", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  type: text("type").$type<ClothingType>().notNull(),
  color: text("color").notNull().default(""),
  style: text("style").notNull().default(""),
  designer: text("designer").notNull().default(""),
  productUrl: text("product_url"),
  /** Original external image URL (for reference) */
  originalImageUrl: text("original_image_url"),
  /** Persisted Vercel Blob image URL */
  persistedImageUrl: text("persisted_image_url"),
  /** Order information - flat columns */
  orderNumber: text("order_number"),
  orderDate: text("order_date"),
  orderRetailer: text("order_retailer"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Outfit item as stored in JSONB
 */
export interface OutfitItemJson {
  id: string;
  pieceId: number;
  position: CanvasItemPosition;
  customImageUrl?: string;
  crop?: CropSettings;
}

/**
 * Outfits table
 */
export const outfits = pgTable("outfits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  items: jsonb("items").$type<OutfitItemJson[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Chat messages for style assistant
 */
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  role: text("role").$type<"user" | "assistant">().notNull(),
  content: text("content").notNull(),
  itemReferences:
    jsonb("item_references").$type<Array<{ pieceId: number; name: string }>>(),
  timestamp: timestamp("timestamp").defaultNow(),
});

/**
 * User reflections from AI analysis
 */
export const userReflections = pgTable("user_reflections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  purposeAndContext: text("purpose_and_context").notNull(),
  currentState: text("current_state").notNull(),
  approachAndPatterns: text("approach_and_patterns").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

/**
 * Style assessment responses
 */
export const assessmentResponses = pgTable("assessment_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  answers: jsonb("answers").$type<Record<string, string>>().notNull(),
  summary: text("summary").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

/**
 * Recommendation preferences
 */
export const recommendationPreferences = pgTable("recommendation_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  stores: jsonb("stores")
    .$type<
      Array<{
        name: string;
        isFromHistory: boolean;
        preference: "preferred" | "avoided" | "neutral";
      }>
    >()
    .notNull()
    .default([]),
  priceLimits: jsonb("price_limits")
    .$type<Array<{ clothingType: ClothingType; maxPrice: number }>>()
    .notNull()
    .default([]),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

/**
 * API keys for MCP authentication
 * Keys are hashed with SHA256, only the prefix is stored for display
 */
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(), // First 8 chars for display (wdrb_abc123...)
  name: text("name").notNull(), // User-friendly name
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"), // NULL = active, set = revoked
});

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Piece = typeof pieces.$inferSelect;
export type NewPiece = typeof pieces.$inferInsert;

export type OutfitRecord = typeof outfits.$inferSelect;
export type NewOutfit = typeof outfits.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
