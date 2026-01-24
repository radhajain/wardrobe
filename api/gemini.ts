import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL = 'gemini-3-flash-preview';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'POST') {
		return res.status(405).send('Method not allowed');
	}

	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		return res.status(500).send('Gemini API key not configured');
	}

	try {
		const { action, prompt, systemInstruction, config: reqConfig, imageData } = req.body;

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

			return res.json({ text: response.text });
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

			return res.json({ text: response.text });
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

			return res.json({ text: response.text });
		}

		return res.status(400).send('Invalid action');
	} catch (error) {
		console.error('Gemini API error:', error);
		return res.status(500).json({
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}
