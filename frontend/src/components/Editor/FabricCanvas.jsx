import React, { useEffect, useRef, useState } from 'react';

export default function FabricCanvas({
  page,
  zoomScale = 1.0,
  selectedElementId,
  onSelectElement,
  onElementChange,
  localDeviceFonts = []
}) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const [containerDim, setContainerDim] = useState({ width: 0, height: 0 });

  const [draggingId, setDraggingId] = useState(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, elemX: 0, elemY: 0 });

  // Dynamically update container dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDim({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Handle Escape key deselection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onSelectElement) {
        onSelectElement(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectElement]);

  // Viewport and Stage fitting math
  const viewportW = containerDim.width;
  const viewportH = containerDim.height;

  const availW = Math.max(100, viewportW - 32);
  const availH = Math.max(100, viewportH - 32);

  // CANONICAL SOURCE DIMENSIONS: Strictly derive from page object to guarantee 1:1 OCR element mapping
  const sourceW = page?.width || 800;
  const sourceH = page?.height || 1100;

  const fitScale = Math.min(availW / sourceW, availH / sourceH) || 1.0;
  const effectiveScale = fitScale * (zoomScale || 1.0);

  // Layout container bounds for stage
  const displayW = Math.round(sourceW * effectiveScale);
  const displayH = Math.round(sourceH * effectiveScale);

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

  // Active Viewport Drag Panning
  const handleViewportMouseDown = (e) => {
    // Trigger canvas panning on middle click or clicking empty stage background
    const isStageBg = e.target === containerRef.current || e.target.classList.contains('source-image') || e.target.classList.contains('document-stage');
    if (isStageBg && (e.button === 0 || e.button === 1)) {
      if (onSelectElement) onSelectElement(null);
      setIsPanning(true);
      if (containerRef.current) {
        panStartRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          scrollLeft: containerRef.current.scrollLeft,
          scrollTop: containerRef.current.scrollTop,
        };
      }
    }
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  // Handle Dragging Elements (in source coordinate space)
  const handleMouseDownElement = (e, el) => {
    if (e.button !== 0) return; // Left click only
    e.stopPropagation();

    if (onSelectElement) {
      onSelectElement(el.id);
    }

    setDraggingId(el.id);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: el.x,
      elemY: el.y,
    };
  };

  useEffect(() => {
    if (!draggingId) return;

    const handleMouseMove = (e) => {
      const dx = (e.clientX - dragStartRef.current.mouseX) / effectiveScale;
      const dy = (e.clientY - dragStartRef.current.mouseY) / effectiveScale;

      const newX = Math.max(0, Math.round(dragStartRef.current.elemX + dx));
      const newY = Math.max(0, Math.round(dragStartRef.current.elemY + dy));

      if (onElementChange) {
        onElementChange(draggingId, { x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setDraggingId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, effectiveScale, onElementChange]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleViewportMouseDown}
      className={`editor-viewport relative w-full h-full min-h-full bg-slate-950 overflow-auto select-none p-6 md:p-10 flex transition-colors ${
        isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      onClick={(e) => {
        if (e.target === containerRef.current && onSelectElement) {
          onSelectElement(null);
        }
      }}
    >
      {page?.backgroundImage ? (
        /* IMMUTABLE UNTRIMMED DOCUMENT STAGE */
        <div
          className="document-stage relative shadow-2xl rounded-sm overflow-hidden bg-white shrink-0 m-auto"
          style={{
            width: `${displayW}px`,
            height: `${displayH}px`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && onSelectElement) {
              onSelectElement(null);
            }
          }}
        >
          {/* IMMUTABLE ORIGINAL SOURCE IMAGE - 100% UNFLATTENED FULL ASPECT RATIO */}
          <img
            ref={imgRef}
            className="source-image w-full h-full block pointer-events-none select-none"
            src={page.backgroundImage}
            alt="Original Source Document"
            draggable="false"
            onError={(err) => console.error("Image loading error:", err)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />

          {/* OCR INTERACTION LAYER (Exact Floating-Point Display Scaled Coordinates) */}
          <div
            className="ocr-layer absolute inset-0 w-full h-full pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'visible',
            }}
          >
            {page?.elements?.map((el) => {
              const origX = el.originalX !== undefined ? el.originalX : el.x;
              const origY = el.originalY !== undefined ? el.originalY : el.y;
              const origW = el.originalWidth !== undefined ? el.originalWidth : el.width;
              const origH = el.originalHeight !== undefined ? el.originalHeight : el.height;

              const isMoved = Math.abs(el.x - origX) > 1 || Math.abs(el.y - origY) > 1;
              const isContentChanged = el.text !== el.originalText;
              const isDeleted = Boolean(el.isDeleted);
              const isEdited = el.isEdited || el.isNew || el.isUserCreated || isMoved || isContentChanged || isDeleted;
              const isSelected = selectedElementId === el.id;

              // Compute precise float display positions to prevent rounding shift
              const scaledX = el.x * effectiveScale;
              const scaledY = el.y * effectiveScale;
              const scaledW = Math.max(10, el.width * effectiveScale);
              const scaledH = Math.max(10, el.height * effectiveScale);

              const scaledOrigX = origX * effectiveScale;
              const scaledOrigY = origY * effectiveScale;
              const scaledOrigW = Math.max(10, origW * effectiveScale);
              const scaledOrigH = Math.max(10, origH * effectiveScale);

              const bgColor = el.bgColor || '#ffffff';
              const elementKey = `${page?.id || 'page'}-${el.id}`;

              if (isDeleted) {
                return (
                  <div
                    key={elementKey}
                    className="absolute pointer-events-none z-15"
                    style={{
                      left: `${scaledOrigX}px`,
                      top: `${scaledOrigY}px`,
                      width: `${scaledOrigW}px`,
                      height: `${scaledOrigH}px`,
                      backgroundColor: bgColor,
                    }}
                  />
                );
              }

              // Compute bounded font size to ensure edited text strictly matches original document height
              const boxHeightFontSize = Math.max(8, (origH || el.height || 14) * 0.85);
              const targetFontSize = (el.fontSize && el.fontSize <= (origH || el.height) * 1.1)
                ? el.fontSize
                : boxHeightFontSize;
              const scaledFontSize = Math.max(8, targetFontSize * effectiveScale);

              const textColor = el.color || '#000000';
              const normalizedFontWeight = typeof el.fontWeight === 'number'
                ? el.fontWeight
                : (el.fontWeight === 'bold' || el.fontWeight === '700' ? 700 : 400);

              return (
                <React.Fragment key={elementKey}>
                  {/* LOCALIZED RESTORATION PATCH AT OLD LOCATION ONLY FOR ACTUALLY EDITED ELEMENTS */}
                  {isEdited && !el.isNew && (
                    <div
                      className="absolute pointer-events-none z-15"
                      style={{
                        left: `${scaledOrigX}px`,
                        top: `${scaledOrigY}px`,
                        width: `${scaledOrigW}px`,
                        height: `${scaledOrigH}px`,
                        backgroundColor: bgColor,
                      }}
                    />
                  )}

                  {isEdited ? (
                    /* FINAL EDITED REPLACEMENT TEXT SURFACE (Rendered only when element is actually edited) */
                    <div
                      onMouseDown={(e) => handleMouseDownElement(e, el)}
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute pointer-events-auto cursor-move flex items-baseline px-0 transition-all ${
                        isSelected ? 'z-30' : 'z-20 hover:border-indigo-400'
                      }`}
                      style={{
                        left: `${scaledX}px`,
                        top: `${scaledY}px`,
                        width: `${scaledW}px`,
                        height: `${scaledH}px`,
                        fontSize: `${scaledFontSize}px`,
                        color: textColor,
                        fontFamily: el.fontFamily || 'Inter, Arial, sans-serif',
                        fontWeight: normalizedFontWeight,
                        fontStyle: el.fontStyle || 'normal',
                        lineHeight: 1.0,
                        border: isSelected ? '2px solid #6366f1' : '1px solid transparent',
                        backgroundColor: 'transparent',
                        boxShadow: isSelected ? '0 0 0 2px rgba(99, 102, 241, 0.3)' : 'none',
                        overflow: 'visible',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        textRendering: 'optimizeLegibility',
                      }}
                      title={el.text}
                    >
                      <span className="select-none inline-block whitespace-nowrap overflow-visible leading-none">{el.text || ''}</span>

                      {isSelected && (
                        <>
                          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-white pointer-events-none" />
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-white pointer-events-none" />
                          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-white pointer-events-none" />
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-white pointer-events-none" />
                        </>
                      )}
                    </div>
                  ) : (
                    /* UNTOUCHED OCR ELEMENT — Red Dashed OCR Box Hitbox (Clean Original Raster Image Visible) */
                    <div
                      onMouseDown={(e) => handleMouseDownElement(e, el)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute pointer-events-auto cursor-pointer transition-all z-10"
                      style={{
                        left: `${scaledX}px`,
                        top: `${scaledY}px`,
                        width: `${scaledW}px`,
                        height: `${scaledH}px`,
                        backgroundColor: 'transparent',
                        border: isSelected ? '2px solid #6366f1' : '1px dashed rgba(239, 68, 68, 0.75)',
                        boxShadow: isSelected ? '0 0 0 2px rgba(99, 102, 241, 0.3)' : 'none',
                      }}
                      title={el.text}
                    >
                      {isSelected && (
                        <>
                          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-white pointer-events-none" />
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-white pointer-events-none" />
                          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-white pointer-events-none" />
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-white pointer-events-none" />
                        </>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-slate-400 font-mono text-xs">No document image available</div>
      )}
    </div>
  );
}
