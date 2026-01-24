import { StorageData, Outfit, Clothes, ClothesWithId } from '../types';
import { sampleWardrobe } from '../data/sample-wardrobe';
import {
	getDb,
	pieces,
	outfits,
	Piece,
	OutfitRecord,
	OutfitItemJson,
} from '../db';
import { eq } from 'drizzle-orm';
import {
	uploadImageToBlob,
	deleteImageFromBlob,
	isBlobConfigured,
} from './blobStorage';

const STORAGE_KEY = 'wardrobe_app_data';
const CURRENT_VERSION = 2;

/**
 * Check if database is configured
 */
function isDatabaseConfigured(): boolean {
	return !!import.meta.env.VITE_DATABASE_URL;
}

/**
 * Current user ID (set after authentication)
 */
let currentUserId: string | null = null;

/**
 * Set the current user for database operations
 */
export function setCurrentUser(userId: string | null): void {
	currentUserId = userId;
}

/**
 * Get the current user ID
 */
export function getCurrentUser(): string | null {
	return currentUserId;
}

/**
 * Convert database piece to app Clothes type
 */
function pieceToClothes(piece: Piece): ClothesWithId {
	return {
		id: piece.id,
		name: piece.name,
		type: piece.type,
		color: piece.color,
		style: piece.style,
		designer: piece.designer,
		productUrl: piece.productUrl ?? undefined,
		// Prefer Blob URL, fall back to original
		imageUrl: piece.persistedImageUrl ?? piece.originalImageUrl ?? undefined,
		order:
			piece.orderNumber || piece.orderDate
				? {
						orderNumber: piece.orderNumber ?? '',
						orderDate: piece.orderDate ?? '',
						retailer: piece.orderRetailer ?? undefined,
					}
				: undefined,
	};
}

/**
 * Convert database outfit to app Outfit type
 */
function outfitRecordToOutfit(record: OutfitRecord): Outfit {
	return {
		id: record.id,
		name: record.name,
		items: (record.items as OutfitItemJson[]).map((item) => ({
			id: item.id,
			clothesId: item.pieceId,
			position: item.position,
			customImageUrl: item.customImageUrl,
			crop: item.crop,
		})),
		createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
		updatedAt: record.updatedAt?.toISOString() ?? new Date().toISOString(),
	};
}

/**
 * Storage abstraction that supports both localStorage and Neon database.
 * Uses database when configured and user is authenticated, falls back to localStorage.
 */
