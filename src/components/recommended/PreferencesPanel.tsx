import { ClothingType, RecommendationPreferences, StorePreference } from '../../types';
import { StorePreferences } from './StorePreferences';
import { PricingPreferences } from './PricingPreferences';
import './PreferencesPanel.css';

interface PreferencesPanelProps {
	preferences: RecommendationPreferences | null;
	onUpdateStorePreference: (storeName: string, preference: StorePreference) => void;
	onAddStore: (storeName: string) => void;
	onRemoveStore: (storeName: string) => void;
	onUpdatePriceLimit: (clothingType: ClothingType, maxPrice: number) => void;
	onRemovePriceLimit: (clothingType: ClothingType) => void;
}

/**
 * Left sidebar panel for managing shopping preferences
 */
export function PreferencesPanel({
	preferences,
	onUpdateStorePreference,
	onAddStore,
	onRemoveStore,
	onUpdatePriceLimit,
	onRemovePriceLimit,
}: PreferencesPanelProps) {
	if (!preferences) {
		return (
			<aside className="preferences-panel">
				<div className="preferences-panel__loading">Loading preferences...</div>
			</aside>
		);
	}

	return (
		<aside className="preferences-panel">
			<h2 className="preferences-panel__header">Preferences</h2>

			<div className="preferences-panel__section">
				<StorePreferences
					stores={preferences.stores}
					onUpdatePreference={onUpdateStorePreference}
					onAddStore={onAddStore}
					onRemoveStore={onRemoveStore}
				/>
			</div>

			<div className="preferences-panel__divider" />

			<div className="preferences-panel__section">
				<PricingPreferences
					priceLimits={preferences.priceLimits}
					onUpdatePriceLimit={onUpdatePriceLimit}
					onRemovePriceLimit={onRemovePriceLimit}
				/>
			</div>
		</aside>
	);
}
