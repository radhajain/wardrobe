import { Clothes, ClothingType, ClothingTypes } from '../types';
import { getValues } from '../utilities/enum';
import { generateStructured } from './gemini';
import { ProductDetailsSchema } from './schemas';

/**
 * Extracts clothing item details from a product URL using Gemini
 */
export async function extractProductDetails(
	productUrl: string,
	signal?: AbortSignal
): Promise<Partial<Clothes>> {
	// Check if already aborted
	if (signal?.aborted) {
		throw new DOMException('Aborted', 'AbortError');
	}
	const systemInstruction = `You are an expert at extracting structured clothing product details from e-commerce web pages.`;
	const prompt = `Analyze this product URL and page content to extract clothing item details.

URL: ${productUrl}

Extract the following information:
{
  "name": "Product name",
  "type": "One of: ${getValues(ClothingTypes).join(', ')}",
  "color": "Primary color of the item",
  "style": "Brief style description (materials, fit, details)",
  "designer": "Brand or designer name",
  "imageUrl": "Main product image URL (look for og:image meta tag or main product image)"
}

Important:
- For "type", choose the most appropriate category from the list
- For "imageUrl", find the best quality product image URL from the page
- If you can't determine a field, use an empty string`;

	const result = await generateStructured({
		systemInstruction,
		prompt,
		schema: ProductDetailsSchema,
		options: {
			temperature: 0.1,
			tools: [{ urlContext: {} }, { googleSearch: {} }],
			maxTokens: 2048,
		},
		signal,
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