export const storage = {
	/**
	 * Check if using database or localStorage
	 */
	isUsingDatabase(): boolean {
		return isDatabaseConfigured() && !!currentUserId;
	},

	/**
	 * Initialize storage - for localStorage fallback
	 */
	async initialize(): Promise<StorageData> {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			const initial: StorageData = {
				outfits: [],
				wardrobe: sampleWardrobe,
				version: CURRENT_VERSION,
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
			return initial;
		}

		const data = JSON.parse(raw) as StorageData;

		// Migration: Add wardrobe if missing (version 1 -> 2)
		if (!data.wardrobe) {
			data.wardrobe = sampleWardrobe;
			data.version = CURRENT_VERSION;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		}

		return data;
	},

	// ============= Outfit Methods =============

	async getOutfits(): Promise<Outfit[]> {
		if (this.isUsingDatabase()) {
			const db = getDb();
			const records = await db
				.select()
				.from(outfits)
				.where(eq(outfits.userId, currentUserId!));
			return records.map(outfitRecordToOutfit);
		}

		const data = await this.initialize();
		return data.outfits;
	},

	async getOutfitById(id: string): Promise<Outfit | null> {
		if (this.isUsingDatabase()) {
			const db = getDb();
			const [record] = await db
				.select()
				.from(outfits)
				.where(eq(outfits.id, id));
			return record ? outfitRecordToOutfit(record) : null;
		}

		const allOutfits = await this.getOutfits();
		return allOutfits.find((o) => o.id === id) || null;
	},

	async saveOutfit(outfit: Outfit): Promise<Outfit> {
		if (this.isUsingDatabase()) {
			const db = getDb();
			const items: OutfitItemJson[] = outfit.items.map((item) => ({
				id: item.id,
				pieceId: item.clothesId,
				position: item.position,
				customImageUrl: item.customImageUrl,
				crop: item.crop,
			}));

			// Check if outfit exists
			const [existing] = await db
				.select()
				.from(outfits)
				.where(eq(outfits.id, outfit.id));

			if (existing) {
				await db
					.update(outfits)
					.set({
						name: outfit.name,
						items,
						updatedAt: new Date(),
					})
					.where(eq(outfits.id, outfit.id));
			} else {
				await db.insert(outfits).values({
					id: outfit.id,
					userId: currentUserId!,
					name: outfit.name,
					items,
				});
			}

			return outfit;
		}

		// localStorage fallback
		const data = await this.initialize();
		const existingIndex = data.outfits.findIndex((o) => o.id === outfit.id);

		if (existingIndex >= 0) {
			data.outfits[existingIndex] = {
				...outfit,
				updatedAt: new Date().toISOString(),
			};
		} else {
			data.outfits.push(outfit);
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		return outfit;
	},

	async deleteOutfit(id: string): Promise<void> {
		if (this.isUsingDatabase()) {
			const db = getDb();
			await db.delete(outfits).where(eq(outfits.id, id));
			return;
		}

		const data = await this.initialize();
		data.outfits = data.outfits.filter((o) => o.id !== id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	},

	// ============= Wardrobe Methods =============

	async getWardrobe(): Promise<ClothesWithId[]> {
		if (this.isUsingDatabase()) {
			const db = getDb();
			const records = await db
				.select()
				.from(pieces)
				.where(eq(pieces.userId, currentUserId!));
			return records.map(pieceToClothes);
		}

		const data = await this.initialize();
		// Add index as ID for localStorage items
		return data.wardrobe.map((item, index) => ({ ...item, id: index }));
	},

	async addClothingItem(item: Clothes): Promise<ClothesWithId> {
		if (this.isUsingDatabase()) {
			const db = getDb();

			let blobImageUrl: string | undefined;

			// Upload to Vercel Blob if configured
			if (item.imageUrl && isBlobConfigured()) {
				try {
					const result = await uploadImageToBlob(item.imageUrl);
					blobImageUrl = result.url;
				} catch (error) {
					console.warn('Failed to upload image to Vercel Blob:', error);
				}
			}

			const [inserted] = await db
				.insert(pieces)
				.values({
					userId: currentUserId!,
					name: item.name,
					type: item.type,
					color: item.color,
					style: item.style,
					designer: item.designer,
					productUrl: item.productUrl,
					originalImageUrl: item.imageUrl,
					persistedImageUrl: blobImageUrl,
					orderNumber: item.order?.orderNumber ?? null,
					orderDate: item.order?.orderDate ?? null,
					orderRetailer: item.order?.retailer ?? null,
				})
				.returning();

			return pieceToClothes(inserted);
		}

		// localStorage fallback
		const data = await this.initialize();
		data.wardrobe.push(item);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		return { ...item, id: data.wardrobe.length - 1 };
	},

	async updateClothingItem(id: number, item: Clothes): Promise<ClothesWithId> {
		if (this.isUsingDatabase()) {
			const db = getDb();

			// Check if image changed
			const [existing] = await db
				.select()
				.from(pieces)
				.where(eq(pieces.id, id));

			let blobImageUrl = existing?.persistedImageUrl;

			// If image URL changed, upload new one to Vercel Blob
			if (item.imageUrl && item.imageUrl !== existing?.originalImageUrl) {
				if (isBlobConfigured()) {
					// Delete old Blob image if exists
					if (existing?.persistedImageUrl) {
						try {
							await deleteImageFromBlob(existing.persistedImageUrl);
						} catch (error) {
							console.warn('Failed to delete old Blob image:', error);
						}
					}

					// Upload new image
					try {
						const result = await uploadImageToBlob(item.imageUrl);
						blobImageUrl = result.url;
					} catch (error) {
						console.warn('Failed to upload new image to Vercel Blob:', error);
					}
				}
			}

			const [updated] = await db
				.update(pieces)
				.set({
					name: item.name,
					type: item.type,
					color: item.color,
					style: item.style,
					designer: item.designer,
					productUrl: item.productUrl,
					originalImageUrl: item.imageUrl,
					persistedImageUrl: blobImageUrl,
					orderNumber: item.order?.orderNumber ?? null,
					orderDate: item.order?.orderDate ?? null,
					orderRetailer: item.order?.retailer ?? null,
				})
				.where(eq(pieces.id, id))
				.returning();

			return pieceToClothes(updated);
		}

		// localStorage fallback
		const data = await this.initialize();
		if (id >= 0 && id < data.wardrobe.length) {
			data.wardrobe[id] = item;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		}
		return { ...item, id };
	},

	async deleteClothingItem(id: number): Promise<void> {
		if (this.isUsingDatabase()) {
			const db = getDb();

			// Get piece to delete Blob image
			const [piece] = await db.select().from(pieces).where(eq(pieces.id, id));

			if (piece?.persistedImageUrl && isBlobConfigured()) {
				try {
					await deleteImageFromBlob(piece.persistedImageUrl);
				} catch (error) {
					console.warn('Failed to delete Blob image:', error);
				}
			}

			// Delete from database
			await db.delete(pieces).where(eq(pieces.id, id));

			// Update outfits that contain this piece
			const userOutfits = await db
				.select()
				.from(outfits)
				.where(eq(outfits.userId, currentUserId!));

			for (const outfit of userOutfits) {
				const items = (outfit.items as OutfitItemJson[]).filter(
					(item) => item.pieceId !== id,
				);
				if (items.length !== (outfit.items as OutfitItemJson[]).length) {
					await db
						.update(outfits)
						.set({ items, updatedAt: new Date() })
						.where(eq(outfits.id, outfit.id));
				}
			}

			return;
		}

		// localStorage fallback
		const data = await this.initialize();
		if (id >= 0 && id < data.wardrobe.length) {
			data.wardrobe.splice(id, 1);

			// Remove from outfits and update indices
			data.outfits = data.outfits.map((outfit) => ({
				...outfit,
				items: outfit.items
					.filter((item) => item.clothesId !== id)
					.map((item) => ({
						...item,
						clothesId:
							item.clothesId > id ? item.clothesId - 1 : item.clothesId,
					})),
				updatedAt: new Date().toISOString(),
			}));

			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		}
	},

	/**
	 * Get a single clothing item by ID
	 */
	async getClothingItem(id: number): Promise<ClothesWithId | null> {
		if (this.isUsingDatabase()) {
			const db = getDb();
			const [piece] = await db.select().from(pieces).where(eq(pieces.id, id));
			return piece ? pieceToClothes(piece) : null;
		}

		const data = await this.initialize();
		if (id >= 0 && id < data.wardrobe.length) {
			return { ...data.wardrobe[id], id };
		}
		return null;
	},
};
