import { getDb, outfits, pieces } from '../db';
import { Clothes, Outfit, StorageData } from '../types';
import { isBlobConfigured, uploadImageToBlob } from './blobStorage';

const MIGRATION_KEY = 'wardrobe_migration_complete';
const STORAGE_KEY = 'wardrobe_app_data';

/**
 * Check if migration has already been completed
 */
export function isMigrationComplete(): boolean {
	return localStorage.getItem(MIGRATION_KEY) === 'true';
}

/**
 * Mark migration as complete
 */
function markMigrationComplete(): void {
	localStorage.setItem(MIGRATION_KEY, 'true');
}

/**
 * Get existing localStorage data
 */
function getLocalStorageData(): StorageData | null {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;

	try {
		return JSON.parse(raw) as StorageData;
	} catch {
		return null;
	}
}

/**
 * Migrate a single piece to the database and Vercel Blob
 * @returns The new database ID for the piece
 */
async function migratePiece(
	piece: Clothes,
	userId: string,
	uploadToBlob: boolean,
): Promise<number> {
	const db = getDb();

	let blobImageUrl: string | undefined;

	// Upload image to Vercel Blob if configured and piece has an image
	if (uploadToBlob && piece.imageUrl && isBlobConfigured()) {
		try {
			const result = await uploadImageToBlob(piece.imageUrl);
			blobImageUrl = result.url;
			console.log(`Uploaded image for "${piece.name}" to Vercel Blob`);
		} catch (error) {
			console.warn(`Failed to upload image for "${piece.name}":`, error);
			// Continue without Blob URL - will use original URL as fallback
		}
	}

	// Insert into database
	const [inserted] = await db
		.insert(pieces)
		.values({
			userId,
			name: piece.name,
			type: piece.type,
			color: piece.color || '',
			style: piece.style || '',
			designer: piece.designer || '',
			productUrl: piece.productUrl ? piece.productUrl : null,
			originalImageUrl: piece.imageUrl ? piece.imageUrl : null,
			persistedImageUrl: blobImageUrl ? blobImageUrl : null,
			orderNumber: piece.order?.orderNumber ? piece.order.orderNumber : null,
			orderDate: piece.order?.orderDate ? piece.order.orderDate : null,
			orderRetailer: piece.order?.retailer ? piece.order.retailer : null,
		})
		.returning({ id: pieces.id });

	return inserted.id;
}

/**
 * Migrate an outfit to the database
 * @param oldToNewIdMap Maps old piece indices to new database IDs
 */
async function migrateOutfit(
	outfit: Outfit,
	userId: string,
	oldToNewIdMap: Map<number, number>,
): Promise<void> {
	const db = getDb();

	// Convert outfit items to use new piece IDs
	const migratedItems = outfit.items.map((item) => ({
		id: item.id,
		pieceId: oldToNewIdMap.get(item.clothesId) ?? item.clothesId,
		position: item.position,
		customImageUrl: item.customImageUrl,
		crop: item.crop,
	}));

	await db.insert(outfits).values({
		id: outfit.id,
		userId,
		name: outfit.name,
		items: migratedItems,
		createdAt: new Date(outfit.createdAt),
		updatedAt: new Date(outfit.updatedAt),
	});
}

/**
 * Progress callback for migration UI
 */
export interface MigrationProgress {
	phase: 'pieces' | 'outfits' | 'complete';
	current: number;
	total: number;
	currentItem?: string;
}

/**
 * Migrate all data from localStorage to Neon database and Vercel Blob
 * @param userId The authenticated user's ID
 * @param onProgress Optional callback for progress updates
 * @param uploadToBlob Whether to upload images to Vercel Blob (default: true)
 */
export async function migrateFromLocalStorage(
	userId: string,
	onProgress?: (progress: MigrationProgress) => void,
	uploadToBlob: boolean = true,
): Promise<{ piecesCount: number; outfitsCount: number }> {
	// Check if already migrated
	if (isMigrationComplete()) {
		return { piecesCount: 0, outfitsCount: 0 };
	}

	// Get localStorage data
	const data = getLocalStorageData();
	if (!data || (data.wardrobe.length === 0 && data.outfits.length === 0)) {
		markMigrationComplete();
		return { piecesCount: 0, outfitsCount: 0 };
	}

	// Map old indices to new database IDs
	const oldToNewIdMap = new Map<number, number>();

	// Migrate pieces
	for (let i = 0; i < data.wardrobe.length; i++) {
		const piece = data.wardrobe[i];
		onProgress?.({
			phase: 'pieces',
			current: i + 1,
			total: data.wardrobe.length,
			currentItem: piece.name,
		});

		const newId = await migratePiece(piece, userId, uploadToBlob);
		oldToNewIdMap.set(i, newId);
	}

	// Migrate outfits
	for (let i = 0; i < data.outfits.length; i++) {
		const outfit = data.outfits[i];
		onProgress?.({
			phase: 'outfits',
			current: i + 1,
			total: data.outfits.length,
			currentItem: outfit.name,
		});

		await migrateOutfit(outfit, userId, oldToNewIdMap);
	}

	// Mark complete
	markMigrationComplete();
	onProgress?.({
		phase: 'complete',
		current: data.wardrobe.length + data.outfits.length,
		total: data.wardrobe.length + data.outfits.length,
	});

	return {
		piecesCount: data.wardrobe.length,
		outfitsCount: data.outfits.length,
	};
}

/**
 * Reset migration status (for debugging/testing)
 */
export function resetMigration(): void {
	localStorage.removeItem(MIGRATION_KEY);
}

/**
 * Check if there's localStorage data to migrate
 */
export function hasDataToMigrate(): boolean {
	if (isMigrationComplete()) return false;

	const data = getLocalStorageData();
	if (!data) return false;

	return data.wardrobe.length > 0 || data.outfits.length > 0;
}
