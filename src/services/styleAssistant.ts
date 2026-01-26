import {
	ClothesWithId,
	ChatMessage,
	ChatConversation,
	ItemReference,
	ClothesId,
	OutfitSuggestion,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { recordQuery, buildUserContext } from './memoryBank';
import { generateText, generateStructured } from './gemini';
import { OutfitSuggestionSchema } from './schemas';

const CHAT_STORAGE_KEY = 'wardrobe_style_chat';
const MAX_HISTORY_MESSAGES = 10;

/**
 * Builds a context string describing the user's wardrobe for AI consumption
 */
export function buildWardrobeContext(items: ClothesWithId[]): string {
	if (items.length === 0) {
		return 'The wardrobe is currently empty.';
	}

	// Group items by type
	const byType: Record<string, ClothesWithId[]> = {};
	for (const item of items) {
		const type = item.type.toUpperCase();
		if (!byType[type]) {
			byType[type] = [];
		}
		byType[type].push(item);
	}

	// Build context string
	let context = `Your wardrobe contains ${items.length} pieces:\n\n`;

	for (const [type, typeItems] of Object.entries(byType)) {
		context += `${type} (${typeItems.length}):\n`;
		for (const item of typeItems) {
			const details = [item.color, item.style].filter(Boolean).join(', ');
			context += `- [ID:${item.id}] ${item.name} by ${item.designer}${
				details ? ` - ${details}` : ''
			}\n`;
		}
		context += '\n';
	}

	// Add summary insights
	const colors = Array.from(new Set(items.map((i) => i.color).filter(Boolean)));
	const designers = Array.from(
		new Set(items.map((i) => i.designer).filter(Boolean))
	);

	context += `COLOR PALETTE: ${colors.join(', ') || 'Various'}\n`;
	context += `BRANDS: ${designers.join(', ') || 'Various'}\n`;

	return context;
}

/**
 * Formats chat history for AI context
 */
function formatChatHistory(messages: ChatMessage[]): string {
	const recent = messages.slice(-MAX_HISTORY_MESSAGES);
	if (recent.length === 0) return '';

	return recent
		.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
		.join('\n\n');
}

/**
 * System prompt for the style assistant
 */
function getSystemPrompt(wardrobeContext: string, userContext: string): string {
	return `You are a personal style advisor with deep knowledge of fashion. You have access to the user's complete wardrobe inventory.

${userContext}WARDROBE INVENTORY:
${wardrobeContext}

IMPORTANT RULES:
1. Be specific - reference actual pieces by name and include their [ID:X] when mentioning specific items
2. Consider color harmony, brand consistency, and style coherence
3. When suggesting outfits or pieces, always reference the item's ID in the format [ID:X]
4. Keep responses concise but insightful
5. Maintain a sophisticated, knowledgeable tone befitting a high-end stylist
6. When asked about style evolution or new pieces, consider the user's existing aesthetic
7. You can use markdown formatting in your responses (bold, italic, lists, headers)`;
}

/**
 * Extracts item references from AI response text
 */
export function extractItemReferences(
	text: string,
	items: ClothesWithId[]
): ItemReference[] {
	const references: ItemReference[] = [];
	const idPattern = /\[ID:(\d+)\]/g;
	let match;

	while ((match = idPattern.exec(text)) !== null) {
		const id = parseInt(match[1], 10);
		const item = items.find((i) => i.id === id);
		if (item && !references.some((r) => r.clothesId === id)) {
			references.push({
				clothesId: id,
				name: item.name,
			});
		}
	}

	return references;
}

/**
 * Chat storage utilities
 */
export const chatStorage = {
	getConversation(): ChatConversation {
		const raw = localStorage.getItem(CHAT_STORAGE_KEY);
		if (!raw) {
			return { messages: [], lastUpdated: new Date().toISOString() };
		}
		return JSON.parse(raw) as ChatConversation;
	},

	saveConversation(conversation: ChatConversation): void {
		localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversation));
	},

	addMessage(message: ChatMessage): ChatConversation {
		const conversation = this.getConversation();
		conversation.messages.push(message);
		conversation.lastUpdated = new Date().toISOString();
		this.saveConversation(conversation);
		return conversation;
	},

	clearConversation(): void {
		localStorage.removeItem(CHAT_STORAGE_KEY);
	},
};

