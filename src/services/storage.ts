import { Outfit, Clothes, ClothesWithId } from '../types';
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
 * Ensure user is authenticated before database operations
 */
function requireUser(): string {
	if (!currentUserId) {
		throw new Error('User not authenticated');
	}
	return currentUserId;
}

/**
 * Storage service for wardrobe data using Neon database
 */
export const storage = {
	// ============= Outfit Methods =============

	async getOutfits(): Promise<Outfit[]> {
		const userId = requireUser();
		const db = getDb();
		const records = await db
			.select()
			.from(outfits)
			.where(eq(outfits.userId, userId));
		return records.map(outfitRecordToOutfit);
	},

	async getOutfitById(id: string): Promise<Outfit | null> {
		requireUser();
		const db = getDb();
		const [record] = await db
			.select()
			.from(outfits)
			.where(eq(outfits.id, id));
		return record ? outfitRecordToOutfit(record) : null;
	},

	async saveOutfit(outfit: Outfit): Promise<Outfit> {
		const userId = requireUser();
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
				userId,
				name: outfit.name,
				items,
			});
		}

		return outfit;
	},

	async deleteOutfit(id: string): Promise<void> {
		requireUser();
		const db = getDb();
		await db.delete(outfits).where(eq(outfits.id, id));
	},

	// ============= Wardrobe Methods =============

	async getWardrobe(): Promise<ClothesWithId[]> {
		const userId = requireUser();
		const db = getDb();
		const records = await db
			.select()
			.from(pieces)
			.where(eq(pieces.userId, userId));
		return records.map(pieceToClothes);
	},

	async addClothingItem(item: Clothes): Promise<ClothesWithId> {
		const userId = requireUser();
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
				userId,
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
	},

	async updateClothingItem(id: number, item: Clothes): Promise<ClothesWithId> {
		requireUser();
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
	},

	async deleteClothingItem(id: number): Promise<void> {
		const userId = requireUser();
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
			.where(eq(outfits.userId, userId));

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
	},

	/**
	 * Get a single clothing item by ID
	 */
	async getClothingItem(id: number): Promise<ClothesWithId | null> {
		requireUser();
		const db = getDb();
		const [piece] = await db.select().from(pieces).where(eq(pieces.id, id));
		return piece ? pieceToClothes(piece) : null;
	},
};
