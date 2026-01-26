import { Skeleton } from '../ui/Skeleton';
import './OutfitCardSkeleton.css';

/**
 * Skeleton loading state for OutfitCard
 */
export const OutfitCardSkeleton = () => {
	return (
		<div className="outfit-card-skeleton">
			<Skeleton className="outfit-card-skeleton__preview" />
			<div className="outfit-card-skeleton__info">
				<Skeleton className="outfit-card-skeleton__name" variant="text" />
				<Skeleton className="outfit-card-skeleton__date" variant="text" />
			</div>
			<div className="outfit-card-skeleton__actions">
				<Skeleton className="outfit-card-skeleton__btn" />
				<Skeleton className="outfit-card-skeleton__btn" />
			</div>
		</div>
	);
};
