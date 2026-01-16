import { useRef, useEffect, ReactNode } from 'react';
import { ClothesWithId, ClothesId } from '../../types';
import { PieceCard } from './PieceCard';
import './PiecesGrid.css';

interface PiecesGridProps {
	items: ClothesWithId[];
	selectedId?: ClothesId | null;
	onPieceClick?: (id: ClothesId) => void;
	detailPanel?: ReactNode;
}

/**
 * Calculate how many items fit per row based on grid settings
 */
function useItemsPerRow(
	gridRef: React.RefObject<HTMLDivElement | null>
): number {
	const itemsPerRow = useRef(4);

	useEffect(() => {
		const updateItemsPerRow = () => {
			if (!gridRef.current) return;
			const gridStyle = getComputedStyle(gridRef.current);
			const columns = gridStyle.gridTemplateColumns.split(' ').length;
			itemsPerRow.current = columns;
		};

		updateItemsPerRow();
		window.addEventListener('resize', updateItemsPerRow);
		return () => window.removeEventListener('resize', updateItemsPerRow);
	}, [gridRef]);

	return itemsPerRow.current;
}

export const PiecesGrid = ({
	items,
	selectedId,
	onPieceClick,
	detailPanel,
}: PiecesGridProps) => {
	const gridRef = useRef<HTMLDivElement>(null);
	const detailRef = useRef<HTMLDivElement>(null);
	const itemsPerRow = useItemsPerRow(gridRef);

	// Find which row the selected item is in
	const selectedIndex =
		selectedId !== null && selectedId !== undefined
			? items.findIndex((item) => item.id === selectedId)
			: -1;

	// Calculate after which item index to insert the detail panel
	const insertAfterIndex =
		selectedIndex >= 0
			? Math.min(
					Math.floor(selectedIndex / itemsPerRow) * itemsPerRow +
						itemsPerRow -
						1,
					items.length - 1
			  )
			: -1;

	// Scroll to detail panel when selection changes
	useEffect(() => {
		if (selectedId !== null && selectedId !== undefined && detailRef.current) {
			setTimeout(() => {
				detailRef.current?.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				});
			}, 50);
		}
	}, [selectedId]);

	return (
		<div className="pieces-grid" ref={gridRef}>
			{items.map((item, index) => (
				<>
					<PieceCard
						key={item.id}
						piece={item}
						isSelected={selectedId === item.id}
						onClick={() => onPieceClick?.(item.id)}
					/>
					{index === insertAfterIndex && detailPanel && (
						<div
							key="detail-panel"
							className="pieces-grid__detail-row"
							ref={detailRef}
						>
							{detailPanel}
						</div>
					)}
				</>
			))}
		</div>
	);
};
