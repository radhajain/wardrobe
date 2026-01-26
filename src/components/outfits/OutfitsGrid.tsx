import { Outfit } from "../../types";
import { OutfitCard } from "./OutfitCard";
import "./OutfitsGrid.css";

interface OutfitsGridProps {
  outfits: Outfit[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const OutfitsGrid = ({
  outfits,
  onEdit,
  onDelete,
}: OutfitsGridProps) => {
  return (
    <div className="outfits-grid">
      {outfits.map((outfit) => (
        <OutfitCard
          key={outfit.id}
          outfit={outfit}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
