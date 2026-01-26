import { useState } from "react";
import { ClothesWithId, PieceSuggestion, SuggestionStatus } from "../../types";
import { CompatiblePiecesThumbnails } from "./CompatiblePiecesThumbnails";
import "./SuggestionCard.css";

interface SuggestionCardProps {
  suggestion: PieceSuggestion;
  wardrobe: ClothesWithId[];
  onUpdateStatus: (id: string, status: SuggestionStatus) => void;
  onRefine: (id: string, newDescription: string) => void;
  onSearch: (id: string) => void;
  isSearching: boolean;
}

/**
 * Card displaying a piece suggestion with approve/reject/refine actions
 */
export function SuggestionCard({
  suggestion,
  wardrobe,
  onUpdateStatus,
  onRefine,
  onSearch,
  isSearching,
}: SuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    suggestion.refinedDescription || suggestion.description,
  );

  const handleSaveEdit = () => {
    if (
      editedDescription.trim() &&
      editedDescription !== suggestion.description
    ) {
      onRefine(suggestion.id, editedDescription.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedDescription(
      suggestion.refinedDescription || suggestion.description,
    );
    setIsEditing(false);
  };

  const displayDescription =
    suggestion.refinedDescription || suggestion.description;
  const isApproved =
    suggestion.status === "approved" || suggestion.status === "refined";
  const isRejected = suggestion.status === "rejected";

  return (
    <div
      className={`suggestion-card ${isApproved ? "suggestion-card--approved" : ""} ${isRejected ? "suggestion-card--rejected" : ""}`}
    >
      <div className="suggestion-card__header">
        {isEditing ? (
          <div className="suggestion-card__edit">
            <textarea
              className="suggestion-card__textarea"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={2}
              autoFocus
            />
            <div className="suggestion-card__edit-actions">
              <button
                className="suggestion-card__edit-btn"
                onClick={handleSaveEdit}
              >
                Save
              </button>
              <button
                className="suggestion-card__edit-btn suggestion-card__edit-btn--cancel"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <h3 className="suggestion-card__title">
            {displayDescription}
            {suggestion.refinedDescription && (
              <span className="suggestion-card__refined-badge">Refined</span>
            )}
          </h3>
        )}
      </div>

      <p className="suggestion-card__rationale">{suggestion.rationale}</p>

      <CompatiblePiecesThumbnails
        pieceIds={suggestion.compatiblePieceIds}
        wardrobe={wardrobe}
      />

      <div className="suggestion-card__actions">
        {!isRejected && (
          <>
            {isApproved ? (
              <button
                className="suggestion-card__btn suggestion-card__btn--search"
                onClick={() => onSearch(suggestion.id)}
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Find Products"}
              </button>
            ) : (
              <button
                className="suggestion-card__btn suggestion-card__btn--approve"
                onClick={() => onUpdateStatus(suggestion.id, "approved")}
              >
                Approve
              </button>
            )}
            <button
              className="suggestion-card__btn suggestion-card__btn--edit"
              onClick={() => setIsEditing(true)}
              disabled={isEditing}
            >
              Edit
            </button>
          </>
        )}
        <button
          className="suggestion-card__btn suggestion-card__btn--reject"
          onClick={() =>
            onUpdateStatus(suggestion.id, isRejected ? "pending" : "rejected")
          }
        >
          {isRejected ? "Restore" : "Reject"}
        </button>
      </div>
    </div>
  );
}
