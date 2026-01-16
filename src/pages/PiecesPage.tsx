import { useState } from 'react';
import { PiecesGrid } from '../components/pieces/PiecesGrid';
import { AddPieceModal } from '../components/pieces/AddPieceModal';
import { useWardrobe } from '../hooks/useWardrobe';
import { Clothes } from '../types';
import './PiecesPage.css';

export const PiecesPage = () => {
	const { items, loading, addItem } = useWardrobe();
	const [showAddModal, setShowAddModal] = useState(false);

	const handleAddPiece = async (piece: Clothes) => {
		await addItem(piece);
		setShowAddModal(false);
	};

	if (loading) {
		return (
			<div className="pieces-page">
				<div className="pieces-page__loading">Loading...</div>
			</div>
		);
	}

	return (
		<div className="pieces-page">
			<div className="pieces-page__header">
				<div className="pieces-page__title-group">
					<h1 className="pieces-page__title">My Pieces</h1>
					<p className="pieces-page__count">{items.length} items</p>
				</div>
				<button
					className="pieces-page__add-btn"
					onClick={() => setShowAddModal(true)}
				>
					+ Add Piece
				</button>
			</div>
			<PiecesGrid items={items} />

			{showAddModal && (
				<AddPieceModal
					onClose={() => setShowAddModal(false)}
					onAdd={handleAddPiece}
				/>
			)}
		</div>
	);
};
