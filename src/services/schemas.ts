import { z } from 'zod';

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
