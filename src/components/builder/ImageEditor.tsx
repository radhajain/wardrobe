import { useState, useRef, useEffect } from 'react';
import { CropSettings } from '../../types';
import { removeBackground, cropImage } from '../../services/imageProcessing';
import './ImageEditor.css';

interface ImageEditorProps {
	imageUrl: string;
	initialCrop?: CropSettings;
	onSave: (result: { imageUrl?: string; crop?: CropSettings }) => void;
	onClose: () => void;
}

export const ImageEditor = ({
	imageUrl,
	initialCrop,
	onSave,
	onClose,
}: ImageEditorProps) => {
	const [activeTab, setActiveTab] = useState<'crop' | 'background'>('crop');
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState('');
	const [previewUrl, setPreviewUrl] = useState(imageUrl);

	// Crop state
	const [crop, setCrop] = useState<CropSettings>(
		initialCrop || { top: 0, right: 0, bottom: 0, left: 0 }
	);

	const imageRef = useRef<HTMLImageElement>(null);

	// Update preview when crop changes
	useEffect(() => {
		if (crop.top === 0 && crop.right === 0 && crop.bottom === 0 && crop.left === 0) {
			setPreviewUrl(imageUrl);
			return;
		}

		const updatePreview = async () => {
			try {
				const cropped = await cropImage(imageUrl, crop);
				setPreviewUrl(cropped);
			} catch (err) {
				console.error('Failed to update crop preview:', err);
			}
		};

		const debounce = setTimeout(updatePreview, 300);
		return () => clearTimeout(debounce);
	}, [crop, imageUrl]);

	const handleRemoveBackground = async () => {
		setIsProcessing(true);
		setError('');

		try {
			const result = await removeBackground(imageUrl);
			setPreviewUrl(result);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to remove background'
			);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleSave = () => {
		// If background was removed, save the new URL
		// If only cropped, save the crop settings
		if (previewUrl !== imageUrl && !previewUrl.startsWith('data:')) {
			onSave({ crop });
		} else if (previewUrl.startsWith('data:')) {
			onSave({ imageUrl: previewUrl, crop: { top: 0, right: 0, bottom: 0, left: 0 } });
		} else {
			onSave({ crop });
		}
	};

	const handleReset = () => {
		setCrop({ top: 0, right: 0, bottom: 0, left: 0 });
		setPreviewUrl(imageUrl);
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="image-editor"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="image-editor__header">
					<h2 className="image-editor__title">Edit Image</h2>
					<button className="image-editor__close" onClick={onClose}>
						&times;
					</button>
				</div>

				<div className="image-editor__tabs">
					<button
						className={`image-editor__tab ${activeTab === 'crop' ? 'image-editor__tab--active' : ''}`}
						onClick={() => setActiveTab('crop')}
					>
						Crop
					</button>
					<button
						className={`image-editor__tab ${activeTab === 'background' ? 'image-editor__tab--active' : ''}`}
						onClick={() => setActiveTab('background')}
					>
						Remove Background
					</button>
				</div>

				<div className="image-editor__content">
					<div className="image-editor__preview">
						<img
							ref={imageRef}
							src={previewUrl}
							alt="Preview"
							className="image-editor__image"
						/>
					</div>

					{activeTab === 'crop' && (
						<div className="image-editor__controls">
							<div className="image-editor__crop-controls">
								<div className="image-editor__crop-field">
									<label>Top</label>
									<input
										type="range"
										min="0"
										max="50"
										value={crop.top}
										onChange={(e) =>
											setCrop({ ...crop, top: Number(e.target.value) })
										}
									/>
									<span>{crop.top}%</span>
								</div>
								<div className="image-editor__crop-field">
									<label>Bottom</label>
									<input
										type="range"
										min="0"
										max="50"
										value={crop.bottom}
										onChange={(e) =>
											setCrop({ ...crop, bottom: Number(e.target.value) })
										}
									/>
									<span>{crop.bottom}%</span>
								</div>
								<div className="image-editor__crop-field">
									<label>Left</label>
									<input
										type="range"
										min="0"
										max="50"
										value={crop.left}
										onChange={(e) =>
											setCrop({ ...crop, left: Number(e.target.value) })
										}
									/>
									<span>{crop.left}%</span>
								</div>
								<div className="image-editor__crop-field">
									<label>Right</label>
									<input
										type="range"
										min="0"
										max="50"
										value={crop.right}
										onChange={(e) =>
											setCrop({ ...crop, right: Number(e.target.value) })
										}
									/>
									<span>{crop.right}%</span>
								</div>
							</div>
						</div>
					)}

					{activeTab === 'background' && (
						<div className="image-editor__controls">
							<p className="image-editor__description">
								Remove the background from this image to isolate the clothing
								item.
							</p>
							<button
								className="image-editor__action-btn"
								onClick={handleRemoveBackground}
								disabled={isProcessing}
							>
								{isProcessing ? 'Processing...' : 'Remove Background'}
							</button>
							{error && <p className="image-editor__error">{error}</p>}
						</div>
					)}
				</div>

				<div className="image-editor__footer">
					<button
						className="image-editor__btn image-editor__btn--secondary"
						onClick={handleReset}
					>
						Reset
					</button>
					<div className="image-editor__footer-right">
						<button
							className="image-editor__btn image-editor__btn--secondary"
							onClick={onClose}
						>
							Cancel
						</button>
						<button
							className="image-editor__btn image-editor__btn--primary"
							onClick={handleSave}
						>
							Apply
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
