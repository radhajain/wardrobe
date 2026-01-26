import { ClothesWithId, OutfitSuggestion, ClothesId } from '../../types';
import './SuggestPanel.css';

interface SuggestPanelProps {
	suggestion: OutfitSuggestion | null;
	wardrobe: ClothesWithId[];
	isLoading: boolean;
	error: string | null;
	onClear: () => void;
	onAddAll: (ids: ClothesId[]) => void;
	occasion?: string;
	onOccasionChange?: (value: string) => void;
	onOccasionSubmit?: (e: React.FormEvent) => void;
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
	occasion = '',
	onOccasionChange,
	onOccasionSubmit,
}: SuggestPanelProps) {
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
			{/* Occasion input form */}
			{onOccasionChange && onOccasionSubmit && (
				<form className="suggest-panel__occasion-form" onSubmit={onOccasionSubmit}>
					<input
						type="text"
						className="suggest-panel__occasion-input"
						placeholder="e.g., going to court on a cold day"
						value={occasion}
						onChange={(e) => onOccasionChange(e.target.value)}
						disabled={isLoading}
					/>
					<button
						type="submit"
						className="suggest-panel__occasion-btn"
						disabled={isLoading || !occasion.trim()}
					>
						{isLoading ? '...' : 'Go'}
					</button>
				</form>
			)}

			{/* Show results section only when there's content */}
			{(suggestion || isLoading || error) && (
				<div className="suggest-panel__results">
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
			)}
		</div>
	);
}
