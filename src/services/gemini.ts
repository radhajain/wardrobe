import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import { Clothes, ClothingType, ClothingTypes } from '../types';
import { ProductDetailsSchema } from './schemas';
import { getValues } from '../utilities/enum';

const MODEL = 'gemini-2.5-flash';

let client: GoogleGenAI | null = null;

/**
 * Get or create the Gemini client singleton
 */
function getClient(): GoogleGenAI {
	if (!client) {
		const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error(
				'Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file.'
			);
		}
		client = new GoogleGenAI({ apiKey });
	}
	return client;
}

/**
 * Generate structured JSON output with Zod schema validation
 */
export async function generateStructured<T>(
	prompt: string,
	schema: z.ZodSchema<T>,
	options?: { temperature?: number }
): Promise<T> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const jsonSchema = zodToJsonSchema(schema as any) as object;
	const response = await getClient().models.generateContent({
		model: MODEL,
		contents: prompt,
		config: {
			responseMimeType: 'application/json',
			responseSchema: jsonSchema,
			temperature: options?.temperature ?? 0.7,
		},
	});
	const text = response.text;
	if (!text) {
		throw new Error('No response from Gemini');
	}
	return schema.parse(JSON.parse(text));
}

/**
 * Generate plain text output
 */
export async function generateText(
	prompt: string,
	options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
	const response = await getClient().models.generateContent({
		model: MODEL,
		contents: prompt,
		config: {
			temperature: options?.temperature ?? 0.7,
			maxOutputTokens: options?.maxTokens ?? 2048,
		},
	});
	const text = response.text;
	if (!text) {
		throw new Error('No response from Gemini');
	}
	return text;
}

/**
 * Generate streaming text output
 */
export async function* generateStream(
	prompt: string,
	options?: { temperature?: number }
): AsyncGenerator<string> {
	const response = await getClient().models.generateContentStream({
		model: MODEL,
		contents: prompt,
		config: {
			temperature: options?.temperature ?? 0.7,
		},
	});
	for await (const chunk of response) {
		if (chunk.text) {
			yield chunk.text;
		}
	}
}

/**
 * Generate content with image input (multimodal)
 */
export async function generateWithImage<T>(
	prompt: string,
	imageBase64: string,
	mimeType: string,
	schema?: z.ZodSchema<T>
): Promise<T extends undefined ? string : T> {
	const config: {
		temperature: number;
		responseMimeType?: string;
		responseSchema?: object;
	} = { temperature: 0.1 };

	if (schema) {
		config.responseMimeType = 'application/json';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		config.responseSchema = zodToJsonSchema(schema as any) as object;
	}

	const response = await getClient().models.generateContent({
		model: MODEL,
		contents: [
			{
				role: 'user',
				parts: [
					{ text: prompt },
					{
						inlineData: {
							mimeType: mimeType,
							data: imageBase64,
						},
					},
				],
			},
		],
		config,
	});

	const text = response.text;
	if (!text) {
		throw new Error('No response from Gemini');
	}

	if (schema) {
		return schema.parse(JSON.parse(text)) as T extends undefined ? string : T;
	}
	return text as T extends undefined ? string : T;
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
- If you can't determine a field, use an empty string`;

	const result = await generateStructured(prompt, ProductDetailsSchema, {
		temperature: 0.1,
	});

	const normalizedType = getValues(ClothingTypes).includes(
		result.type?.toLowerCase() as ClothingType
	)
		? (result.type.toLowerCase() as ClothingType)
		: 'other';

	return {
		name: result.name,
		type: normalizedType,
		color: result.color,
		style: result.style,
		designer: result.designer,
		imageUrl: result.imageUrl,
		productUrl: productUrl,
	};
}
