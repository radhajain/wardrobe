import {
	ClothesWithId,
	ClothingTypes,
	PieceSuggestion,
	RecommendationPreferences,
} from '../types';
import { getValues } from '../utilities/enum';
import { generateStructured } from './gemini';
import { buildUserContext } from './memoryBank';
import { PieceSuggestionsSchema } from './schemas';
import { buildWardrobeContext } from './styleAssistant';

/**
 * Extract unique retailers from wardrobe order history
 */
export function extractRetailersFromWardrobe(items: ClothesWithId[]): string[] {
	const retailers = new Set<string>();
	for (const item of items) {
		if (item.order?.retailer) {
			retailers.add(item.order.retailer);
		}
	}
	return Array.from(retailers).sort();
}

/**
 * Generate piece type suggestions based on wardrobe analysis
 */
export async function generatePieceSuggestions(
	wardrobe: ClothesWithId[],
	preferences: RecommendationPreferences,
	signal?: AbortSignal
): Promise<PieceSuggestion[]> {
	const wardrobeContext = buildWardrobeContext(wardrobe);
	const userContext = buildUserContext();

	const preferredStores = preferences.stores
		.filter((s) => s.preference === 'preferred')
		.map((s) => s.name);
	const avoidedStores = preferences.stores
		.filter((s) => s.preference === 'avoided')
		.map((s) => s.name);
	const priceLimitsText = preferences.priceLimits
		.map((p) => `${p.clothingType}: max $${p.maxPrice}`)
		.join(', ');

	const systemInstruction = `You are a personal stylist analyzing a wardrobe to suggest new pieces that would enhance it.`;

	const prompt = `TASK: Analyze the wardrobe and suggest 3-5 specific piece types that would enhance this collection. For each suggestion:

Give an array of the following information for each suggestion:
{
  "description":  Be specific about style, and type (e.g., "Cropped wool jacket" not just "jacket")
  "type": "One of: ${getValues(ClothingTypes).join(', ')}",
  "color": "Primary color of the item",
  "style": "Brief style description (materials, fit, details)",
  "rationale": "Why this piece would complement the existing wardrobe - what gap does it fill? What outfits would it enable?",
  "compatiblePieceIds": "Array of existing piece ID numbers that this new piece would pair well with"
}

Focus on pieces that would be versatile and work with multiple existing items. Consider both gaps in the wardrobe and opportunities to create new outfit combinations.

USER SHOPPING PREFERENCES:
- Preferred stores: ${preferredStores.join(', ') || 'None specified'}
- Avoided stores: ${avoidedStores.join(', ') || 'None'}
- Price limits: ${priceLimitsText || 'None specified'}

USER CONTEXT:
${userContext}
WARDROBE INVENTORY:
${wardrobeContext}
`;

	const result = await generateStructured({
		systemInstruction,
		prompt,
		schema: PieceSuggestionsSchema,
		signal,
	});

	return result.map((s, i) => ({
		id: `suggestion-${Date.now()}-${i}`,
		description: s.description,
		rationale: s.rationale,
		compatiblePieceIds: s.compatiblePieceIds.filter((id) =>
			wardrobe.some((item) => item.id === id)
		),
		status: 'pending' as const,
	}));
}
