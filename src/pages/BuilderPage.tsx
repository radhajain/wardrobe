import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { WardrobePanel } from '../components/builder/WardrobePanel';
import { OutfitCanvas } from '../components/builder/OutfitCanvas';
import { useWardrobe } from '../hooks/useWardrobe';
import { useOutfits } from '../hooks/useOutfits';
import { OutfitItem, Outfit } from '../types';
import './BuilderPage.css';

export const BuilderPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { items } = useWardrobe();
	const { saveOutfit, getOutfitById } = useOutfits();

	const [outfitName, setOutfitName] = useState('');
	const [canvasItems, setCanvasItems] = useState<OutfitItem[]>([]);
	const [isEditing, setIsEditing] = useState(false);

	useEffect(() => {
		if (id) {
			const existing = getOutfitById(id);
			if (existing) {
				setOutfitName(existing.name);
				setCanvasItems(existing.items);
				setIsEditing(true);
			}
		}
	}, [id, getOutfitById]);

	const handleDrop = (clothesId: number) => {
		const newItem: OutfitItem = {
			id: uuidv4(),
			clothesId,
			position: {
				x: 50,
				y: 50,
				width: 150,
				height: 200,
				zIndex: canvasItems.length + 1,
			},
		};
		setCanvasItems((prev) => [...prev, newItem]);
	};

	const handleUpdateItem = (itemId: string, updates: Partial<OutfitItem>) => {
		setCanvasItems((prev) =>
			prev.map((item) =>
				item.id === itemId ? { ...item, ...updates } : item
			)
		);
	};

	const handleDeleteItem = (itemId: string) => {
		setCanvasItems((prev) => prev.filter((item) => item.id !== itemId));
	};

	const handleClear = () => {
		setCanvasItems([]);
		setOutfitName('');
	};

	const handleSave = async () => {
		if (canvasItems.length === 0) {
			return;
		}

		const now = new Date().toISOString();
		const outfit: Outfit = {
			id: isEditing && id ? id : uuidv4(),
			name: outfitName || 'Untitled Outfit',
			items: canvasItems,
			createdAt: isEditing && id ? (getOutfitById(id)?.createdAt || now) : now,
			updatedAt: now,
		};

		await saveOutfit(outfit);
		navigate('/outfits');
	};

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="builder-page">
				<div className="builder-page__content">
					<WardrobePanel items={items} />
					<OutfitCanvas
						items={canvasItems}
						wardrobeItems={items}
						onDrop={handleDrop}
						onUpdateItem={handleUpdateItem}
						onDeleteItem={handleDeleteItem}
					/>
				</div>
				<div className="builder-page__footer">
					<input
						type="text"
						className="builder-page__name-input"
						placeholder="Outfit name..."
						value={outfitName}
						onChange={(e) => setOutfitName(e.target.value)}
					/>
					<div className="builder-page__actions">
						<button
							className="builder-page__btn builder-page__btn--secondary"
							onClick={handleClear}
						>
							Clear
						</button>
						<button
							className="builder-page__btn builder-page__btn--primary"
							onClick={handleSave}
							disabled={canvasItems.length === 0}
						>
							{isEditing ? 'Update Outfit' : 'Save Outfit'}
						</button>
					</div>
				</div>
			</div>
		</DndProvider>
	);
};
