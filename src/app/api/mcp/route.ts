/**
 * MCP Server Route
 * Exposes wardrobe tools to Claude and other MCP-compatible clients
 *
 * Uses Edge Runtime for Web API compatibility with mcp-handler
 */

import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Define schema inline (same as db.ts pattern)
import {
	pgTable,
	serial,
	text,
	uuid,
	timestamp,
} from 'drizzle-orm/pg-core';

const users = pgTable('users', {
	id: uuid('id').primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name'),
	createdAt: timestamp('created_at').defaultNow(),
});

const pieces = pgTable('pieces', {
	id: serial('id').primaryKey(),
	userId: uuid('user_id').references(() => users.id).notNull(),
	name: text('name').notNull(),
	type: text('type').notNull(),
	color: text('color').notNull().default(''),
	style: text('style').notNull().default(''),
	designer: text('designer').notNull().default(''),
	productUrl: text('product_url'),
	originalImageUrl: text('original_image_url'),
	persistedImageUrl: text('persisted_image_url'),
	orderNumber: text('order_number'),
	orderDate: text('order_date'),
	orderRetailer: text('order_retailer'),
	createdAt: timestamp('created_at').defaultNow(),
});

// Types
const ClothingTypes = [
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
] as const;

type ClothingType = (typeof ClothingTypes)[number];

interface ClothesWithId {
	id: number;
	name: string;
	type: ClothingType;
	color: string;
	style: string;
	designer: string;
	productUrl?: string;
	imageUrl?: string;
}

// Helpers
function getDb() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error('DATABASE_URL not configured');
	const sql = neon(url);
	return drizzle(sql, { schema: { users, pieces } });
}

function generateFilename(originalUrl?: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	let extension = 'jpg';
	if (originalUrl) {
		const ext = originalUrl.split('.').pop()?.toLowerCase().split('?')[0];
		if (ext && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) {
			extension = ext === 'jpeg' ? 'jpg' : ext;
		}
	}
	return `wardrobe/${timestamp}-${random}.${extension}`;
}

function buildWardrobeContext(items: ClothesWithId[]): string {
	if (items.length === 0) return 'The wardrobe is currently empty.';

	const byType: Record<string, ClothesWithId[]> = {};
	for (const item of items) {
		const type = item.type.toUpperCase();
		if (!byType[type]) byType[type] = [];
		byType[type].push(item);
	}

	let context = `Your wardrobe contains ${items.length} pieces:\n\n`;
	for (const [type, typeItems] of Object.entries(byType)) {
		context += `${type} (${typeItems.length}):\n`;
		for (const item of typeItems) {
			const details = [item.color, item.style].filter(Boolean).join(', ');
			context += `- [ID:${item.id}] ${item.name} by ${item.designer}${details ? ` - ${details}` : ''}\n`;
		}
		context += '\n';
	}

	const colors = Array.from(new Set(items.map((i) => i.color).filter(Boolean)));
	const designers = Array.from(new Set(items.map((i) => i.designer).filter(Boolean)));
	context += `COLOR PALETTE: ${colors.join(', ') || 'Various'}\n`;
	context += `BRANDS: ${designers.join(', ') || 'Various'}\n`;

	return context;
}

// Schema for outfit recommendations
const OutfitRecommendationSchema = z.object({
	outfitName: z.string(),
	explanation: z.string(),
	pieceIds: z.array(z.number()),
	stylingTips: z.string().optional(),
});

