import { useNavigate } from "react-router-dom";
import { OutfitsGrid } from "../components/outfits/OutfitsGrid";
import { OutfitsGridSkeleton } from "../components/outfits/OutfitsGridSkeleton";
import { useOutfits } from "../hooks/useOutfits";
import "./OutfitsPage.css";

export const OutfitsPage = () => {
  const { outfits, loading, deleteOutfit } = useOutfits();
  const navigate = useNavigate();

  const handleEdit = (id: string) => {
    navigate(`/builder/${id}`);
  };

  const handleDelete = async (id: string) => {
    await deleteOutfit(id);
  };

  return (
    <div className="outfits-page">
      <div className="outfits-page__header">
        <div className="outfits-page__header-left">
          <h1 className="outfits-page__title">My Outfits</h1>
          {!loading && (
            <p className="outfits-page__count">{outfits.length} outfits</p>
          )}
        </div>
        {!loading && outfits.length > 0 && (
          <button
            className="outfits-page__create-btn"
            onClick={() => navigate("/builder")}
          >
            Create New
          </button>
        )}
      </div>
      {loading ? (
        <OutfitsGridSkeleton count={6} />
      ) : outfits.length === 0 ? (
        <div className="outfits-page__empty">
          <p>No outfits yet.</p>
          <button
            className="outfits-page__create-btn"
            onClick={() => navigate("/builder")}
          >
            Create your first outfit
          </button>
        </div>
      ) : (
        <OutfitsGrid
          outfits={outfits}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
