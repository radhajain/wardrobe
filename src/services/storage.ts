import {
  Outfit,
  Clothes,
  ClothesWithId,
  CropSettings,
  CanvasItemPosition,
} from "../types";

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
 * Ensure user is authenticated before database operations
 */
function requireUser(): string {
  if (!currentUserId) {
    throw new Error("User not authenticated");
  }
  return currentUserId;
}

/**
 * Helper to call the database API
 */
async function dbApi<T>(
  action: string,
  data?: object,
  id?: string | number,
): Promise<T> {
  const userId = requireUser();

  const response = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, userId, data, id }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Database API request failed");
  }

  return response.json();
}

/**
 * Helper to call the blob API
 */
async function blobApi(
  action: string,
  data: { imageUrl?: string; base64Data?: string; url?: string },
): Promise<{ url?: string; success?: boolean }> {
  const method = action === "delete" ? "DELETE" : "POST";

  const response = await fetch("/api/blob", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Blob API request failed");
  }

  return response.json();
}

interface PieceRecord {
  id: number;
  userId: string;
  name: string;
  type: string;
  color: string;
  style: string;
  designer: string;
  productUrl: string | null;
  originalImageUrl: string | null;
  persistedImageUrl: string | null;
  orderNumber: string | null;
  orderDate: string | null;
  orderRetailer: string | null;
  createdAt: string | null;
}

interface OutfitRecord {
  id: string;
  userId: string;
  name: string;
  items: OutfitItemJson[];
  createdAt: string | null;
  updatedAt: string | null;
}

interface OutfitItemJson {
  id: string;
  pieceId: number;
  position: CanvasItemPosition;
  customImageUrl?: string;
  crop?: CropSettings;
}

/**
 * Convert database piece to app Clothes type
 */
function pieceToClothes(piece: PieceRecord): ClothesWithId {
  return {
    id: piece.id,
    name: piece.name,
    type: piece.type as ClothesWithId["type"],
    color: piece.color,
    style: piece.style,
    designer: piece.designer,
    productUrl: piece.productUrl ?? undefined,
    imageUrl: piece.persistedImageUrl ?? piece.originalImageUrl ?? undefined,
    order:
      piece.orderNumber || piece.orderDate
        ? {
            orderNumber: piece.orderNumber ?? "",
            orderDate: piece.orderDate ?? "",
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
    items: record.items.map((item) => ({
      id: item.id,
      clothesId: item.pieceId,
      position: item.position,
      customImageUrl: item.customImageUrl,
      crop: item.crop,
    })),
    createdAt: record.createdAt ?? new Date().toISOString(),
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  };
}

/**
 * Storage service for wardrobe data using API routes
 */
export const storage = {
  // ============= Outfit Methods =============

  async getOutfits(): Promise<Outfit[]> {
    const { outfits } = await dbApi<{ outfits: OutfitRecord[] }>("getOutfits");
    return outfits.map(outfitRecordToOutfit);
  },

  async getOutfitById(id: string): Promise<Outfit | null> {
    const { outfit } = await dbApi<{ outfit: OutfitRecord | null }>(
      "getOutfit",
      undefined,
      id,
    );
    return outfit ? outfitRecordToOutfit(outfit) : null;
  },

  async saveOutfit(outfit: Outfit): Promise<Outfit> {
    const items: OutfitItemJson[] = outfit.items.map((item) => ({
      id: item.id,
      pieceId: item.clothesId,
      position: item.position,
      customImageUrl: item.customImageUrl,
      crop: item.crop,
    }));

    await dbApi("saveOutfit", {
      id: outfit.id,
      name: outfit.name,
      items,
    });

    return outfit;
  },

  async deleteOutfit(id: string): Promise<void> {
    await dbApi("deleteOutfit", undefined, id);
  },

  // ============= Wardrobe Methods =============

  async getWardrobe(): Promise<ClothesWithId[]> {
    const { pieces } = await dbApi<{ pieces: PieceRecord[] }>("getPieces");
    return pieces.map(pieceToClothes);
  },

  async addClothingItem(item: Clothes): Promise<ClothesWithId> {
    let persistedImageUrl: string | undefined;

    // Upload to Vercel Blob via API if we have an image
    if (item.imageUrl) {
      try {
        // Check if it's a base64 data URL (uploaded file)
        if (item.imageUrl.startsWith("data:")) {
          const result = await blobApi("uploadBase64", {
            base64Data: item.imageUrl,
          });
          persistedImageUrl = result.url;
        } else {
          const result = await blobApi("uploadFromUrl", {
            imageUrl: item.imageUrl,
          });
          persistedImageUrl = result.url;
        }
      } catch (error) {
        console.warn("Failed to upload image to Vercel Blob:", error);
      }
    }

    const { piece } = await dbApi<{ piece: PieceRecord }>("addPiece", {
      ...item,
      persistedImageUrl,
    });

    return pieceToClothes(piece);
  },

  async updateClothingItem(id: number, item: Clothes): Promise<ClothesWithId> {
    // Get existing piece to check if image changed
    const { piece: existing } = await dbApi<{ piece: PieceRecord | null }>(
      "getPiece",
      undefined,
      id,
    );

    let persistedImageUrl = existing?.persistedImageUrl;

    // If image URL changed, upload new one
    if (item.imageUrl && item.imageUrl !== existing?.originalImageUrl) {
      // Delete old Blob image if exists
      if (existing?.persistedImageUrl) {
        try {
          await blobApi("delete", { url: existing.persistedImageUrl });
        } catch (error) {
          console.warn("Failed to delete old Blob image:", error);
        }
      }

      // Upload new image
      try {
        if (item.imageUrl.startsWith("data:")) {
          const result = await blobApi("uploadBase64", {
            base64Data: item.imageUrl,
          });
          persistedImageUrl = result.url;
        } else {
          const result = await blobApi("uploadFromUrl", {
            imageUrl: item.imageUrl,
          });
          persistedImageUrl = result.url;
        }
      } catch (error) {
        console.warn("Failed to upload new image to Vercel Blob:", error);
        persistedImageUrl = undefined;
      }
    }

    const { piece } = await dbApi<{ piece: PieceRecord }>(
      "updatePiece",
      {
        ...item,
        persistedImageUrl,
      },
      id,
    );

    return pieceToClothes(piece);
  },

  async deleteClothingItem(id: number): Promise<void> {
    const { deletedBlobUrl } = await dbApi<{
      success: boolean;
      deletedBlobUrl?: string;
    }>("deletePiece", undefined, id);

    // Delete blob image if it existed
    if (deletedBlobUrl) {
      try {
        await blobApi("delete", { url: deletedBlobUrl });
      } catch (error) {
        console.warn("Failed to delete Blob image:", error);
      }
    }
  },

  async getClothingItem(id: number): Promise<ClothesWithId | null> {
    const { piece } = await dbApi<{ piece: PieceRecord | null }>(
      "getPiece",
      undefined,
      id,
    );
    return piece ? pieceToClothes(piece) : null;
  },
};