// Create the MCP handler
const handler = createMcpHandler(
	(server) => {
		// Tool 1: Add piece to wardrobe
		server.tool(
			'addPieceToWardrobe',
			'Add a new clothing piece to the wardrobe. Returns the created piece ID.',
			{
				userId: z.string().uuid().describe('User UUID - required for all operations'),
				name: z.string().describe('Name of the clothing piece'),
				type: z.enum(ClothingTypes).describe('Type of clothing'),
				color: z.string().optional().describe('Primary color of the piece'),
				style: z.string().optional().describe('Style description (e.g., casual, formal)'),
				designer: z.string().optional().describe('Brand or designer name'),
				imageUrl: z.string().url().optional().describe('URL to product image'),
				productUrl: z.string().url().optional().describe('URL to product page'),
			},
			async ({ userId, imageUrl, productUrl, ...pieceData }) => {
				// Upload image if provided
				let persistedImageUrl: string | undefined;
				if (imageUrl) {
					try {
						let imageBlob: Blob;
						try {
							const response = await fetch(imageUrl);
							if (!response.ok) throw new Error('Failed to fetch');
							imageBlob = await response.blob();
						} catch {
							const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
							const response = await fetch(proxyUrl);
							if (!response.ok) throw new Error('Failed via proxy');
							imageBlob = await response.blob();
						}
						const blob = await put(generateFilename(imageUrl), imageBlob, {
							access: 'public',
							contentType: imageBlob.type || 'image/jpeg',
						});
						persistedImageUrl = blob.url;
					} catch (error) {
						console.error('Image upload failed:', error);
					}
				}

				// Insert into database
				const db = getDb();
				const [inserted] = await db
					.insert(pieces)
					.values({
						userId,
						name: pieceData.name,
						type: pieceData.type,
						color: pieceData.color || '',
						style: pieceData.style || '',
						designer: pieceData.designer || '',
						productUrl: productUrl || null,
						originalImageUrl: imageUrl || null,
						persistedImageUrl: persistedImageUrl || null,
					})
					.returning();

				const details = [
					pieceData.color && `Color: ${pieceData.color}`,
					pieceData.style && `Style: ${pieceData.style}`,
					pieceData.designer && `Designer: ${pieceData.designer}`,
					persistedImageUrl && 'Image uploaded',
				].filter(Boolean).join(', ');

				return {
					content: [{
						type: 'text' as const,
						text: `Added "${inserted.name}" (${inserted.type}) to wardrobe with ID ${inserted.id}.${details ? ` ${details}.` : ''}`,
					}],
				};
			}
		);

		// Tool 2: Get outfit recommendation
		server.tool(
			'getOutfit',
			'Get AI-powered outfit recommendations based on weather, occasion, and style preferences.',
			{
				userId: z.string().uuid().describe('User UUID - required for all operations'),
				weather: z.object({
					temperature: z.number().describe('Temperature in Fahrenheit'),
					condition: z.string().describe('Weather condition (sunny, rainy, cloudy, snowy, etc.)'),
				}).describe('Current weather conditions'),
				event: z.string().optional().describe('Occasion (e.g., "business meeting", "casual dinner", "date night")'),
				theme: z.string().optional().describe('Style theme (e.g., "minimalist", "colorful", "edgy")'),
			},
			async ({ userId, weather, event, theme }) => {
				const apiKey = process.env.GEMINI_API_KEY;
				if (!apiKey) {
					return {
						content: [{ type: 'text' as const, text: 'Gemini API not configured' }],
					};
				}

				// Fetch wardrobe
				const db = getDb();
				const userPieces = await db.select().from(pieces).where(eq(pieces.userId, userId));

				if (userPieces.length === 0) {
					return {
						content: [{
							type: 'text' as const,
							text: 'Your wardrobe is empty. Add some pieces first.',
						}],
					};
				}

				const clothesItems: ClothesWithId[] = userPieces.map((p) => ({
					id: p.id,
					name: p.name,
					type: p.type as ClothingType,
					color: p.color,
					style: p.style,
					designer: p.designer,
					productUrl: p.productUrl || undefined,
					imageUrl: p.persistedImageUrl || p.originalImageUrl || undefined,
				}));

				const wardrobeContext = buildWardrobeContext(clothesItems);

				const prompt = `You are a personal stylist creating an outfit recommendation.

WEATHER: ${weather.temperature}°F, ${weather.condition}
${event ? `OCCASION: ${event}` : ''}
${theme ? `STYLE: ${theme}` : ''}

WARDROBE:
${wardrobeContext}

Create a complete outfit that:
1. Is appropriate for ${weather.temperature}°F and ${weather.condition}
2. ${event ? `Suits: ${event}` : 'Works for everyday wear'}
3. Uses pieces from the inventory above
4. Considers layering if needed

IMPORTANT: Only use piece IDs from the wardrobe above.`;

				try {
					const client = new GoogleGenAI({ apiKey });
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const jsonSchema = zodToJsonSchema(OutfitRecommendationSchema as any) as object;

					const response = await client.models.generateContent({
						model: 'gemini-3-flash-preview',
						contents: prompt,
						config: {
							temperature: 0.7,
							responseMimeType: 'application/json',
							responseJsonSchema: jsonSchema,
							maxOutputTokens: 2048,
						},
					});

					const text = response.text;
					if (!text) throw new Error('No AI response');

					const result = OutfitRecommendationSchema.parse(JSON.parse(text));
					const validIds = result.pieceIds.filter((id) =>
						clothesItems.some((item) => item.id === id)
					);

					if (validIds.length === 0) {
						return {
							content: [{
								type: 'text' as const,
								text: 'Could not generate valid outfit from your wardrobe.',
							}],
						};
					}

					const selectedPieces = validIds
						.map((id) => clothesItems.find((item) => item.id === id))
						.filter(Boolean) as ClothesWithId[];

					const piecesList = selectedPieces
						.map((p) => `- ${p.name} by ${p.designer} (ID: ${p.id})`)
						.join('\n');

					return {
						content: [{
							type: 'text' as const,
							text: `**${result.outfitName}**\n\n${result.explanation}\n\n**Pieces:**\n${piecesList}${result.stylingTips ? `\n\n**Tips:** ${result.stylingTips}` : ''}`,
						}],
					};
				} catch (error) {
					return {
						content: [{
							type: 'text' as const,
							text: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
						}],
					};
				}
			}
		);
	},
	{
		serverInfo: {
			name: 'wardrobe-mcp',
			version: '1.0.0',
		},
	},
	{
		basePath: '/api',
		verboseLogs: true,
	}
);

// Export for Next.js (using Node.js runtime for compatibility with drizzle/neon)
// Note: Edge Runtime removed due to node:crypto dependency

export const GET = handler;
export const POST = handler;
