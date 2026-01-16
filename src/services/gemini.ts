import { GoogleGenAI, ToolListUnion } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

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
export async function generateStructured<T>({
	prompt,
	schema,
	options,
	model,
}: {
	prompt: string;
	schema: z.ZodSchema<T>;
	options?: { temperature?: number; tools?: ToolListUnion };
	model?: string;
}): Promise<T> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const jsonSchema = zodToJsonSchema(schema as any) as object;
	const response = await getClient().models.generateContent({
		model: model ?? MODEL,
		contents: prompt,
		config: {
			responseMimeType: 'application/json',
			responseJsonSchema: jsonSchema,
			// responseSchema: jsonSchema,
			temperature: options?.temperature ?? 0.7,
			tools: options?.tools ?? [],
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
