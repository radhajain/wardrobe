import { ClothesWithId, ClothesId } from '../../types';
import { DraggablePiece } from './DraggablePiece';
import './WardrobePanel.css';

interface WardrobePanelProps {
	items: ClothesWithId[];
	suggestedIds?: ClothesId[];
}

export const WardrobePanel = ({ items, suggestedIds = [] }: WardrobePanelProps) => {
	return (
		<aside className="wardrobe-panel">
			<h2 className="wardrobe-panel__title">Pieces</h2>
			<div className="wardrobe-panel__grid">
				{items.map((item) => (
					<DraggablePiece
						key={item.id}
						piece={item}
						isSuggested={suggestedIds.includes(item.id)}
					/>
				))}
			</div>
		</aside>
	);
};
