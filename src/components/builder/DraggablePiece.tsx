import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { ClothesWithId } from '../../types';
import './DraggablePiece.css';

interface DraggablePieceProps {
	piece: ClothesWithId;
}

export const DraggablePiece = ({ piece }: DraggablePieceProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const [{ isDragging }, drag] = useDrag(() => ({
		type: 'WARDROBE_PIECE',
		item: { clothesId: piece.id },
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	}));

	drag(ref);

	return (
		<div
			ref={ref}
			className={`draggable-piece ${isDragging ? 'draggable-piece--dragging' : ''}`}
		>
			<div className="draggable-piece__image-container">
				{piece.imageUrl ? (
					<img
						src={piece.imageUrl}
						alt={piece.name}
						className="draggable-piece__image"
					/>
				) : (
					<div className="draggable-piece__placeholder">
						<span>{piece.type}</span>
					</div>
				)}
			</div>
			<p className="draggable-piece__name">{piece.name}</p>
		</div>
	);
};