/**
 * Sends a chat message to the style assistant and returns the response
 */
export async function sendStyleChat(
	userMessage: string,
	wardrobe: ClothesWithId[],
	conversationHistory: ChatMessage[]
): Promise<ChatMessage> {
	// Record the query for memory bank (don't await to avoid blocking)
	recordQuery(userMessage, 'stylist').catch(console.error);

	const wardrobeContext = buildWardrobeContext(wardrobe);
	const userContext = buildUserContext();
	const systemPrompt = getSystemPrompt(wardrobeContext, userContext);
	const historyContext = formatChatHistory(conversationHistory);

	const fullPrompt = `${systemPrompt}

${
	historyContext ? `CONVERSATION HISTORY:\n${historyContext}\n\n` : ''
}User: ${userMessage}

Respond as the style assistant. Remember to include [ID:X] when referencing specific wardrobe items. Use **markdown formatting** for better readability.`;

	const textResponse = await generateText(fullPrompt);

	const itemReferences = extractItemReferences(textResponse, wardrobe);

	return {
		id: uuidv4(),
		role: 'assistant',
		content: textResponse,
		timestamp: new Date().toISOString(),
		itemReferences: itemReferences.length > 0 ? itemReferences : undefined,
	};
}

/**
 * Gets outfit suggestions for the Builder based on current canvas items and optional occasion
 */
export async function getOutfitSuggestions(
	wardrobe: ClothesWithId[],
	currentItemIds: ClothesId[],
	occasion?: string
): Promise<OutfitSuggestion> {
	// Record this as a query for memory bank
	const queryDescription = occasion
		? `Requesting outfit suggestions for: ${occasion}`
		: 'Requesting outfit suggestions in builder';
	recordQuery(queryDescription, 'builder').catch(console.error);

	const wardrobeContext = buildWardrobeContext(wardrobe);
	const userContext = buildUserContext();

	// Get current items
	const currentItems = currentItemIds
		.map((id) => wardrobe.find((i) => i.id === id))
		.filter(Boolean) as ClothesWithId[];

	const currentItemsText =
		currentItems.length > 0
			? currentItems
					.map((i) => `- [ID:${i.id}] ${i.name} by ${i.designer}`)
					.join('\n')
			: 'No items selected yet';

	const occasionContext = occasion
		? `\nOCCASION/CONTEXT: ${occasion}\nPlease suggest an outfit specifically suited for this occasion. Consider weather, formality, and practical needs mentioned.`
		: '';

	const prompt = `${getSystemPrompt(wardrobeContext, userContext)}

CURRENT OUTFIT IN PROGRESS:
${currentItemsText}
${occasionContext}

${
	occasion
		? `Create a complete outfit from the wardrobe that would be perfect for: "${occasion}". Consider all aspects mentioned (weather, occasion type, activities, etc.).`
		: 'Based on the items currently in the outfit (if any), suggest complementary pieces from the wardrobe that would complete or enhance this outfit. If no items are selected, suggest a complete outfit.'
}

Respond with:
- explanation: Brief explanation of why these pieces work together${occasion ? ' and why they suit the occasion' : ''}
- suggestedItemIds: Array of item IDs (numbers) that would work well together

Only include item IDs that exist in the wardrobe. Suggest 3-6 items that would create a complete, cohesive outfit.`;

	const result = await generateStructured({
		prompt,
		schema: OutfitSuggestionSchema,
	});

	// Validate suggested IDs exist in wardrobe
	const validIds = result.suggestedItemIds.filter((id) =>
		wardrobe.some((i) => i.id === id)
	);

	return {
		explanation:
			result.explanation || 'Here are some suggestions for your outfit.',
		suggestedItemIds: validIds,
	};
}
