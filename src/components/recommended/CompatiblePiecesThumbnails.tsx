import { ClothesWithId, ClothesId } from '../../types';
import './CompatiblePiecesThumbnails.css';

interface CompatiblePiecesThumbnailsProps {
	pieceIds: ClothesId[];
	wardrobe: ClothesWithId[];
}

/**
 * Displays small thumbnails of compatible wardrobe pieces
 */
export function CompatiblePiecesThumbnails({
	pieceIds,
	wardrobe,
}: CompatiblePiecesThumbnailsProps) {
	const pieces = pieceIds
		.map((id) => wardrobe.find((item) => item.id === id))
		.filter(Boolean) as ClothesWithId[];

	if (pieces.length === 0) {
		return null;
	}

	return (
		<div className="compatible-pieces">
			<span className="compatible-pieces__label">Works with:</span>
			<div className="compatible-pieces__list">
				{pieces.slice(0, 5).map((piece) => (
					<div
						key={piece.id}
						className="compatible-pieces__item"
						title={`${piece.name} by ${piece.designer}`}
					>
						{piece.imageUrl ? (
							<img
								src={piece.imageUrl}
								alt={piece.name}
								className="compatible-pieces__image"
							/>
						) : (
							<div className="compatible-pieces__placeholder">
								{piece.name.charAt(0)}
							</div>
						)}
					</div>
				))}
				{pieces.length > 5 && (
					<div className="compatible-pieces__more">+{pieces.length - 5}</div>
				)}
			</div>
		</div>
	);
}
