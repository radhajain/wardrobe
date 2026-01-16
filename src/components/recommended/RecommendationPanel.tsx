import {
	ClothesWithId,
	ProductSearchResults,
	RecommendationSession,
	SuggestionStatus,
} from '../../types';
import { SuggestionCard } from './SuggestionCard';
import { ProductResultCard } from './ProductResultCard';
import './RecommendationPanel.css';

interface RecommendationPanelProps {
	session: RecommendationSession | null;
	wardrobe: ClothesWithId[];
	isLoading: boolean;
	error: string | null;
	onGenerateSuggestions: () => void;
	onUpdateSuggestionStatus: (id: string, status: SuggestionStatus) => void;
	onRefineSuggestion: (id: string, newDescription: string) => void;
	onSearchProducts: (suggestionId: string) => void;
	onReset: () => void;
}

/**
 * Main panel for the recommendation flow - suggestions and product results
 */
export function RecommendationPanel({
	session,
	wardrobe,
	isLoading,
	error,
	onGenerateSuggestions,
	onUpdateSuggestionStatus,
	onRefineSuggestion,
	onSearchProducts,
	onReset,
}: RecommendationPanelProps) {
	// Empty state - no session yet
	if (!session) {
		return (
			<div className="recommendation-panel">
				<div className="recommendation-panel__empty">
					<h2 className="recommendation-panel__empty-title">
						Get Personalized Recommendations
					</h2>
					<p className="recommendation-panel__empty-text">
						Based on your wardrobe and style preferences, we'll suggest new
						pieces that would complement your existing collection.
					</p>
					<button
						className="recommendation-panel__generate-btn"
						onClick={onGenerateSuggestions}
						disabled={isLoading}
					>
						{isLoading ? 'Analyzing...' : 'Generate Suggestions'}
					</button>
					{error && <p className="recommendation-panel__error">{error}</p>}
				</div>
			</div>
		);
	}

	const approvedSuggestions = session.suggestions.filter(
		(s) => s.status === 'approved' || s.status === 'refined'
	);

	const getSearchResultsForSuggestion = (
		suggestionId: string
	): ProductSearchResults | undefined => {
		return session.searchResults.find((r) => r.suggestionId === suggestionId);
	};

	return (
		<div className="recommendation-panel">
			<div className="recommendation-panel__header">
				<h2 className="recommendation-panel__title">Recommendations</h2>
				<button
					className="recommendation-panel__reset-btn"
					onClick={onReset}
				>
					Start Over
				</button>
			</div>

			{error && <p className="recommendation-panel__error">{error}</p>}

			{/* Suggestions Section */}
			<section className="recommendation-panel__section">
				<h3 className="recommendation-panel__section-title">
					Suggested Pieces
					<span className="recommendation-panel__section-count">
						{session.suggestions.length}
					</span>
				</h3>
				<p className="recommendation-panel__section-hint">
					Review and approve suggestions, then search for products to buy.
				</p>

				<div className="recommendation-panel__suggestions">
					{session.suggestions.map((suggestion) => {
						const searchResults = getSearchResultsForSuggestion(suggestion.id);
						const isSearching = searchResults?.status === 'loading';

						return (
							<SuggestionCard
								key={suggestion.id}
								suggestion={suggestion}
								wardrobe={wardrobe}
								onUpdateStatus={onUpdateSuggestionStatus}
								onRefine={onRefineSuggestion}
								onSearch={onSearchProducts}
								isSearching={isSearching}
							/>
						);
					})}
				</div>

				{isLoading && (
					<div className="recommendation-panel__loading">
						<div className="recommendation-panel__loading-spinner" />
						<span>Generating suggestions...</span>
					</div>
				)}
			</section>

			{/* Product Results Section */}
			{session.searchResults.length > 0 && (
				<section className="recommendation-panel__section">
					<h3 className="recommendation-panel__section-title">
						Products Found
					</h3>

					{approvedSuggestions.map((suggestion) => {
						const results = getSearchResultsForSuggestion(suggestion.id);
						if (!results) return null;

						return (
							<div key={suggestion.id} className="recommendation-panel__results-group">
								<h4 className="recommendation-panel__results-title">
									{suggestion.refinedDescription || suggestion.description}
								</h4>

								{results.status === 'loading' && (
									<div className="recommendation-panel__loading">
										<div className="recommendation-panel__loading-spinner" />
										<span>Searching for products...</span>
									</div>
								)}

								{results.status === 'error' && (
									<p className="recommendation-panel__error">
										{results.error || 'Failed to search for products'}
									</p>
								)}

								{results.status === 'complete' && (
									<>
										{results.products.length > 0 ? (
											<div className="recommendation-panel__products-grid">
												{results.products.map((product) => (
													<ProductResultCard
														key={product.id}
														product={product}
													/>
												))}
											</div>
										) : (
											<p className="recommendation-panel__no-results">
												No products found. Try refining your search.
											</p>
										)}
									</>
								)}
							</div>
						);
					})}
				</section>
			)}
		</div>
	);
}
