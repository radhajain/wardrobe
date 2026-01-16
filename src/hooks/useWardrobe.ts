import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';
import { ClothesWithId, Clothes } from '../types';

/**
 * Hook to access and manage wardrobe items.
 * Items are stored in localStorage and loaded on mount.
 */
export const useWardrobe = () => {
	const [items, setItems] = useState<ClothesWithId[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		storage.getWardrobe().then((wardrobe) => {
			const itemsWithIds = wardrobe.map((item, index) => ({
				...item,
				id: index,
			}));
			setItems(itemsWithIds);
			setLoading(false);
		});
	}, []);

	const getItemById = useCallback(
		(id: number): ClothesWithId | undefined => {
			return items.find((item) => item.id === id);
		},
		[items]
	);

	const addItem = useCallback(async (item: Clothes) => {
		await storage.addClothingItem(item);
		// Reload wardrobe to get updated list with correct IDs
		const wardrobe = await storage.getWardrobe();
		const itemsWithIds = wardrobe.map((item, index) => ({
			...item,
			id: index,
		}));
		setItems(itemsWithIds);
	}, []);

	const deleteItem = useCallback(async (id: number) => {
		await storage.deleteClothingItem(id);
		// Reload wardrobe to get updated list with correct IDs
		const wardrobe = await storage.getWardrobe();
		const itemsWithIds = wardrobe.map((item, index) => ({
			...item,
			id: index,
		}));
		setItems(itemsWithIds);
	}, []);

	return { items, loading, getItemById, addItem, deleteItem };
};
