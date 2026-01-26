import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClothesWithId,
  Clothes,
  Outfit,
  ClothingType,
  ClothingTypes,
} from "../../types";
import { getValues } from "../../utilities/enum";
import "./PieceDetail.css";

interface PieceDetailProps {
  piece: ClothesWithId;
  outfitsUsingPiece: Outfit[];
  wardrobeItems: ClothesWithId[];
  onUpdate: (id: number, updates: Partial<Clothes>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void;
}

/**
 * Expandable detail panel for a wardrobe piece
 */
export function PieceDetail({
  piece,
  outfitsUsingPiece,
  wardrobeItems,
  onUpdate,
  onDelete,
  onClose,
}: PieceDetailProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedStyle, setEditedStyle] = useState(piece.style);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tag editing state
  const [editingTag, setEditingTag] = useState<"type" | "color" | null>(null);
  const [editedType, setEditedType] = useState<ClothingType>(piece.type);
  const [editedColor, setEditedColor] = useState(piece.color);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(piece.id, { style: editedStyle });
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedStyle(piece.style);
    setIsEditing(false);
  };

  const handleTagSave = async (field: "type" | "color") => {
    setIsSaving(true);
    if (field === "type") {
      await onUpdate(piece.id, { type: editedType });
    } else {
      await onUpdate(piece.id, { color: editedColor });
    }
    setIsSaving(false);
    setEditingTag(null);
  };

  const handleTagCancel = () => {
    setEditedType(piece.type);
    setEditedColor(piece.color);
    setEditingTag(null);
  };

  const handleOutfitClick = (outfitId: string) => {
    navigate(`/builder/${outfitId}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(piece.id);
    setIsDeleting(false);
    onClose();
  };

  /**
   * Generate a simple thumbnail representation of an outfit
   */
  const getOutfitThumbnail = (outfit: Outfit) => {
    // Get the first few items in the outfit for the thumbnail
    const thumbnailItems = outfit.items.slice(0, 4);
    return thumbnailItems
      .map((item) => {
        const wardrobeItem = wardrobeItems.find((w) => w.id === item.clothesId);
        return wardrobeItem;
      })
      .filter(Boolean) as ClothesWithId[];
  };

  return (
    <div className="piece-detail">
      <button className="piece-detail__close" onClick={onClose}>
        &times;
      </button>

      <div className="piece-detail__content">
        <div className="piece-detail__main">
          <div className="piece-detail__image-section">
            {piece.imageUrl ? (
              <img
                src={piece.imageUrl}
                alt={piece.name}
                className="piece-detail__image"
              />
            ) : (
              <div className="piece-detail__image-placeholder">
                {piece.type}
              </div>
            )}
          </div>

          <div className="piece-detail__info">
            <h3 className="piece-detail__name">{piece.name}</h3>
            <p className="piece-detail__designer">{piece.designer}</p>

            <div className="piece-detail__meta">
              {editingTag === "type" ? (
                <div className="piece-detail__tag-edit">
                  <select
                    className="piece-detail__tag-select"
                    value={editedType}
                    onChange={(e) =>
                      setEditedType(e.target.value as ClothingType)
                    }
                    autoFocus
                  >
                    {getValues(ClothingTypes).map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="piece-detail__tag-btn"
                    onClick={() => handleTagSave("type")}
                    disabled={isSaving}
                  >
                    Save
                  </button>
                  <button
                    className="piece-detail__tag-btn piece-detail__tag-btn--cancel"
                    onClick={handleTagCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="piece-detail__type piece-detail__tag--editable"
                  onClick={() => setEditingTag("type")}
                >
                  {piece.type}
                </button>
              )}
              {editingTag === "color" ? (
                <div className="piece-detail__tag-edit">
                  <input
                    type="text"
                    className="piece-detail__tag-input"
                    value={editedColor}
                    onChange={(e) => setEditedColor(e.target.value)}
                    autoFocus
                    placeholder="Color"
                  />
                  <button
                    className="piece-detail__tag-btn"
                    onClick={() => handleTagSave("color")}
                    disabled={isSaving}
                  >
                    Save
                  </button>
                  <button
                    className="piece-detail__tag-btn piece-detail__tag-btn--cancel"
                    onClick={handleTagCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="piece-detail__color piece-detail__tag--editable"
                  onClick={() => setEditingTag("color")}
                >
                  {piece.color || "Add color"}
                </button>
              )}
            </div>

            <div className="piece-detail__description">
              <label className="piece-detail__label">Description</label>
              {isEditing ? (
                <div className="piece-detail__edit-section">
                  <textarea
                    className="piece-detail__textarea"
                    value={editedStyle}
                    onChange={(e) => setEditedStyle(e.target.value)}
                    rows={3}
                    placeholder="Add a description..."
                  />
                  <div className="piece-detail__edit-actions">
                    <button
                      className="piece-detail__btn piece-detail__btn--secondary"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      className="piece-detail__btn piece-detail__btn--primary"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="piece-detail__description-text"
                  onClick={() => setIsEditing(true)}
                >
                  {piece.style || (
                    <span className="piece-detail__placeholder">
                      Click to add a description...
                    </span>
                  )}
                </div>
              )}
            </div>

            {piece.productUrl && (
              <a
                href={piece.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="piece-detail__link"
              >
                View Product Page
              </a>
            )}

            <div className="piece-detail__actions">
              {showDeleteConfirm ? (
                <div className="piece-detail__delete-confirm">
                  <span className="piece-detail__delete-warning">
                    Delete this piece?
                    {outfitsUsingPiece.length > 0 && (
                      <>
                        {" "}
                        It will be removed from {outfitsUsingPiece.length}{" "}
                        outfit{outfitsUsingPiece.length !== 1 ? "s" : ""}.
                      </>
                    )}
                  </span>
                  <div className="piece-detail__delete-buttons">
                    <button
                      className="piece-detail__btn piece-detail__btn--secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      className="piece-detail__btn piece-detail__btn--delete"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="piece-detail__delete-trigger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Piece
                </button>
              )}
            </div>
          </div>
        </div>

        {outfitsUsingPiece.length > 0 && (
          <div className="piece-detail__outfits">
            <h4 className="piece-detail__outfits-title">
              Outfits Using This Piece ({outfitsUsingPiece.length})
            </h4>
            <div className="piece-detail__outfits-grid">
              {outfitsUsingPiece.map((outfit) => {
                const thumbnailItems = getOutfitThumbnail(outfit);
                return (
                  <button
                    key={outfit.id}
                    className="piece-detail__outfit-thumb"
                    onClick={() => handleOutfitClick(outfit.id)}
                  >
                    <div className="piece-detail__outfit-preview">
                      {thumbnailItems.slice(0, 4).map((item, i) => (
                        <div
                          key={i}
                          className="piece-detail__outfit-item"
                          style={{
                            backgroundImage: item.imageUrl
                              ? `url(${item.imageUrl})`
                              : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <span className="piece-detail__outfit-name">
                      {outfit.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
