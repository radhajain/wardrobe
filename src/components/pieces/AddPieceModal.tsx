import { useState, useRef } from 'react';
import { Clothes, ClothingType } from '../../types';
import './AddPieceModal.css';
import { extractProductDetails } from '../../services/extractProductDetails';
import { ImageSourceSelector } from './ImageSourceSelector';

interface AddPieceModalProps {
	onClose: () => void;
	onAdd: (piece: Clothes) => void;
}

const CLOTHING_TYPES: ClothingType[] = [
	'coat',
	'jacket',
	'denim',
	'dress',
	'skirt',
	'top',
	'pants',
	'knitwear',
	'shoes',
	'bag',
	'accessory',
	'other',
];

export const AddPieceModal = ({ onClose, onAdd }: AddPieceModalProps) => {
	const [productUrl, setProductUrl] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const abortControllerRef = useRef<AbortController | null>(null);

	// Form fields
	const [name, setName] = useState('');
	const [type, setType] = useState<ClothingType>('other');
	const [color, setColor] = useState('');
	const [style, setStyle] = useState('');
	const [designer, setDesigner] = useState('');
	const [imageUrl, setImageUrl] = useState('');
	const [productImages, setProductImages] = useState<string[]>([]);
	const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);

	const [showForm, setShowForm] = useState(false);

	const handleFetchDetails = async () => {
		if (!productUrl.trim()) {
			setError('Please enter a product URL');
			return;
		}

		// Create a new AbortController for this request
		abortControllerRef.current = new AbortController();

		setIsLoading(true);
		setError('');

		try {
			const details = await extractProductDetails(productUrl, abortControllerRef.current.signal);

			// Populate form fields with extracted data
			setName(details.name || '');
			setType(details.type || 'other');
			setColor(details.color || '');
			setStyle(details.style || '');
			setDesigner(details.designer || '');
			setImageUrl(details.imageUrl || '');
			setProductImages(details.imageUrls || []);
			setUploadedImageBase64(null);

			setShowForm(true);
		} catch (err) {
			// Don't show error if request was aborted
			if (err instanceof Error && err.name === 'AbortError') {
				return;
			}
			setError(
				err instanceof Error ? err.message : 'Failed to fetch product details'
			);
		} finally {
			setIsLoading(false);
			abortControllerRef.current = null;
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			setError('Please enter a name');
			return;
		}

		// Use uploaded base64 image or URL-based image
		const finalImageUrl = uploadedImageBase64 || imageUrl.trim() || undefined;

		const piece: Clothes = {
			name: name.trim(),
			type,
			color: color.trim(),
			style: style.trim(),
			designer: designer.trim(),
			productUrl: productUrl.trim() || undefined,
			imageUrl: finalImageUrl,
		};

		onAdd(piece);
	};

	const handleSkipFetch = () => {
		// Abort any in-progress fetch request
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setIsLoading(false);
		setError('');
		setShowForm(true);
	};

	return (
		<div className="modal-overlay">
			<div className="modal">
				<div className="modal__header">
					<h2 className="modal__title">Add New Piece</h2>
					<button className="modal__close" onClick={onClose}>
						&times;
					</button>
				</div>

				<div className="modal__content">
					{!showForm ? (
						<div className="add-piece__url-step">
							<p className="add-piece__instructions">
								Enter a product URL to automatically fill in the details, or
								skip to enter manually.
							</p>

							<div className="add-piece__url-input-group">
								<input
									type="url"
									className="add-piece__url-input"
									placeholder="https://example.com/product/..."
									value={productUrl}
									onChange={(e) => setProductUrl(e.target.value)}
									disabled={isLoading}
								/>
								<button
									className="add-piece__fetch-btn"
									onClick={handleFetchDetails}
									disabled={isLoading}
								>
									{isLoading ? 'Fetching...' : 'Fetch Details'}
								</button>
							</div>

							{error && <p className="add-piece__error">{error}</p>}

							<button
								className="add-piece__skip-btn"
								onClick={handleSkipFetch}
							>
								{isLoading ? 'Skip' : 'Skip and enter manually'}
							</button>
						</div>
					) : (
						<form className="add-piece__form" onSubmit={handleSubmit}>
							<ImageSourceSelector
								selectedImageUrl={uploadedImageBase64 || imageUrl}
								productImages={productImages}
								onImageSelect={(url) => {
									setImageUrl(url);
									setUploadedImageBase64(null);
								}}
								onFileUpload={(base64) => {
									setUploadedImageBase64(base64);
									setImageUrl('');
								}}
							/>

							<div className="add-piece__field">
								<label htmlFor="name">Name *</label>
								<input
									id="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Product name"
									required
								/>
							</div>

							<div className="add-piece__field">
								<label htmlFor="type">Type</label>
								<select
									id="type"
									value={type}
									onChange={(e) => setType(e.target.value as ClothingType)}
								>
									{CLOTHING_TYPES.map((t) => (
										<option key={t} value={t}>
											{t.charAt(0).toUpperCase() + t.slice(1)}
										</option>
									))}
								</select>
							</div>

							<div className="add-piece__field">
								<label htmlFor="designer">Designer / Brand</label>
								<input
									id="designer"
									type="text"
									value={designer}
									onChange={(e) => setDesigner(e.target.value)}
									placeholder="Brand name"
								/>
							</div>

							<div className="add-piece__field">
								<label htmlFor="color">Color</label>
								<input
									id="color"
									type="text"
									value={color}
									onChange={(e) => setColor(e.target.value)}
									placeholder="Primary color"
								/>
							</div>

							<div className="add-piece__field">
								<label htmlFor="style">Style Description</label>
								<input
									id="style"
									type="text"
									value={style}
									onChange={(e) => setStyle(e.target.value)}
									placeholder="Materials, fit, details..."
								/>
							</div>

							<div className="add-piece__field">
								<label htmlFor="productUrl">Product URL</label>
								<input
									id="productUrl"
									type="url"
									value={productUrl}
									onChange={(e) => setProductUrl(e.target.value)}
									placeholder="https://..."
								/>
							</div>

							{error && <p className="add-piece__error">{error}</p>}

							<div className="add-piece__actions">
								<button
									type="button"
									className="add-piece__btn add-piece__btn--secondary"
									onClick={() => setShowForm(false)}
								>
									Back
								</button>
								<button
									type="submit"
									className="add-piece__btn add-piece__btn--primary"
								>
									Add Piece
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
};
