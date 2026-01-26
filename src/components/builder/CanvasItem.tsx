import { useState, useRef, useCallback, useEffect } from "react";
import { ClothesWithId, OutfitItem, CropSettings } from "../../types";
import { ImageEditor } from "./ImageEditor";
import "./CanvasItem.css";

interface CanvasItemProps {
  item: OutfitItem;
  clothes: ClothesWithId;
  onUpdate: (updates: Partial<OutfitItem>) => void;
  onDelete: () => void;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Get client coordinates from mouse or touch event
 */
const getEventCoordinates = (
  e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
): Point => {
  if ("touches" in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if ("changedTouches" in e && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
};

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
  const startPosRef = useRef<Point>({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });
  const currentCornerRef = useRef<string>("");
  const itemPositionRef = useRef(item.position);

  // Keep ref in sync with prop
  useEffect(() => {
    itemPositionRef.current = item.position;
  }, [item.position]);

  // Use custom image if available, otherwise use the original
  const displayImageUrl = item.customImageUrl || clothes.imageUrl;

  // --- DRAG HANDLERS ---
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.classList.contains("canvas-item__handle") ||
        target.closest(".canvas-item__controls")
      ) {
        return;
      }
      e.preventDefault();
      setIsDragging(true);

      const coords = getEventCoordinates(e);
      startPosRef.current = {
        x: coords.x - item.position.x,
        y: coords.y - item.position.y,
      };
    },
    [item.position],
  );

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const coords = getEventCoordinates(e);
      const newX = coords.x - startPosRef.current.x;
      const newY = coords.y - startPosRef.current.y;

      onUpdate({
        position: {
          ...itemPositionRef.current,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        },
      });
    },
    [isDragging, onUpdate],
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // --- RESIZE HANDLERS ---
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, corner: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      currentCornerRef.current = corner;

      const coords = getEventCoordinates(e);
      startPosRef.current = coords;
      startSizeRef.current = {
        width: item.position.width,
        height: item.position.height,
      };
    },
    [item.position],
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isResizing) return;
      e.preventDefault();

      const coords = getEventCoordinates(e);
      const deltaX = coords.x - startPosRef.current.x;
      const deltaY = coords.y - startPosRef.current.y;
      const corner = currentCornerRef.current;

      const aspectRatio =
        startSizeRef.current.width / startSizeRef.current.height;

      let newWidth = startSizeRef.current.width;
      let newHeight = startSizeRef.current.height;
      let newX = itemPositionRef.current.x;
      let newY = itemPositionRef.current.y;

      if (corner.includes("e")) {
        newWidth = Math.max(50, startSizeRef.current.width + deltaX);
      }
      if (corner.includes("w")) {
        const widthDelta = -deltaX;
        newWidth = Math.max(50, startSizeRef.current.width + widthDelta);
        if (newWidth !== startSizeRef.current.width) {
          newX =
            itemPositionRef.current.x - (newWidth - startSizeRef.current.width);
        }
      }
      if (corner.includes("s")) {
        newHeight = Math.max(50, startSizeRef.current.height + deltaY);
      }
      if (corner.includes("n")) {
        const heightDelta = -deltaY;
        newHeight = Math.max(50, startSizeRef.current.height + heightDelta);
        if (newHeight !== startSizeRef.current.height) {
          newY =
            itemPositionRef.current.y -
            (newHeight - startSizeRef.current.height);
        }
      }

      // Maintain aspect ratio for corner resizes
      if (corner.length === 2) {
        newHeight = newWidth / aspectRatio;
      }

      onUpdate({
        position: {
          ...itemPositionRef.current,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
          width: newWidth,
          height: newHeight,
        },
      });
    },
    [isResizing, onUpdate],
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    currentCornerRef.current = "";
  }, []);

  // --- EVENT LISTENER MANAGEMENT ---
  useEffect(() => {
    if (isDragging) {
      const moveHandler = (e: MouseEvent | TouchEvent) => handleDragMove(e);
      const endHandler = () => handleDragEnd();

      document.addEventListener("mousemove", moveHandler);
      document.addEventListener("mouseup", endHandler);
      document.addEventListener("touchmove", moveHandler, { passive: false });
      document.addEventListener("touchend", endHandler);
      document.addEventListener("touchcancel", endHandler);

      return () => {
        document.removeEventListener("mousemove", moveHandler);
        document.removeEventListener("mouseup", endHandler);
        document.removeEventListener("touchmove", moveHandler);
        document.removeEventListener("touchend", endHandler);
        document.removeEventListener("touchcancel", endHandler);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      const moveHandler = (e: MouseEvent | TouchEvent) => handleResizeMove(e);
      const endHandler = () => handleResizeEnd();

      document.addEventListener("mousemove", moveHandler);
      document.addEventListener("mouseup", endHandler);
      document.addEventListener("touchmove", moveHandler, { passive: false });
      document.addEventListener("touchend", endHandler);
      document.addEventListener("touchcancel", endHandler);

      return () => {
        document.removeEventListener("mousemove", moveHandler);
        document.removeEventListener("mouseup", endHandler);
        document.removeEventListener("touchmove", moveHandler);
        document.removeEventListener("touchend", endHandler);
        document.removeEventListener("touchcancel", endHandler);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

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
        className={`canvas-item ${isDragging ? "canvas-item--dragging" : ""} ${isResizing ? "canvas-item--resizing" : ""}`}
        style={{
          left: item.position.x,
          top: item.position.y,
          width: item.position.width,
          height: item.position.height,
          zIndex: item.position.zIndex,
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
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

        {/* Resize handles with touch support */}
        <div
          className="canvas-item__handle canvas-item__handle--nw"
          onMouseDown={(e) => handleResizeStart(e, "nw")}
          onTouchStart={(e) => handleResizeStart(e, "nw")}
        />
        <div
          className="canvas-item__handle canvas-item__handle--ne"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
          onTouchStart={(e) => handleResizeStart(e, "ne")}
        />
        <div
          className="canvas-item__handle canvas-item__handle--sw"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
          onTouchStart={(e) => handleResizeStart(e, "sw")}
        />
        <div
          className="canvas-item__handle canvas-item__handle--se"
          onMouseDown={(e) => handleResizeStart(e, "se")}
          onTouchStart={(e) => handleResizeStart(e, "se")}
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
