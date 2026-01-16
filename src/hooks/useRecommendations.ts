import { useState, useCallback } from 'react';
import {
	ClothesWithId,
	ProductSearchResults,
	RecommendationPreferences,
	RecommendationSession,
	SuggestionStatus,
} from '../types';
import { recommendationStorage } from '../services/recommendationStorage';
import {
	generatePieceSuggestions,
	searchProducts,
	searchDirectItem,
} from '../services/recommendationService';

interface UseRecommendationsReturn {
	session: RecommendationSession | null;
	isLoading: boolean;
	error: string | null;
	/** Step 1: Generate piece suggestions */
	generateSuggestions: () => Promise<void>;
	/** Update status of a suggestion (approve/reject) */
	updateSuggestionStatus: (id: string, status: SuggestionStatus) => void;
	/** Refine a suggestion with user edits */
	refineSuggestion: (id: string, newDescription: string) => void;
	/** Step 2: Search for products for approved suggestions */
	searchForProducts: (suggestionId: string) => Promise<void>;
	/** Direct search for a specific item */
	searchDirect: (query: string) => Promise<void>;
	/** Reset the session */
	resetSession: () => void;
}

/**
 * Hook for managing the recommendation flow and session state
 */
export function useRecommendations(
	wardrobe: ClothesWithId[],
	preferences: RecommendationPreferences | null
): UseRecommendationsReturn {
	const [session, setSession] = useState<RecommendationSession | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const generateSuggestions = useCallback(async () => {
		if (!preferences) {
			setError('Please set your preferences first');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const suggestions = await generatePieceSuggestions(wardrobe, preferences);

			const newSession: RecommendationSession = {
				step: 'suggestions',
				mode: 'suggestions',
				suggestions,
				searchResults: [],
				createdAt: new Date().toISOString(),
			};

			recommendationStorage.saveSession(newSession);
			setSession(newSession);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to generate suggestions'
			);
		} finally {
			setIsLoading(false);
		}
	}, [wardrobe, preferences]);

	const updateSuggestionStatus = useCallback(
		(id: string, status: SuggestionStatus) => {
			if (!session) return;

			const updated: RecommendationSession = {
				...session,
				suggestions: session.suggestions.map((s) =>
					s.id === id ? { ...s, status } : s
				),
			};

			recommendationStorage.saveSession(updated);
			setSession(updated);
		},
		[session]
	);

	const refineSuggestion = useCallback(
		(id: string, newDescription: string) => {
			if (!session) return;

			const updated: RecommendationSession = {
				...session,
				suggestions: session.suggestions.map((s) =>
					s.id === id
						? { ...s, refinedDescription: newDescription, status: 'refined' }
						: s
				),
			};

			recommendationStorage.saveSession(updated);
			setSession(updated);
		},
		[session]
	);

	const searchForProducts = useCallback(
		async (suggestionId: string) => {
			if (!session || !preferences) return;

			const suggestion = session.suggestions.find((s) => s.id === suggestionId);
			if (!suggestion) return;

			// Mark as loading
			const loadingResult: ProductSearchResults = {
				suggestionId,
				products: [],
				searchedAt: new Date().toISOString(),
				status: 'loading',
			};

			const withLoading: RecommendationSession = {
				...session,
				step: 'search',
				searchResults: [
					...session.searchResults.filter((r) => r.suggestionId !== suggestionId),
					loadingResult,
				],
			};
			setSession(withLoading);

			try {
				const products = await searchProducts(suggestion, preferences);

				const completeResult: ProductSearchResults = {
					suggestionId,
					products,
					searchedAt: new Date().toISOString(),
					status: 'complete',
				};

				const updated: RecommendationSession = {
					...session,
					step: 'search',
					searchResults: [
						...session.searchResults.filter(
							(r) => r.suggestionId !== suggestionId
						),
						completeResult,
					],
				};

				recommendationStorage.saveSession(updated);
				setSession(updated);
			} catch (err) {
				const errorResult: ProductSearchResults = {
					suggestionId,
					products: [],
					searchedAt: new Date().toISOString(),
					status: 'error',
					error:
						err instanceof Error ? err.message : 'Failed to search for products',
				};

				const updated: RecommendationSession = {
					...session,
					step: 'search',
					searchResults: [
						...session.searchResults.filter(
							(r) => r.suggestionId !== suggestionId
						),
						errorResult,
					],
				};

				recommendationStorage.saveSession(updated);
				setSession(updated);
			}
		},
		[session, preferences]
	);

	const searchDirect = useCallback(
		async (query: string) => {
			if (!preferences) {
				setError('Please set your preferences first');
				return;
			}

			if (!query.trim()) {
				setError('Please enter a search query');
				return;
			}

			setIsLoading(true);
			setError(null);

			// Create session with loading state
			const loadingSession: RecommendationSession = {
				step: 'search',
				mode: 'direct-search',
				suggestions: [],
				searchResults: [],
				directSearch: {
					query: query.trim(),
					results: {
						suggestionId: 'direct-search',
						products: [],
						searchedAt: new Date().toISOString(),
						status: 'loading',
					},
				},
				createdAt: new Date().toISOString(),
			};
			setSession(loadingSession);

			try {
				const products = await searchDirectItem(query.trim(), preferences);

				const completeSession: RecommendationSession = {
					...loadingSession,
					directSearch: {
						query: query.trim(),
						results: {
							suggestionId: 'direct-search',
							products,
							searchedAt: new Date().toISOString(),
							status: 'complete',
						},
					},
				};

				recommendationStorage.saveSession(completeSession);
				setSession(completeSession);
			} catch (err) {
				const errorSession: RecommendationSession = {
					...loadingSession,
					directSearch: {
						query: query.trim(),
						results: {
							suggestionId: 'direct-search',
							products: [],
							searchedAt: new Date().toISOString(),
							status: 'error',
							error:
								err instanceof Error
									? err.message
									: 'Failed to search for products',
						},
					},
				};

				recommendationStorage.saveSession(errorSession);
				setSession(errorSession);
			} finally {
				setIsLoading(false);
			}
		},
		[preferences]
	);

	const resetSession = useCallback(() => {
		recommendationStorage.clearSession();
		setSession(null);
		setError(null);
	}, []);

	return {
		session,
		isLoading,
		error,
		generateSuggestions,
		updateSuggestionStatus,
		refineSuggestion,
		searchForProducts,
		searchDirect,
		resetSession,
	};
}
