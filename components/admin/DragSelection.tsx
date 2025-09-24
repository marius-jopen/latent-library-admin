"use client";

import { useEffect, useRef, useState } from 'react';

interface DragSelectionProps {
  onSelectionChange: (selectedIds: Set<number>) => void;
  children: React.ReactNode;
  isEnabled: boolean;
  currentSelection: Set<number>;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function DragSelection({ onSelectionChange, children, isEnabled, currentSelection }: DragSelectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseSelectionRef = useRef<Set<number>>(new Set());
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEnabled || e.button !== 0) return; // Only left mouse button
    
    // Check if we're clicking on a checkbox - if so, don't start drag
    const target = e.target as HTMLElement;
    const isCheckbox = target.closest('input[type="checkbox"]') || target.closest('[data-checkbox]');
    
    if (isCheckbox) {
      return; // Don't start drag when clicking on checkboxes
    }

    // Start drag selection when clicking anywhere else (including on images)
    e.preventDefault();
    e.stopPropagation();
    
    // Determine base selection: additive with Shift, otherwise start fresh
    baseSelectionRef.current = e.shiftKey ? new Set(currentSelection) : new Set();
    
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.isDragging || !isEnabled) return;

    const deltaX = Math.abs(e.clientX - dragState.startX);
    const deltaY = Math.abs(e.clientY - dragState.startY);
    const minDragDistance = 5; // Minimum pixels to start drag selection

    // Only start updating selection after minimum drag distance
    if (deltaX < minDragDistance && deltaY < minDragDistance) return;

    setDragState(prev => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY,
    }));

    // Update selection based on current drag area
    updateSelection(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    if (!dragState.isDragging || !isEnabled) return;
    // End drag
    setDragState(prev => ({
      ...prev,
      isDragging: false,
    }));
  };

  const updateSelection = (currentX: number, currentY: number) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const scrollTop = containerRef.current.scrollTop;
    const scrollLeft = containerRef.current.scrollLeft;

    // Calculate selection rectangle
    const left = Math.min(dragState.startX, currentX) - containerRect.left + scrollLeft;
    const top = Math.min(dragState.startY, currentY) - containerRect.top + scrollTop;
    const right = Math.max(dragState.startX, currentX) - containerRect.left + scrollLeft;
    const bottom = Math.max(dragState.startY, currentY) - containerRect.top + scrollTop;

    // Find all image cards within the selection area
    const imageCards = containerRef.current.querySelectorAll('[data-image-card]');
    const dragSelectedIds = new Set<number>();

    imageCards.forEach((card) => {
      const cardElement = card as HTMLElement;
      const cardRect = cardElement.getBoundingClientRect();
      const cardTop = cardRect.top - containerRect.top + scrollTop;
      const cardLeft = cardRect.left - containerRect.left + scrollLeft;
      const cardBottom = cardTop + cardRect.height;
      const cardRight = cardLeft + cardRect.width;

      // Check if card intersects with selection rectangle
      if (
        cardLeft < right &&
        cardRight > left &&
        cardTop < bottom &&
        cardBottom > top
      ) {
        const imageId = cardElement.getAttribute('data-image-id');
        if (imageId) {
          dragSelectedIds.add(parseInt(imageId, 10));
        }
      }
    });

    // Combine base selection (if Shift was held) with current drag area
    const combined = new Set<number>(baseSelectionRef.current);
    dragSelectedIds.forEach((id) => combined.add(id));
    onSelectionChange(combined);
  };

  useEffect(() => {
    if (!isEnabled) return;

    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState.isDragging, isEnabled]);

  const selectionStyle = dragState.isDragging ? {
    position: 'absolute' as const,
    left: Math.min(dragState.startX, dragState.currentX) - (containerRef.current?.getBoundingClientRect().left || 0),
    top: Math.min(dragState.startY, dragState.currentY) - (containerRef.current?.getBoundingClientRect().top || 0),
    width: Math.abs(dragState.currentX - dragState.startX),
    height: Math.abs(dragState.currentY - dragState.startY),
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    border: '2px solid rgba(59, 130, 246, 0.6)',
    borderRadius: '4px',
    pointerEvents: 'none' as const,
    zIndex: 10,
    boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.2)',
  } : {};

  return (
    <div
      ref={containerRef}
      className={`relative min-h-[200px] ${isEnabled ? 'bg-blue-50/30' : ''} -mx-[9999px] px-[9999px]`}
      onMouseDown={handleMouseDown}
      style={{ userSelect: 'none', cursor: dragState.isDragging ? 'crosshair' : (isEnabled ? 'crosshair' : 'default') }}
    >
      {isEnabled && !dragState.isDragging && (
        <div className="absolute inset-0 -mx-[9999px] pointer-events-none">
          <div className="absolute top-2 left-2 text-xs text-blue-600 bg-white px-2 py-1 rounded shadow-sm border border-blue-200">
            Click and drag to select images
          </div>
        </div>
      )}
      {children}
      {dragState.isDragging && (
        <div style={selectionStyle} />
      )}
    </div>
  );
}

export default DragSelection;
