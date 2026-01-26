import { ClothesWithId } from "../../types";
import "./PieceCard.css";

interface PieceCardProps {
  piece: ClothesWithId;
  isSelected?: boolean;
  onClick?: () => void;
}

export const PieceCard = ({ piece, isSelected, onClick }: PieceCardProps) => {
  return (
    <button
      className={`piece-card ${isSelected ? "piece-card--selected" : ""}`}
      onClick={onClick}
      type="button"
    >
      <div className="piece-card__image-container">
        {piece.imageUrl ? (
          <img
            src={piece.imageUrl}
            alt={piece.name}
            className="piece-card__image"
          />
        ) : (
          <div className="piece-card__placeholder">
            <span>{piece.type}</span>
          </div>
        )}
      </div>
      <div className="piece-card__info">
        <p className="piece-card__name">{piece.name}</p>
      </div>
    </button>
  );
};
