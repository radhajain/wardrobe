import { useState, useRef, useCallback } from 'react';
import { ClothesWithId, OutfitItem, CropSettings } from '../../types';
import { ImageEditor } from './ImageEditor';
import './CanvasItem.css';

interface CanvasItemProps {
	item: OutfitItem;
	clothes: ClothesWithId;
	onUpdate: (updates: Partial<OutfitItem>) => void;
	onDelete: () => void;
}

export const CanvasItem = ({
	item,
	clothes,
	onUpdate,
	onDelete,
}: CanvasItemProps) => {
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [showEditor, setShowEditor] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const startPosRef = useRef({ x: 0, y: 0 });
	const startSizeRef = useRef({ width: 0, height: 0 });

	// Use custom image if available, otherwise use the original
	const displayImageUrl = item.customImageUrl || clothes.imageUrl;

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (
				(e.target as HTMLElement).classList.contains('canvas-item__handle') ||
				(e.target as HTMLElement).closest('.canvas-item__controls')
			) {
				return;
			}
			e.preventDefault();
			setIsDragging(true);
			startPosRef.current = {
				x: e.clientX - item.position.x,
				y: e.clientY - item.position.y,
			};

			const handleMouseMove = (moveEvent: MouseEvent) => {
				const newX = moveEvent.clientX - startPosRef.current.x;
				const newY = moveEvent.clientY - startPosRef.current.y;
				onUpdate({
					position: {
						...item.position,
						x: Math.max(0, newX),
						y: Math.max(0, newY),
					},
				});
			};

			const handleMouseUp = () => {
				setIsDragging(false);
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};

			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		},
		[item.position, onUpdate]
	);

	const handleResize = useCallback(
		(e: React.MouseEvent, corner: string) => {
			e.preventDefault();
			e.stopPropagation();
			setIsResizing(true);
			startPosRef.current = { x: e.clientX, y: e.clientY };
			startSizeRef.current = {
				width: item.position.width,
				height: item.position.height,
			};

			const aspectRatio =
				startSizeRef.current.width / startSizeRef.current.height;

			const handleMouseMove = (moveEvent: MouseEvent) => {
				const deltaX = moveEvent.clientX - startPosRef.current.x;
				const deltaY = moveEvent.clientY - startPosRef.current.y;

				let newWidth = startSizeRef.current.width;
				let newHeight = startSizeRef.current.height;
				let newX = item.position.x;
				let newY = item.position.y;

				if (corner.includes('e')) {
					newWidth = Math.max(50, startSizeRef.current.width + deltaX);
				}
				if (corner.includes('w')) {
					const widthDelta = -deltaX;
					newWidth = Math.max(50, startSizeRef.current.width + widthDelta);
					if (newWidth !== startSizeRef.current.width) {
						newX = item.position.x - widthDelta;
					}
				}
				if (corner.includes('s')) {
					newHeight = Math.max(50, startSizeRef.current.height + deltaY);
				}
				if (corner.includes('n')) {
					const heightDelta = -deltaY;
					newHeight = Math.max(50, startSizeRef.current.height + heightDelta);
					if (newHeight !== startSizeRef.current.height) {
						newY = item.position.y - heightDelta;
					}
				}

				// Maintain aspect ratio for corner resizes
				if (corner.length === 2) {
					newHeight = newWidth / aspectRatio;
				}

				onUpdate({
					position: {
						...item.position,
						x: Math.max(0, newX),
						y: Math.max(0, newY),
						width: newWidth,
						height: newHeight,
					},
				});
			};

			const handleMouseUp = () => {
				setIsResizing(false);
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};

			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		},
		[item.position, onUpdate]
	);

	const handleEditorSave = (result: {
		imageUrl?: string;
		crop?: CropSettings;
	}) => {
		onUpdate({
			customImageUrl: result.imageUrl,
			crop: result.crop,
		});
		setShowEditor(false);
	};

	return (
		<>
			<div
				ref={containerRef}
				className={`canvas-item ${isDragging ? 'canvas-item--dragging' : ''} ${isResizing ? 'canvas-item--resizing' : ''}`}
				style={{
					left: item.position.x,
					top: item.position.y,
					width: item.position.width,
					height: item.position.height,
					zIndex: item.position.zIndex,
				}}
				onMouseDown={handleMouseDown}
			>
				{displayImageUrl ? (
					<img
						src={displayImageUrl}
						alt={clothes.name}
						className="canvas-item__image"
						draggable={false}
					/>
				) : (
					<div className="canvas-item__placeholder">
						<span>{clothes.type}</span>
					</div>
				)}

				<div className="canvas-item__controls">
					<button
						className="canvas-item__btn canvas-item__btn--edit"
						onClick={(e) => {
							e.stopPropagation();
							setShowEditor(true);
						}}
						title="Edit image"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
							<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
						</svg>
					</button>
					<button
						className="canvas-item__btn canvas-item__btn--delete"
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						title="Delete"
					>
						&times;
					</button>
				</div>

				{/* Resize handles */}
				<div
					className="canvas-item__handle canvas-item__handle--nw"
					onMouseDown={(e) => handleResize(e, 'nw')}
				/>
				<div
					className="canvas-item__handle canvas-item__handle--ne"
					onMouseDown={(e) => handleResize(e, 'ne')}
				/>
				<div
					className="canvas-item__handle canvas-item__handle--sw"
					onMouseDown={(e) => handleResize(e, 'sw')}
				/>
				<div
					className="canvas-item__handle canvas-item__handle--se"
					onMouseDown={(e) => handleResize(e, 'se')}
				/>
			</div>

			{showEditor && clothes.imageUrl && (
				<ImageEditor
					imageUrl={item.customImageUrl || clothes.imageUrl}
					initialCrop={item.crop}
					onSave={handleEditorSave}
					onClose={() => setShowEditor(false)}
				/>
			)}
		</>
	);
};
