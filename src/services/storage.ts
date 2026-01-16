import { StorageData, Outfit, Clothes } from '../types';
import { sampleWardrobe } from '../data/sample-wardrobe';

const STORAGE_KEY = 'wardrobe_app_data';
const CURRENT_VERSION = 2;

/**
 * Storage abstraction for easy migration to database later.
 * All methods are async to match future database API.
 */
export const storage = {
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

	// Outfit methods
	async getOutfits(): Promise<Outfit[]> {
		const data = await this.initialize();
		return data.outfits;
	},

	async getOutfitById(id: string): Promise<Outfit | null> {
		const outfits = await this.getOutfits();
		return outfits.find((o) => o.id === id) || null;
	},

	async saveOutfit(outfit: Outfit): Promise<Outfit> {
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
		const data = await this.initialize();
		data.outfits = data.outfits.filter((o) => o.id !== id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	},

	// Wardrobe methods
	async getWardrobe(): Promise<Clothes[]> {
		const data = await this.initialize();
		return data.wardrobe;
	},

	async addClothingItem(item: Clothes): Promise<Clothes> {
		const data = await this.initialize();
		data.wardrobe.push(item);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		return item;
	},

	async updateClothingItem(index: number, item: Clothes): Promise<Clothes> {
		const data = await this.initialize();
		if (index >= 0 && index < data.wardrobe.length) {
			data.wardrobe[index] = item;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		}
		return item;
	},

	async deleteClothingItem(index: number): Promise<void> {
		const data = await this.initialize();
		if (index >= 0 && index < data.wardrobe.length) {
			data.wardrobe.splice(index, 1);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		}
	},
};
