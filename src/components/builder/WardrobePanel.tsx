import { ClothesWithId, ClothesId } from "../../types";
import { DraggablePiece } from "./DraggablePiece";
import "./WardrobePanel.css";

interface WardrobePanelProps {
  items: ClothesWithId[];
  suggestedIds?: ClothesId[];
  onTapToAdd?: (pieceId: number) => void;
}

export const WardrobePanel = ({
  items,
  suggestedIds = [],
  onTapToAdd,
}: WardrobePanelProps) => {
  return (
    <aside className="wardrobe-panel">
      <h2 className="wardrobe-panel__title">Pieces</h2>
      {onTapToAdd && (
        <p className="wardrobe-panel__hint">
          Tap a piece to add it to your outfit
        </p>
      )}
      <div className="wardrobe-panel__grid">
        {items.map((item) => (
          <DraggablePiece
            key={item.id}
            piece={item}
            isSuggested={suggestedIds.includes(item.id)}
            onTap={onTapToAdd}
          />
        ))}
      </div>
    </aside>
  );
};
