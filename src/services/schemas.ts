import { z } from "zod";

/**
 * Schema for user reflections generated from query history
 */
export const UserReflectionsSchema = z.object({
  purposeAndContext: z.string(),
  currentState: z.string(),
  approachAndPatterns: z.string(),
});

/**
 * Schema for outfit suggestions in the Builder
 */
export const OutfitSuggestionSchema = z.object({
  suggestedItemIds: z.array(z.number()),
  explanation: z.string(),
});

/**
 * Schema for product details extracted from URLs
 */
export const ProductDetailsSchema = z.object({
  name: z.string(),
  type: z.string(),
  color: z.string(),
  style: z.string(),
  designer: z.string(),
  imageUrl: z.string(),
  imageUrls: z.array(z.string()).max(3),
});

/**
 * Schema for image bounding box coordinates
 */
export const ImageBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export type UserReflectionsResponse = z.infer<typeof UserReflectionsSchema>;
export type OutfitSuggestionResponse = z.infer<typeof OutfitSuggestionSchema>;
export type ProductDetailsResponse = z.infer<typeof ProductDetailsSchema>;
export type ImageBoundsResponse = z.infer<typeof ImageBoundsSchema>;

/**
 * Schema for AI-generated piece suggestions
 */
export const PieceSuggestionsSchema = z
  .array(
    z.object({
      description: z
        .string()
        .describe(
          'Brief description of the piece type, e.g., "Burgundy cropped jacket"',
        ),
      type: z.string().describe('Clothing type, e.g., "jacket", "dress"'),
      color: z.string().describe("Primary color of the piece"),
      style: z
        .string()
        .describe("Brief style description (materials, fit, details)"),
      rationale: z
        .string()
        .describe("Why this piece would complement the wardrobe"),
      compatiblePieceIds: z
        .array(z.number())
        .describe("IDs of existing wardrobe pieces this would work with"),
    }),
  )
  .min(3)
  .max(5);

/**
 * Schema for product search results from Gemini with Google Search
 */
export const ProductSearchResultsSchema = z
  .array(
    z.object({
      name: z.string(),
      retailer: z.string(),
      price: z.number().nullable(),
      currency: z.string().default("USD"),
      url: z.string(),
      imageUrl: z.string().nullable(),
    }),
  )
  .min(2)
  .max(3);

export type PieceSuggestionsResponse = z.infer<typeof PieceSuggestionsSchema>;
export type ProductSearchResultsResponse = z.infer<
  typeof ProductSearchResultsSchema
>;

/**
 * Schema for URL verification results with enriched product data
 */
export const UrlVerificationSchema = z.array(
  z.object({
    url: z.string().describe("The URL that was checked"),
    isValid: z
      .boolean()
      .describe(
        "True if the page loads and shows an available product for sale",
      ),
    reason: z
      .string()
      .optional()
      .describe(
        'Reason for the valid or invalid status: "404", "out of stock", "item unavailable", "page error", etc.',
      ),
    imageUrl: z
      .string()
      .nullable()
      .optional()
      .describe(
        "The main product image URL extracted from the page (high resolution if available)",
      ),
    availableSizes: z
      .array(z.string())
      .optional()
      .describe(
        'List of available sizes for the product (e.g., ["XS", "S", "M", "L"] or ["6", "8", "10"])',
      ),
  }),
);

export type UrlVerificationResponse = z.infer<typeof UrlVerificationSchema>;
