import { OutfitCardSkeleton } from "./OutfitCardSkeleton";
import "./OutfitsGrid.css";

interface OutfitsGridSkeletonProps {
  count?: number;
}

/**
 * Skeleton loading state for OutfitsGrid
 */
export const OutfitsGridSkeleton = ({
  count = 6,
}: OutfitsGridSkeletonProps) => {
  return (
    <div className="outfits-grid">
      {Array.from({ length: count }).map((_, index) => (
        <OutfitCardSkeleton key={index} />
      ))}
    </div>
  );
};
