import { PieceCardSkeleton } from "./PieceCardSkeleton";
import "./PiecesGrid.css";

interface PiecesGridSkeletonProps {
  count?: number;
}

/**
 * Skeleton loading state for PiecesGrid
 */
export const PiecesGridSkeleton = ({ count = 8 }: PiecesGridSkeletonProps) => {
  return (
    <div className="pieces-grid">
      {Array.from({ length: count }).map((_, index) => (
        <PieceCardSkeleton key={index} />
      ))}
    </div>
  );
};
