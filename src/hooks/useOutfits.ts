import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';
import { Outfit } from '../types';

/**
 * Hook for CRUD operations on outfits.
 */
export const useOutfits = () => {
	const [outfits, setOutfits] = useState<Outfit[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		storage.getOutfits().then((data) => {
			setOutfits(data);
			setLoading(false);
		});
	}, []);

	const saveOutfit = useCallback(async (outfit: Outfit) => {
		const saved = await storage.saveOutfit(outfit);
		setOutfits((prev) => {
			const exists = prev.find((o) => o.id === outfit.id);
			if (exists) {
				return prev.map((o) => (o.id === outfit.id ? saved : o));
			}
			return [...prev, saved];
		});
		return saved;
	}, []);

	const deleteOutfit = useCallback(async (id: string) => {
		await storage.deleteOutfit(id);
		setOutfits((prev) => prev.filter((o) => o.id !== id));
	}, []);

	const getOutfitById = useCallback(
		(id: string): Outfit | undefined => {
			return outfits.find((o) => o.id === id);
		},
		[outfits]
	);

	return { outfits, loading, saveOutfit, deleteOutfit, getOutfitById };
};
