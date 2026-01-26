import { useRef } from "react";
import { useDrop } from "react-dnd";
import { ClothesWithId, OutfitItem } from "../../types";
import { CanvasItem } from "./CanvasItem";
import "./OutfitCanvas.css";

interface OutfitCanvasProps {
  items: OutfitItem[];
  wardrobeItems: ClothesWithId[];
  onDrop: (clothesId: number) => void;
  onUpdateItem: (itemId: string, updates: Partial<OutfitItem>) => void;
  onDeleteItem: (itemId: string) => void;
}

export const OutfitCanvas = ({
  items,
  wardrobeItems,
  onDrop,
  onUpdateItem,
  onDeleteItem,
}: OutfitCanvasProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "WARDROBE_PIECE",
    drop: (draggedItem: { clothesId: number }) => {
      onDrop(draggedItem.clothesId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  drop(ref);

  const getClothesById = (id: number): ClothesWithId | undefined => {
    return wardrobeItems.find((item) => item.id === id);
  };

  return (
    <div
      ref={ref}
      className={`outfit-canvas ${isOver ? "outfit-canvas--over" : ""}`}
    >
      {items.length === 0 && (
        <div className="outfit-canvas__empty">
          <p>Drag pieces here to create your outfit</p>
        </div>
      )}
      {items.map((item) => {
        const clothes = getClothesById(item.clothesId);
        if (!clothes) return null;
        return (
          <CanvasItem
            key={item.id}
            item={item}
            clothes={clothes}
            onUpdate={(updates) => onUpdateItem(item.id, updates)}
            onDelete={() => onDeleteItem(item.id)}
          />
        );
      })}
    </div>
  );
};
