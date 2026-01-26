import { useState, useEffect, useCallback } from "react";
import {
  ClothesWithId,
  ClothingType,
  RecommendationPreferences,
  StoreInfo,
  StorePreference,
} from "../types";
import { recommendationStorage } from "../services/recommendationStorage";
import { extractRetailersFromWardrobe } from "../services/recommendationService";

interface UseRecommendationPreferencesReturn {
  preferences: RecommendationPreferences | null;
  loading: boolean;
  /** Auto-detected retailers from wardrobe */
  detectedRetailers: string[];
  /** Update preference for a store */
  updateStorePreference: (
    storeName: string,
    preference: StorePreference,
  ) => void;
  /** Add a new store to preferences */
  addStore: (storeName: string) => void;
  /** Remove a store from preferences */
  removeStore: (storeName: string) => void;
  /** Update price limit for a clothing type */
  updatePriceLimit: (clothingType: ClothingType, maxPrice: number) => void;
  /** Remove price limit for a clothing type */
  removePriceLimit: (clothingType: ClothingType) => void;
}

/**
 * Hook for managing recommendation preferences with auto-detection from wardrobe
 */
export function useRecommendationPreferences(
  wardrobe: ClothesWithId[],
): UseRecommendationPreferencesReturn {
  const [preferences, setPreferences] =
    useState<RecommendationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [detectedRetailers, setDetectedRetailers] = useState<string[]>([]);

  // Load preferences and detect retailers on mount
  useEffect(() => {
    const stored = recommendationStorage.getPreferences();
    const detected = extractRetailersFromWardrobe(wardrobe);
    setDetectedRetailers(detected);

    if (stored) {
      // Merge detected retailers with stored preferences
      const existingStoreNames = new Set(stored.stores.map((s) => s.name));
      const newStores: StoreInfo[] = detected
        .filter((name) => !existingStoreNames.has(name))
        .map((name) => ({
          name,
          isFromHistory: true,
          preference: "neutral" as const,
        }));

      if (newStores.length > 0) {
        const updated = {
          ...stored,
          stores: [...stored.stores, ...newStores],
          lastUpdated: new Date().toISOString(),
        };
        recommendationStorage.savePreferences(updated);
        setPreferences(updated);
      } else {
        setPreferences(stored);
      }
    } else {
      // Initialize with detected retailers
      const initial: RecommendationPreferences = {
        stores: detected.map((name) => ({
          name,
          isFromHistory: true,
          preference: "preferred" as const, // Default detected stores to preferred
        })),
        priceLimits: [],
        lastUpdated: new Date().toISOString(),
      };
      recommendationStorage.savePreferences(initial);
      setPreferences(initial);
    }

    setLoading(false);
  }, [wardrobe]);

  const updateStorePreference = useCallback(
    (storeName: string, preference: StorePreference) => {
      if (!preferences) return;

      const updated: RecommendationPreferences = {
        ...preferences,
        stores: preferences.stores.map((s) =>
          s.name === storeName ? { ...s, preference } : s,
        ),
        lastUpdated: new Date().toISOString(),
      };
      recommendationStorage.savePreferences(updated);
      setPreferences(updated);
    },
    [preferences],
  );

  const addStore = useCallback(
    (storeName: string) => {
      if (!preferences) return;
      if (preferences.stores.some((s) => s.name === storeName)) return;

      const updated: RecommendationPreferences = {
        ...preferences,
        stores: [
          ...preferences.stores,
          {
            name: storeName,
            isFromHistory: false,
            preference: "preferred",
          },
        ],
        lastUpdated: new Date().toISOString(),
      };
      recommendationStorage.savePreferences(updated);
      setPreferences(updated);
    },
    [preferences],
  );

  const removeStore = useCallback(
    (storeName: string) => {
      if (!preferences) return;

      const updated: RecommendationPreferences = {
        ...preferences,
        stores: preferences.stores.filter((s) => s.name !== storeName),
        lastUpdated: new Date().toISOString(),
      };
      recommendationStorage.savePreferences(updated);
      setPreferences(updated);
    },
    [preferences],
  );

  const updatePriceLimit = useCallback(
    (clothingType: ClothingType, maxPrice: number) => {
      if (!preferences) return;

      const existingIndex = preferences.priceLimits.findIndex(
        (p) => p.clothingType === clothingType,
      );
      const newLimits = [...preferences.priceLimits];

      if (existingIndex >= 0) {
        newLimits[existingIndex] = { clothingType, maxPrice };
      } else {
        newLimits.push({ clothingType, maxPrice });
      }

      const updated: RecommendationPreferences = {
        ...preferences,
        priceLimits: newLimits,
        lastUpdated: new Date().toISOString(),
      };
      recommendationStorage.savePreferences(updated);
      setPreferences(updated);
    },
    [preferences],
  );

  const removePriceLimit = useCallback(
    (clothingType: ClothingType) => {
      if (!preferences) return;

      const updated: RecommendationPreferences = {
        ...preferences,
        priceLimits: preferences.priceLimits.filter(
          (p) => p.clothingType !== clothingType,
        ),
        lastUpdated: new Date().toISOString(),
      };
      recommendationStorage.savePreferences(updated);
      setPreferences(updated);
    },
    [preferences],
  );

  return {
    preferences,
    loading,
    detectedRetailers,
    updateStorePreference,
    addStore,
    removeStore,
    updatePriceLimit,
    removePriceLimit,
  };
}
