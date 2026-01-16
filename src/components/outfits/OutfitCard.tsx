import { Outfit } from '../../types';
import { useWardrobe } from '../../hooks/useWardrobe';
import './OutfitCard.css';

interface OutfitCardProps {
	outfit: Outfit;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
}

// Canvas dimensions used in the builder
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const OutfitCard = ({ outfit, onEdit, onDelete }: OutfitCardProps) => {
	const { getItemById } = useWardrobe();

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	return (
		<div className="outfit-card">
			<div className="outfit-card__preview" onClick={() => onEdit(outfit.id)}>
				{outfit.items.length > 0 ? (
					<div className="outfit-card__collage">
						{outfit.items.map((item) => {
							const clothes = getItemById(item.clothesId);
							if (!clothes) return null;

							// Calculate percentage-based positioning for the preview
							const left = (item.position.x / CANVAS_WIDTH) * 100;
							const top = (item.position.y / CANVAS_HEIGHT) * 100;
							const width = (item.position.width / CANVAS_WIDTH) * 100;
							const height = (item.position.height / CANVAS_HEIGHT) * 100;

							return (
								<div
									key={item.id}
									className="outfit-card__collage-item"
									style={{
										left: `${left}%`,
										top: `${top}%`,
										width: `${width}%`,
										height: `${height}%`,
										zIndex: item.position.zIndex,
									}}
								>
									{clothes.imageUrl ? (
										<img
											src={clothes.imageUrl}
											alt={clothes.name}
											className="outfit-card__collage-image"
										/>
									) : (
										<div className="outfit-card__collage-placeholder">
											{clothes.type}
										</div>
									)}
								</div>
							);
						})}
					</div>
				) : (
					<div className="outfit-card__empty">Empty outfit</div>
				)}
			</div>
			<div className="outfit-card__info">
				<h3 className="outfit-card__name">{outfit.name}</h3>
				<p className="outfit-card__date">{formatDate(outfit.updatedAt)}</p>
			</div>
			<div className="outfit-card__actions">
				<button
					className="outfit-card__btn outfit-card__btn--edit"
					onClick={() => onEdit(outfit.id)}
				>
					Edit
				</button>
				<button
					className="outfit-card__btn outfit-card__btn--delete"
					onClick={() => onDelete(outfit.id)}
				>
					Delete
				</button>
			</div>
		</div>
	);
};
