import { useState, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.color.toLowerCase().includes(query) ||
        item.style.toLowerCase().includes(query) ||
        item.designer.toLowerCase().includes(query)
      );
    });
  }, [items, searchQuery]);

  return (
    <aside className="wardrobe-panel">
      <h2 className="wardrobe-panel__title">Pieces</h2>
      <input
        type="text"
        className="wardrobe-panel__search"
        placeholder="Search pieces..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {onTapToAdd && (
        <p className="wardrobe-panel__hint">
          Tap a piece to add it to your outfit
        </p>
      )}
      <div className="wardrobe-panel__grid">
        {filteredItems.length === 0 ? (
          <p className="wardrobe-panel__empty">No pieces found</p>
        ) : (
          filteredItems.map((item) => (
            <DraggablePiece
              key={item.id}
              piece={item}
              isSuggested={suggestedIds.includes(item.id)}
              onTap={onTapToAdd}
            />
          ))
        )}
      </div>
    </aside>
  );
};
