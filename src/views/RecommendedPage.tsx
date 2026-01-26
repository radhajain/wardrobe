import { useWardrobe } from "../hooks/useWardrobe";
import { useRecommendationPreferences } from "../hooks/useRecommendationPreferences";
import { useRecommendations } from "../hooks/useRecommendations";
import { PreferencesPanel } from "../components/recommended/PreferencesPanel";
import { RecommendationPanel } from "../components/recommended/RecommendationPanel";
import "./RecommendedPage.css";

/**
 * Main page for shopping recommendations
 * Two-column layout: preferences sidebar + recommendation panel
 */
export function RecommendedPage() {
  const { items: wardrobe, loading: wardrobeLoading } = useWardrobe();

  const {
    preferences,
    loading: preferencesLoading,
    updateStorePreference,
    addStore,
    removeStore,
    updatePriceLimit,
    removePriceLimit,
  } = useRecommendationPreferences(wardrobe);

  const {
    session,
    isLoading,
    error,
    generateSuggestions,
    updateSuggestionStatus,
    refineSuggestion,
    searchForProducts,
    searchDirect,
    resetSession,
  } = useRecommendations(wardrobe, preferences);

  if (wardrobeLoading || preferencesLoading) {
    return (
      <div className="recommended-page">
        <div className="recommended-page__loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="recommended-page">
      <div className="recommended-page__content">
        <PreferencesPanel
          preferences={preferences}
          onUpdateStorePreference={updateStorePreference}
          onAddStore={addStore}
          onRemoveStore={removeStore}
          onUpdatePriceLimit={updatePriceLimit}
          onRemovePriceLimit={removePriceLimit}
        />

        <main className="recommended-page__main">
          <RecommendationPanel
            session={session}
            wardrobe={wardrobe}
            isLoading={isLoading}
            error={error}
            onGenerateSuggestions={generateSuggestions}
            onUpdateSuggestionStatus={updateSuggestionStatus}
            onRefineSuggestion={refineSuggestion}
            onSearchProducts={searchForProducts}
            onSearchDirect={searchDirect}
            onReset={resetSession}
          />
        </main>
      </div>
    </div>
  );
}
