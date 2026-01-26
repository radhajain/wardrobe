import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PiecesGrid } from "../components/pieces/PiecesGrid";
import { PiecesGridSkeleton } from "../components/pieces/PiecesGridSkeleton";
import { PieceDetail } from "../components/pieces/PieceDetail";
import { AddPieceModal } from "../components/pieces/AddPieceModal";
import { useWardrobe } from "../hooks/useWardrobe";
import { useOutfits } from "../hooks/useOutfits";
import { Clothes, ClothesId } from "../types";
import "./PiecesPage.css";

export const PiecesPage = () => {
  const { pieceId } = useParams<{ pieceId?: string }>();
  const navigate = useNavigate();
  const { items, loading, addItem, updateItem, deleteItem } = useWardrobe();
  const { outfits } = useOutfits();
  const [showAddModal, setShowAddModal] = useState(false);

  // Parse pieceId from URL
  const selectedPieceId = pieceId ? parseInt(pieceId, 10) : null;

  // Get the selected piece
  const selectedPiece = useMemo(() => {
    if (selectedPieceId === null) return null;
    return items.find((item) => item.id === selectedPieceId) || null;
  }, [items, selectedPieceId]);

  // Get outfits that use the selected piece
  const outfitsUsingPiece = useMemo(() => {
    if (selectedPieceId === null) return [];
    return outfits.filter((outfit) =>
      outfit.items.some((item) => item.clothesId === selectedPieceId),
    );
  }, [outfits, selectedPieceId]);

  // Handle piece selection
  const handlePieceClick = (id: ClothesId) => {
    if (selectedPieceId === id) {
      // Deselect if clicking the same piece
      navigate("/pieces");
    } else {
      navigate(`/pieces/${id}`);
    }
  };

  const handleCloseDetail = () => {
    navigate("/pieces");
  };

  const handleAddPiece = async (piece: Clothes) => {
    await addItem(piece);
    setShowAddModal(false);
  };

  const handleUpdatePiece = async (id: number, updates: Partial<Clothes>) => {
    await updateItem(id, updates);
  };

  const handleDeletePiece = async (id: number) => {
    await deleteItem(id);
    navigate("/pieces");
  };

  return (
    <div className="pieces-page">
      <div className="pieces-page__header">
        <div className="pieces-page__title-group">
          <h1 className="pieces-page__title">My Pieces</h1>
          {!loading && (
            <p className="pieces-page__count">{items.length} items</p>
          )}
        </div>
        {!loading && (
          <button
            className="pieces-page__add-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add Piece
          </button>
        )}
      </div>

      {loading ? (
        <PiecesGridSkeleton count={8} />
      ) : (
        <PiecesGrid
          items={items}
          selectedId={selectedPieceId}
          onPieceClick={handlePieceClick}
          detailPanel={
            selectedPiece ? (
              <PieceDetail
                piece={selectedPiece}
                outfitsUsingPiece={outfitsUsingPiece}
                wardrobeItems={items}
                onUpdate={handleUpdatePiece}
                onDelete={handleDeletePiece}
                onClose={handleCloseDetail}
              />
            ) : undefined
          }
        />
      )}

      {showAddModal && (
        <AddPieceModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddPiece}
        />
      )}
    </div>
  );
};
