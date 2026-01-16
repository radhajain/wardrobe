import { ClothesWithId } from '../../types';
import { PieceCard } from './PieceCard';
import './PiecesGrid.css';

interface PiecesGridProps {
	items: ClothesWithId[];
}

export const PiecesGrid = ({ items }: PiecesGridProps) => {
	return (
		<div className="pieces-grid">
			{items.map((item) => (
				<PieceCard key={item.id} piece={item} />
			))}
		</div>
	);
};
