import { useState, useRef } from 'react';
import './ImageSourceSelector.css';

type ImageSource = 'product' | 'upload' | 'url';

interface ImageSourceSelectorProps {
	/** Currently selected image URL (for preview) */
	selectedImageUrl: string;
	/** Images extracted from product page (if any) */
	productImages: string[];
	/** Callback when image selection changes */
	onImageSelect: (imageUrl: string) => void;
	/** Callback when file is uploaded (base64 data URL) */
	onFileUpload: (base64: string) => void;
}

export const ImageSourceSelector = ({
	selectedImageUrl,
	productImages,
	onImageSelect,
	onFileUpload,
}: ImageSourceSelectorProps) => {
	const hasProductImages = productImages.length > 0;
	const [activeTab, setActiveTab] = useState<ImageSource>(
		hasProductImages ? 'product' : 'upload'
	);
	const [customUrl, setCustomUrl] = useState('');
	const [customUrlError, setCustomUrlError] = useState('');
	const [isLoadingPreview, setIsLoadingPreview] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);
	const [uploadError, setUploadError] = useState('');
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleTabChange = (tab: ImageSource) => {
		if (tab === 'product' && !hasProductImages) return;
		setActiveTab(tab);
	};

	const handleProductImageSelect = (url: string) => {
		onImageSelect(url);
	};

	const handleFileSelect = (file: File) => {
		setUploadError('');

		if (!file.type.startsWith('image/')) {
			setUploadError('Please select an image file');
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			setUploadError('Image must be less than 10MB');
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const base64 = reader.result as string;
			onFileUpload(base64);
		};
		reader.onerror = () => {
			setUploadError('Failed to read file');
		};
		reader.readAsDataURL(file);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);

		const file = e.dataTransfer.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	const handleCustomUrlChange = (url: string) => {
		setCustomUrl(url);
		setCustomUrlError('');
	};

	const handleLoadPreview = async () => {
		if (!customUrl.trim()) {
			setCustomUrlError('Please enter a URL');
			return;
		}

		try {
			new URL(customUrl);
		} catch {
			setCustomUrlError('Please enter a valid URL');
			return;
		}

		setIsLoadingPreview(true);
		setCustomUrlError('');

		try {
			await new Promise<void>((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve();
				img.onerror = () => reject(new Error('Failed to load'));
				img.src = customUrl;

				setTimeout(() => reject(new Error('Timeout')), 10000);
			});

			onImageSelect(customUrl);
		} catch {
			setCustomUrlError('Unable to load image. The URL may be invalid or blocked.');
		} finally {
			setIsLoadingPreview(false);
		}
	};

	return (
		<div className="image-source-selector">
			<label className="image-source-selector__label">Image</label>

			<div className="image-source-selector__tabs">
				<button
					type="button"
					className={`image-source-selector__tab ${activeTab === 'product' ? 'image-source-selector__tab--active' : ''} ${!hasProductImages ? 'image-source-selector__tab--disabled' : ''}`}
					onClick={() => handleTabChange('product')}
					disabled={!hasProductImages}
				>
					From Product
				</button>
				<button
					type="button"
					className={`image-source-selector__tab ${activeTab === 'upload' ? 'image-source-selector__tab--active' : ''}`}
					onClick={() => handleTabChange('upload')}
				>
					Upload
				</button>
				<button
					type="button"
					className={`image-source-selector__tab ${activeTab === 'url' ? 'image-source-selector__tab--active' : ''}`}
					onClick={() => handleTabChange('url')}
				>
					URL
				</button>
			</div>

			<div className="image-source-selector__panel">
				{activeTab === 'product' && hasProductImages && (
					<div className="image-source-selector__grid">
						{productImages.map((url, index) => (
							<button
								key={index}
								type="button"
								className={`image-source-selector__thumb ${selectedImageUrl === url ? 'image-source-selector__thumb--selected' : ''}`}
								onClick={() => handleProductImageSelect(url)}
							>
								<img src={url} alt={`Product image ${index + 1}`} />
							</button>
						))}
					</div>
				)}

				{activeTab === 'upload' && (
					<>
						<div
							className={`image-source-selector__upload-zone ${isDragOver ? 'image-source-selector__upload-zone--dragover' : ''}`}
							onClick={handleUploadClick}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
						>
							<div className="image-source-selector__upload-icon">+</div>
							<div className="image-source-selector__upload-text">
								Click or drag image here
							</div>
							<div className="image-source-selector__upload-hint">
								Max 10MB
							</div>
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleInputChange}
							style={{ display: 'none' }}
						/>
						{uploadError && (
							<div className="image-source-selector__error">{uploadError}</div>
						)}
					</>
				)}

				{activeTab === 'url' && (
					<>
						<div className="image-source-selector__url-group">
							<input
								type="url"
								className="image-source-selector__url-input"
								placeholder="https://example.com/image.jpg"
								value={customUrl}
								onChange={(e) => handleCustomUrlChange(e.target.value)}
							/>
							<button
								type="button"
								className="image-source-selector__load-btn"
								onClick={handleLoadPreview}
								disabled={isLoadingPreview}
							>
								{isLoadingPreview ? 'Loading...' : 'Load'}
							</button>
						</div>
						{customUrlError && (
							<div className="image-source-selector__error">{customUrlError}</div>
						)}
					</>
				)}
			</div>

			{selectedImageUrl && (
				<div className="image-source-selector__preview">
					<img src={selectedImageUrl} alt="Selected preview" />
				</div>
			)}
		</div>
	);
};
