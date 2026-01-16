import { Clothes, ClothingType } from '../types';

const GEMINI_API_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
	candidates?: Array<{
		content: {
			parts: Array<{
				text: string;
			}>;
		};
	}>;
	error?: {
		message: string;
	};
}

/**
 * Fetches product page HTML content via a proxy or directly
 */
async function fetchProductPage(url: string): Promise<string> {
	// Use a CORS proxy for client-side fetching
	// In production, you'd want your own backend proxy
	const corsProxy = 'https://api.allorigins.win/raw?url=';
	const response = await fetch(corsProxy + encodeURIComponent(url));
	if (!response.ok) {
		throw new Error('Failed to fetch product page');
	}
	return response.text();
}

/**
 * Extracts clothing item details from a product URL using Gemini
 */
export async function extractProductDetails(
	productUrl: string
): Promise<Partial<Clothes>> {
	const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

	if (!apiKey) {
		throw new Error(
			'Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file.'
		);
	}

	// First, fetch the product page HTML
	let pageContent: string;
	try {
		pageContent = await fetchProductPage(productUrl);
		// Limit content to avoid token limits
		pageContent = pageContent.substring(0, 50000);
	} catch {
		// If fetching fails, we'll just use the URL
		pageContent = '';
	}

	const prompt = `Analyze this product URL and page content to extract clothing item details.

URL: ${productUrl}

Page content (HTML):
${pageContent}

Extract the following information and return it as a JSON object:
{
  "name": "Product name",
  "type": "One of: coat, jacket, denim, dress, skirt, top, pants, knitwear, shoes, bag, accessory, other",
  "color": "Primary color of the item",
  "style": "Brief style description (materials, fit, details)",
  "designer": "Brand or designer name",
  "imageUrl": "Main product image URL (look for og:image meta tag or main product image)"
}

Important:
- For "type", choose the most appropriate category from the list
- For "imageUrl", find the best quality product image URL from the page
- If you can't determine a field, use an empty string
- Return ONLY the JSON object, no additional text`;

	const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			contents: [
				{
					parts: [
						{
							text: prompt,
						},
					],
				},
			],
			generationConfig: {
				temperature: 0.1,
				maxOutputTokens: 1024,
			},
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error?.message || 'Failed to call Gemini API');
	}

	const data: GeminiResponse = await response.json();

	if (data.error) {
		throw new Error(data.error.message);
	}

	const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

	if (!textResponse) {
		throw new Error('No response from Gemini');
	}

	// Parse the JSON response
	try {
		// Extract JSON from the response (in case there's extra text)
		const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('No JSON found in response');
		}

		const parsed = JSON.parse(jsonMatch[0]);

		// Validate and normalize the type field
		const validTypes: ClothingType[] = [
			'coat',
			'jacket',
			'denim',
			'dress',
			'skirt',
			'top',
			'pants',
			'knitwear',
			'shoes',
			'bag',
			'accessory',
			'other',
		];

		const normalizedType = validTypes.includes(parsed.type?.toLowerCase())
			? (parsed.type.toLowerCase() as ClothingType)
			: 'other';

		return {
			name: parsed.name || '',
			type: normalizedType,
			color: parsed.color || '',
			style: parsed.style || '',
			designer: parsed.designer || '',
			imageUrl: parsed.imageUrl || '',
			productUrl: productUrl,
		};
	} catch {
		throw new Error('Failed to parse Gemini response');
	}
}
