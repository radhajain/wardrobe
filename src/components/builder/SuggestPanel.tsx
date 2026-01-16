import { ClothesWithId, OutfitSuggestion, ClothesId } from '../../types';
import './SuggestPanel.css';

interface SuggestPanelProps {
	suggestion: OutfitSuggestion | null;
	wardrobe: ClothesWithId[];
	isLoading: boolean;
	error: string | null;
	onClear: () => void;
	onAddAll: (ids: ClothesId[]) => void;
}

/**
 * Panel showing AI outfit suggestions in the Builder
 */
export function SuggestPanel({
	suggestion,
	wardrobe,
	isLoading,
	error,
	onClear,
	onAddAll,
}: SuggestPanelProps) {
	if (!suggestion && !isLoading && !error) {
		return null;
	}

	const suggestedItems = suggestion?.suggestedItemIds
		.map((id) => wardrobe.find((item) => item.id === id))
		.filter(Boolean) as ClothesWithId[] | undefined;

	const handleAddAll = () => {
		if (suggestion?.suggestedItemIds) {
			onAddAll(suggestion.suggestedItemIds);
		}
	};

	return (
		<div className="suggest-panel">
			<div className="suggest-panel__header">
				<span className="suggest-panel__title">AI Suggestions</span>
				<div className="suggest-panel__actions">
					{suggestion && suggestedItems && suggestedItems.length > 0 && (
						<button className="suggest-panel__add-all" onClick={handleAddAll}>
							Add All
						</button>
					)}
					{(suggestion || error) && (
						<button className="suggest-panel__clear" onClick={onClear}>
							Clear
						</button>
					)}
				</div>
			</div>

			{isLoading && (
				<div className="suggest-panel__loading">
					<span className="suggest-panel__loading-dot"></span>
					<span className="suggest-panel__loading-dot"></span>
					<span className="suggest-panel__loading-dot"></span>
				</div>
			)}

			{error && <div className="suggest-panel__error">{error}</div>}

			{suggestion && (
				<>
					<p className="suggest-panel__explanation">{suggestion.explanation}</p>
					{suggestedItems && suggestedItems.length > 0 && (
						<div className="suggest-panel__items">
							{suggestedItems.map((item) => (
								<div key={item.id} className="suggest-panel__item">
									{item.imageUrl && (
										<img
											src={item.imageUrl}
											alt={item.name}
											className="suggest-panel__item-image"
										/>
									)}
									<span className="suggest-panel__item-name">{item.name}</span>
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
