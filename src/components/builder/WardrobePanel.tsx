import { ClothesWithId } from '../../types';
import { DraggablePiece } from './DraggablePiece';
import './WardrobePanel.css';

interface WardrobePanelProps {
	items: ClothesWithId[];
}

export const WardrobePanel = ({ items }: WardrobePanelProps) => {
	return (
		<aside className="wardrobe-panel">
			<h2 className="wardrobe-panel__title">Pieces</h2>
			<div className="wardrobe-panel__grid">
				{items.map((item) => (
					<DraggablePiece key={item.id} piece={item} />
				))}
			</div>
		</aside>
	);
};
