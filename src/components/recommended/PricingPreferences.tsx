import { useState } from 'react';
import { ClothingType, ClothingTypes, PriceLimit } from '../../types';
import './PricingPreferences.css';

interface PricingPreferencesProps {
	priceLimits: PriceLimit[];
	onUpdatePriceLimit: (clothingType: ClothingType, maxPrice: number) => void;
	onRemovePriceLimit: (clothingType: ClothingType) => void;
}

/**
 * Component for managing price limits per clothing type
 */
export function PricingPreferences({
	priceLimits,
	onUpdatePriceLimit,
	onRemovePriceLimit,
}: PricingPreferencesProps) {
	const [selectedType, setSelectedType] = useState<ClothingType | ''>('');
	const [priceInput, setPriceInput] = useState('');

	const existingTypes = new Set(priceLimits.map((p) => p.clothingType));
	const availableTypes = Object.values(ClothingTypes).filter(
		(t) => !existingTypes.has(t)
	);

	const handleAdd = () => {
		if (selectedType && priceInput) {
			const price = parseInt(priceInput, 10);
			if (!isNaN(price) && price > 0) {
				onUpdatePriceLimit(selectedType, price);
				setSelectedType('');
				setPriceInput('');
			}
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleAdd();
		}
	};

	return (
		<div className="pricing-preferences">
			<h3 className="pricing-preferences__title">Price Limits</h3>

			{priceLimits.length > 0 && (
				<ul className="pricing-preferences__list">
					{priceLimits.map((limit) => (
						<li key={limit.clothingType} className="pricing-item">
							<span className="pricing-item__type">
								{formatClothingType(limit.clothingType)}
							</span>
							<span className="pricing-item__price">
								Max ${limit.maxPrice.toLocaleString()}
							</span>
							<button
								className="pricing-item__remove"
								onClick={() => onRemovePriceLimit(limit.clothingType)}
								title="Remove limit"
							>
								&times;
							</button>
						</li>
					))}
				</ul>
			)}

			{availableTypes.length > 0 && (
				<div className="pricing-preferences__add">
					<select
						className="pricing-preferences__select"
						value={selectedType}
						onChange={(e) => setSelectedType(e.target.value as ClothingType)}
					>
						<option value="">Select type...</option>
						{availableTypes.map((type) => (
							<option key={type} value={type}>
								{formatClothingType(type)}
							</option>
						))}
					</select>
					<div className="pricing-preferences__price-input">
						<span className="pricing-preferences__currency">$</span>
						<input
							type="number"
							className="pricing-preferences__input"
							placeholder="Max"
							value={priceInput}
							onChange={(e) => setPriceInput(e.target.value)}
							onKeyDown={handleKeyDown}
							min="1"
						/>
					</div>
					<button
						className="pricing-preferences__add-btn"
						onClick={handleAdd}
						disabled={!selectedType || !priceInput}
					>
						Add
					</button>
				</div>
			)}

			{priceLimits.length === 0 && (
				<p className="pricing-preferences__hint">
					Set max prices per item type to filter search results.
				</p>
			)}
		</div>
	);
}

function formatClothingType(type: ClothingType): string {
	return type.charAt(0).toUpperCase() + type.slice(1);
}
