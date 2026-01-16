/**
 * Clothing type categories
 */
export type ClothingType =
	| 'coat'
	| 'jacket'
	| 'denim'
	| 'dress'
	| 'skirt'
	| 'top'
	| 'pants'
	| 'knitwear'
	| 'shoes'
	| 'bag'
	| 'accessory'
	| 'other';

/**
 * Base clothing item structure
 */
export type Clothes = {
	name: string;
	type: ClothingType;
	color: string;
	style: string;
	designer: string;
	productUrl?: string;
	imageUrl?: string;
	order?: { orderDate: string; orderNumber: string; retailer?: string };
};

/**
 * Unique identifier for wardrobe items
 */
export type ClothesId = number;

/**
 * Extended Clothes type with ID for app usage
 */
export interface ClothesWithId extends Clothes {
	id: ClothesId;
}

/**
 * Position and dimensions for an item on the outfit canvas
 */
export interface CanvasItemPosition {
	x: number;
	y: number;
	width: number;
	height: number;
	zIndex: number;
}

/**
 * Crop settings for an image (percentages 0-100)
 */
export interface CropSettings {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/**
 * A clothing item placed on the outfit canvas
 */
export interface OutfitItem {
	id: string;
	clothesId: ClothesId;
	position: CanvasItemPosition;
	/** Custom image URL (e.g., after background removal) */
	customImageUrl?: string;
	/** Crop settings */
	crop?: CropSettings;
}

/**
 * A saved outfit (collage of items)
 */
export interface Outfit {
	id: string;
	name: string;
	items: OutfitItem[];
	createdAt: string;
	updatedAt: string;
}

/**
 * Drag item type for react-dnd
 */
export interface DragItem {
	type: 'WARDROBE_PIECE' | 'CANVAS_ITEM';
	clothesId: ClothesId;
	sourceId?: string;
}

/**
 * Storage data structure
 */
export interface StorageData {
	outfits: Outfit[];
	wardrobe: Clothes[];
	version: number;
}
