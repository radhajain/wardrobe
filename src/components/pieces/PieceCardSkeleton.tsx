import { Skeleton } from '../ui/Skeleton';
import './PieceCardSkeleton.css';

/**
 * Skeleton loading state for PieceCard
 */
export const PieceCardSkeleton = () => {
	return (
		<div className="piece-card-skeleton">
			<Skeleton className="piece-card-skeleton__image" />
			<div className="piece-card-skeleton__info">
				<Skeleton className="piece-card-skeleton__name" variant="text" />
			</div>
		</div>
	);
};
