import { useState } from 'react';
import { StoreInfo, StorePreference } from '../../types';
import './StorePreferences.css';

interface StorePreferencesProps {
	stores: StoreInfo[];
	onUpdatePreference: (storeName: string, preference: StorePreference) => void;
	onAddStore: (storeName: string) => void;
	onRemoveStore: (storeName: string) => void;
}

/**
 * Component for managing store preferences
 */
export function StorePreferences({
	stores,
	onUpdatePreference,
	onAddStore,
	onRemoveStore,
}: StorePreferencesProps) {
	const [newStoreName, setNewStoreName] = useState('');

	const handleAddStore = () => {
		const trimmed = newStoreName.trim();
		if (
			trimmed &&
			!stores.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())
		) {
			onAddStore(trimmed);
			setNewStoreName('');
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleAddStore();
		}
	};

	const preferredStores = stores.filter((s) => s.preference === 'preferred');
	const avoidedStores = stores.filter((s) => s.preference === 'avoided');
	const neutralStores = stores.filter((s) => s.preference === 'neutral');

	return (
		<div className="store-preferences">
			<h3 className="store-preferences__title">Stores</h3>

			<div className="store-preferences__add">
				<input
					type="text"
					className="store-preferences__input"
					placeholder="Add a store..."
					value={newStoreName}
					onChange={(e) => setNewStoreName(e.target.value)}
					onKeyDown={handleKeyDown}
				/>
				<button
					className="store-preferences__add-btn"
					onClick={handleAddStore}
					disabled={!newStoreName.trim()}
				>
					Add
				</button>
			</div>

			{preferredStores.length > 0 && (
				<div className="store-preferences__section">
					<h4 className="store-preferences__section-title">Preferred</h4>
					<ul className="store-preferences__list">
						{preferredStores.map((store) => (
							<StoreItem
								key={store.name}
								store={store}
								onUpdatePreference={onUpdatePreference}
								onRemove={onRemoveStore}
							/>
						))}
					</ul>
				</div>
			)}

			{avoidedStores.length > 0 && (
				<div className="store-preferences__section">
					<h4 className="store-preferences__section-title">Avoided</h4>
					<ul className="store-preferences__list">
						{avoidedStores.map((store) => (
							<StoreItem
								key={store.name}
								store={store}
								onUpdatePreference={onUpdatePreference}
								onRemove={onRemoveStore}
							/>
						))}
					</ul>
				</div>
			)}

			{neutralStores.length > 0 && (
				<div className="store-preferences__section">
					<h4 className="store-preferences__section-title">Neutral</h4>
					<ul className="store-preferences__list">
						{neutralStores.map((store) => (
							<StoreItem
								key={store.name}
								store={store}
								onUpdatePreference={onUpdatePreference}
								onRemove={onRemoveStore}
							/>
						))}
					</ul>
				</div>
			)}

			{stores.length === 0 && (
				<p className="store-preferences__empty">
					No stores yet. Add stores you'd like to shop from.
				</p>
			)}
		</div>
	);
}

interface StoreItemProps {
	store: StoreInfo;
	onUpdatePreference: (storeName: string, preference: StorePreference) => void;
	onRemove: (storeName: string) => void;
}

function StoreItem({ store, onUpdatePreference, onRemove }: StoreItemProps) {
	return (
		<li className="store-item">
			<span className="store-item__name">{store.name}</span>
			<div className="store-item__actions">
				<select
					className="store-item__select"
					value={store.preference}
					onChange={(e) =>
						onUpdatePreference(store.name, e.target.value as StorePreference)
					}
				>
					<option value="preferred">Preferred</option>
					<option value="neutral">Neutral</option>
					<option value="avoided">Avoided</option>
				</select>
				{!store.isFromHistory && (
					<button
						className="store-item__remove"
						onClick={() => onRemove(store.name)}
						title="Remove store"
					>
						&times;
					</button>
				)}
			</div>
		</li>
	);
}
