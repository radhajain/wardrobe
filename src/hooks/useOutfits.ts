import { useState, useEffect, useCallback } from "react";
import { useAuthenticate } from "@neondatabase/neon-js/auth/react";
import { storage, setCurrentUser, getCurrentUser } from "../services/storage";
import { Outfit } from "../types";

/**
 * Hook for CRUD operations on outfits.
 * Outfits are stored in the database and loaded when user is authenticated.
 */
export const useOutfits = () => {
  const { data } = useAuthenticate();
  const user = data?.user;
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOutfits = useCallback(async () => {
    if (!getCurrentUser()) {
      setLoading(false);
      return;
    }

    try {
      const data = await storage.getOutfits();
      setOutfits(data);
    } catch (error) {
      console.error("Failed to load outfits:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set current user and reload outfits when user changes
  useEffect(() => {
    if (user) {
      setCurrentUser(user.id);
      setLoading(true);
      loadOutfits();
    } else {
      setCurrentUser(null);
      setOutfits([]);
      setLoading(false);
    }
  }, [user, loadOutfits]);

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
    [outfits],
  );

  return { outfits, loading, saveOutfit, deleteOutfit, getOutfitById };
};
