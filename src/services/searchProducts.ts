import {
	ClothingTypes,
	PieceSuggestion,
	ProductResult,
	RecommendationPreferences,
} from '../types';
import { getValues } from '../utilities/enum';
import { generateStructured } from './gemini';
import { ProductSearchResultsSchema, UrlVerificationSchema } from './schemas';

/**
 * Verify product URLs using Gemini's urlContext tool
 * Filters out products where the page doesn't exist or item is unavailable
 * Also enriches products with verified imageUrl and available sizes
 */
async function verifyProductUrls(
	products: ProductResult[],
	signal?: AbortSignal
): Promise<ProductResult[]> {
	if (products.length === 0) return products;

	const urls = products.map((p) => p.url);

	const systemInstruction =
		'You are a URL verification assistant that checks product pages and extracts product information.';

	const verificationPrompt = `Use the urlContext tool to check each of these product URLs.

For each URL, determine:
1. Is the page valid? (loads successfully, not a 404 or error page)
2. Is the product CURRENTLY FOR SALE? (not "sold out", "out of stock", "item unavailable", "no longer available", etc.)
3. What is the main product image URL? (extract the primary/hero product image, preferably high resolution)
4. What sizes are currently available? (list only sizes that are in stock and can be purchased)

URLs to verify:
${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

For each URL, return:
- url: the original URL you are checking
- isValid: true ONLY if the product page exists AND the item is available for purchase
- reason: explanation of status (e.g., "available", "out of stock", "404 page not found")
- imageUrl: the main product image URL from the page (null if not found)
- availableSizes: array of available sizes (e.g., ["XS", "S", "M"] or ["6", "8", "10"])`;

	console.log('verifying...');

	try {
		const results = await generateStructured({
			systemInstruction,
			prompt: verificationPrompt,
			schema: UrlVerificationSchema,
			options: {
				temperature: 0,
				tools: [{ urlContext: {} }],
				maxTokens: 35000,
			},
			signal,
		});

		console.log({ verificationResults: results });

		// Create a map of URL to verification results
		const verificationMap = new Map(results.map((r) => [r.url, r]));

		// Filter and enrich products with verified data
		return products
			.filter((p) => verificationMap.get(p.url)?.isValid)
			.map((p) => {
				const verification = verificationMap.get(p.url);
				return {
					...p,
					// Use verified imageUrl if available, otherwise keep original
					imageUrl: verification?.imageUrl || p.imageUrl,
					// Add available sizes
					availableSizes: verification?.availableSizes,
				};
			});
	} catch (error) {
		// If verification fails, return original products rather than failing completely
		console.warn(
			'URL verification failed, returning unverified products:',
			error
		);
		return products;
	}
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

	const prompt = `TASK: Search for 3 for-sale products matching this description: "${description}". You MUST use the google search tool to find real products currently for sale online.
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

Return an array of 3 actual products currently for sale online that match this description. For each product, provide:
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
			maxTokens: 50000,
		},
		signal,
	});

	const products = result.map((p, i) => ({
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

	// Verify URLs to filter out unavailable products
	return verifyProductUrls(products, signal);
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

Return an array of 3 actual products currently for sale online that match this description. For each product, provide:
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

	const products = result.map((p, i) => ({
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

	// Verify URLs to filter out unavailable products
	return verifyProductUrls(products, signal);
}
