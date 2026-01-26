import { useState, useEffect, useCallback } from "react";
import { useAuthenticate } from "@neondatabase/neon-js/auth/react";
import { storage, setCurrentUser, getCurrentUser } from "../services/storage";
import { ClothesWithId, Clothes } from "../types";

/**
 * Hook to access and manage wardrobe items.
 * Items are stored in the database and loaded when user is authenticated.
 */
export const useWardrobe = () => {
  const { data } = useAuthenticate();
  const user = data?.user;
  const [items, setItems] = useState<ClothesWithId[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWardrobe = useCallback(async () => {
    if (!getCurrentUser()) {
      setLoading(false);
      return;
    }

    try {
      const wardrobe = await storage.getWardrobe();
      setItems(wardrobe);
    } catch (error) {
      console.error("Failed to load wardrobe:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set current user and reload wardrobe when user changes
  useEffect(() => {
    if (user) {
      setCurrentUser(user.id);
      setLoading(true);
      loadWardrobe();
    } else {
      setCurrentUser(null);
      setItems([]);
      setLoading(false);
    }
  }, [user, loadWardrobe]);

  const getItemById = useCallback(
    (id: number): ClothesWithId | undefined => {
      return items.find((item) => item.id === id);
    },
    [items],
  );

  const addItem = useCallback(async (item: Clothes) => {
    const newItem = await storage.addClothingItem(item);
    setItems((prev) => [...prev, newItem]);
    return newItem;
  }, []);

  const updateItem = useCallback(
    async (id: number, updates: Partial<Clothes>) => {
      const currentItem = items.find((item) => item.id === id);
      if (!currentItem) return;

      const updatedItem: Clothes = {
        name: updates.name ?? currentItem.name,
        type: updates.type ?? currentItem.type,
        color: updates.color ?? currentItem.color,
        style: updates.style ?? currentItem.style,
        designer: updates.designer ?? currentItem.designer,
        productUrl: updates.productUrl ?? currentItem.productUrl,
        imageUrl: updates.imageUrl ?? currentItem.imageUrl,
        order: updates.order ?? currentItem.order,
      };

      const updated = await storage.updateClothingItem(id, updatedItem);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [items],
  );

  const deleteItem = useCallback(async (id: number) => {
    await storage.deleteClothingItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { items, loading, getItemById, addItem, updateItem, deleteItem };
};
