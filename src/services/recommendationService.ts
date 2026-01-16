import {
	ClothesWithId,
	ClothingTypes,
	PieceSuggestion,
	ProductResult,
	RecommendationPreferences,
} from '../types';
import { generateStructured } from './gemini';
import { buildWardrobeContext } from './styleAssistant';
import { buildUserContext } from './memoryBank';
import { PieceSuggestionsSchema, ProductSearchResultsSchema } from './schemas';
import { getValues } from '../utilities/enum';

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

/**
 * Search for products matching an approved suggestion
 */
export async function searchProducts(
	suggestion: PieceSuggestion,
	preferences: RecommendationPreferences,
	signal?: AbortSignal
): Promise<ProductResult[]> {
	const description = suggestion.refinedDescription || suggestion.description;
	const preferredStores = preferences.stores
		.filter((s) => s.preference === 'preferred')
		.map((s) => s.name);
	const avoidedStores = preferences.stores
		.filter((s) => s.preference === 'avoided')
		.map((s) => s.name);

	// Try to find a relevant price limit based on clothing type keywords
	const descLower = description.toLowerCase();
	const matchedType = getValues(ClothingTypes).find((type) =>
		descLower.includes(type)
	);
	const priceLimit = preferences.priceLimits.find(
		(p) => p.clothingType === matchedType
	);

	const systemInstruction = `You are an expert personal shopper skilled at finding clothing products online that match specific style descriptions.`;

	const prompt = `TASK: Search for products matching this description: "${description}". You MUST use the google search tool to find real products currently for sale online.
	After you have found a product, use the URL Context tool to verify that the item is still available at the given link.

	${priceLimit ? `PRICE LIMIT: Under $${priceLimit.maxPrice}` : ''}

${
	preferredStores.length > 0
		? `PRIORITIZE these stores (search them first): ${preferredStores.join(
				', '
		  )}`
		: ''
}
${
	avoidedStores.length > 0
		? `AVOID these stores: ${avoidedStores.join(', ')}`
		: ''
}

Return an array of 3-10 actual products currently for sale online that match this description. For each product, provide:
- name: Full product name
- retailer: Store or brand name
- price: Price as a number (null if unavailable)
- currency: Currency code (default USD) as a string
- url: Direct link to the product page
- imageUrl: Product image URL (null if unavailable)

Focus on finding real, currently available products from legitimate retailers. Prioritize the preferred stores if specified.`;

	const result = await generateStructured({
		systemInstruction,
		prompt,
		schema: ProductSearchResultsSchema,
		options: {
			temperature: 0.1,
			tools: [{ googleSearch: {}, urlContext: {} }],
		},
		signal,
	});

	return result.map((p, i) => ({
		id: `product-${Date.now()}-${i}`,
		name: p.name,
		retailer: p.retailer,
		price: p.price,
		currency: p.currency,
		url: p.url,
		imageUrl: p.imageUrl,
		isPreferredStore: preferredStores.some((store) =>
			p.retailer.toLowerCase().includes(store.toLowerCase())
		),
	}));
}

/**
 * Direct search for a specific item type (user-entered query)
 */
export async function searchDirectItem(
	query: string,
	preferences: RecommendationPreferences,
	signal?: AbortSignal
): Promise<ProductResult[]> {
	const preferredStores = preferences.stores
		.filter((s) => s.preference === 'preferred')
		.map((s) => s.name);
	const avoidedStores = preferences.stores
		.filter((s) => s.preference === 'avoided')
		.map((s) => s.name);

	// Try to find a relevant price limit based on clothing type keywords
	const queryLower = query.toLowerCase();
	const matchedType = getValues(ClothingTypes).find((type) =>
		queryLower.includes(type)
	);
	const priceLimit = preferences.priceLimits.find(
		(p) => p.clothingType === matchedType
	);

	const systemInstruction = `You are an expert personal shopper skilled at finding clothing products online that match specific style descriptions.`;

	const prompt = `TASK: Search for products matching this description: "${query}". You MUST use the google search tool to find real products currently for sale online.
	After you have found a product, use the URL Context tool to verify that the item is still available at the given link.

	${priceLimit ? `PRICE LIMIT: Under $${priceLimit.maxPrice}` : ''}

${
	preferredStores.length > 0
		? `PRIORITIZE these stores (search them first): ${preferredStores.join(
				', '
		  )}`
		: ''
}
${
	avoidedStores.length > 0
		? `AVOID these stores: ${avoidedStores.join(', ')}`
		: ''
}

Return an array of 3-10 actual products currently for sale online that match this description. For each product, provide:
- name: Full product name
- retailer: Store or brand name
- price: Price as a number (null if unavailable)
- currency: Currency code (default USD) as a string
- url: Direct link to the product page
- imageUrl: Product image URL (null if unavailable)

Focus on finding real, currently available products from legitimate retailers. Prioritize the preferred stores if specified.`;

	const result = await generateStructured({
		systemInstruction,
		prompt,
		schema: ProductSearchResultsSchema,
		options: {
			temperature: 0.1,
			tools: [{ googleSearch: {}, urlContext: {} }],
		},
		signal,
	});

	return result.map((p, i) => ({
		id: `product-${Date.now()}-${i}`,
		name: p.name,
		retailer: p.retailer,
		price: p.price,
		currency: p.currency,
		url: p.url,
		imageUrl: p.imageUrl,
		isPreferredStore: preferredStores.some((store) =>
			p.retailer.toLowerCase().includes(store.toLowerCase())
		),
	}));
}
