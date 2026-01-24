import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3-flash-preview';

export const config = {
	runtime: 'edge',
};

export default async function handler(req: Request) {
	if (req.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 });
	}

	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		return new Response('Gemini API key not configured', { status: 500 });
	}

	try {
		const body = await req.json();
		const { action, prompt, systemInstruction, config: reqConfig, imageData } = body;

		const client = new GoogleGenAI({ apiKey });

		if (action === 'generateStructured') {
			const response = await client.models.generateContent({
				model: reqConfig?.model ?? MODEL,
				contents: prompt,
				config: {
					temperature: reqConfig?.temperature ?? 0.7,
					tools: reqConfig?.tools ?? [],
					responseMimeType: 'application/json',
					systemInstruction: systemInstruction,
					responseJsonSchema: reqConfig?.jsonSchema,
					maxOutputTokens: reqConfig?.maxTokens ?? 20048,
				},
			});

			return Response.json({ text: response.text });
		}

		if (action === 'generateText') {
			const response = await client.models.generateContent({
				model: MODEL,
				contents: prompt,
				config: {
					temperature: reqConfig?.temperature ?? 0.7,
					maxOutputTokens: reqConfig?.maxTokens ?? 20048,
				},
			});

			return Response.json({ text: response.text });
		}

		if (action === 'generateWithImage') {
			const config: {
				temperature: number;
				responseMimeType?: string;
				responseSchema?: object;
			} = { temperature: 0.1 };

			if (reqConfig?.jsonSchema) {
				config.responseMimeType = 'application/json';
				config.responseSchema = reqConfig.jsonSchema;
			}

			const response = await client.models.generateContent({
				model: MODEL,
				contents: [
					{
						role: 'user',
						parts: [
							{ text: prompt },
							{
								inlineData: {
									mimeType: imageData.mimeType,
									data: imageData.base64,
								},
							},
						],
					},
				],
				config,
			});

			return Response.json({ text: response.text });
		}

		return new Response('Invalid action', { status: 400 });
	} catch (error) {
		console.error('Gemini API error:', error);
		return new Response(
			JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}
