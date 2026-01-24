import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Generate structured JSON output with Zod schema validation
 * Calls the serverless API route to keep API key secure
 */
export async function generateStructured<T>({
	systemInstruction,
	prompt,
	schema,
	options,
	model,
	signal,
}: {
	systemInstruction?: string;
	prompt: string;
	schema: z.ZodSchema<T>;
	options?: {
		temperature?: number;
		tools?: Array<{ urlContext?: object } | { googleSearch?: object }>;
		maxTokens?: number;
	};
	model?: string;
	signal?: AbortSignal;
}): Promise<T> {
	if (signal?.aborted) {
		throw new DOMException('Aborted', 'AbortError');
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const jsonSchema = zodToJsonSchema(schema as any) as object;

	const response = await fetch('/api/gemini', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			action: 'generateStructured',
			prompt,
			systemInstruction,
			config: {
				temperature: options?.temperature ?? 0.7,
				tools: options?.tools ?? [],
				jsonSchema,
				maxTokens: options?.maxTokens ?? 20048,
				model,
			},
		}),
		signal,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(error.error || 'Gemini API request failed');
	}

	const { text } = await response.json();
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
	const response = await fetch('/api/gemini', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			action: 'generateText',
			prompt,
			config: {
				temperature: options?.temperature ?? 0.7,
				maxTokens: options?.maxTokens ?? 20048,
			},
		}),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(error.error || 'Gemini API request failed');
	}

	const { text } = await response.json();
	if (!text) {
		throw new Error('No response from Gemini');
	}

	return text;
}

/**
 * Generate streaming text output
 * Note: Streaming requires a different approach with server-sent events
 * For now, this falls back to non-streaming
 */
export async function* generateStream(
	prompt: string,
	options?: { temperature?: number }
): AsyncGenerator<string> {
	// Fallback to non-streaming for simplicity
	const text = await generateText(prompt, options);
	yield text;
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const jsonSchema = schema ? (zodToJsonSchema(schema as any) as object) : undefined;

	const response = await fetch('/api/gemini', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			action: 'generateWithImage',
			prompt,
			imageData: {
				base64: imageBase64,
				mimeType,
			},
			config: {
				jsonSchema,
			},
		}),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(error.error || 'Gemini API request failed');
	}

	const { text } = await response.json();
	if (!text) {
		throw new Error('No response from Gemini');
	}

	if (schema) {
		return schema.parse(JSON.parse(text)) as T extends undefined ? string : T;
	}
	return text as T extends undefined ? string : T;
}
