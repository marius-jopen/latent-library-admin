"use client";

import { useMemo, useRef, useEffect, useState, use } from 'react';
import { Gallery } from '@/components/Gallery';
import TopNavLinks from '@/components/admin/TopNavLinks';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import { ImageRow } from '@/components/ImageCard';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Latent Library';

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const collectionId = Number(id);
  const [sort] = useState<string>('created_at.desc');
  const [thumbSize] = useState<'XL' | 'L' | 'M' | 'S' | 'XS' | 'XXS'>('XXS');
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set());
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [items, setItems] = useState<ImageRow[]>([]);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const query = useMemo(() => ({ sort, collectionId }), [sort, collectionId]);

  // Multi-select handlers
  const handleToggleSelect = (item: ImageRow) => {
    const itemIndex = items.findIndex(img => img.id === item.id);
    setLastSelectedIndex(itemIndex);
    
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) {
        newSet.delete(item.id);
      } else {
        newSet.add(item.id);
      }
      return newSet;
    });
  };

  const handleShiftClick = (item: ImageRow, index: number) => {
    if (lastSelectedIndex === null) {
      // If no previous selection, just select this item
      handleToggleSelect(item);
      return;
    }

    // Select range from lastSelectedIndex to current index
    const startIndex = Math.min(lastSelectedIndex, index);
    const endIndex = Math.max(lastSelectedIndex, index);
    
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      for (let i = startIndex; i <= endIndex; i++) {
        if (items[i]) {
          newSet.add(items[i].id);
        }
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedImageIds(new Set());
    setLastSelectedIndex(null);
  };

  const handleImagesRemovedFromCollection = (imageIds: number[]) => {
    // Remove selected images from current view
    setItems(prev => prev.filter(item => !imageIds.includes(item.id)));
    setRemovedIds(prev => [...prev, ...imageIds]);
  };

  const handleDragSelection = (selectedIds: Set<number>) => {
    setSelectedImageIds(selectedIds);
  };

  // Get selected images for bulk actions
  const selectedImages = items.filter(item => selectedImageIds.has(item.id));

  useEffect(() => {
    if (!headerRef.current) return;
    const el = headerRef.current;
    const update = () => setHeaderHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const gridClassName = useMemo(() => {
    switch (thumbSize) {
      case 'XL':
        return 'grid grid-cols-2 gap-2';
      case 'L':
        return 'grid grid-cols-4 gap-2';
      case 'M':
        return 'grid grid-cols-6 gap-2';
      case 'S':
        return 'grid grid-cols-8 gap-1';
      case 'XS':
        return 'grid grid-cols-10 gap-1';
      default:
        return 'grid grid-cols-4 gap-2';
    }
  }, [thumbSize]);

  return (
    <div className="p-4 space-y-4">
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-30 bg-white">
        <div className="px-4">
          <header className="flex items-center justify-between gap-2 pt-2">
            <a href="/admin" className="text-xl font-semibold hover:underline">{appName}</a>
            <div className="flex items-center gap-2">
              <TopNavLinks />
              <button
                onClick={() => {
                  setShowCheckboxes(!showCheckboxes);
                  if (showCheckboxes) {
                    setSelectedImageIds(new Set());
                  }
                }}
                className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                  showCheckboxes 
                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {showCheckboxes ? 'Exit Select' : 'Select Images'}
              </button>
            </div>
          </header>
        </div>
      </div>
      <div style={{ height: headerHeight }} />

      <Gallery 
        query={query} 
        gridClassName={gridClassName}
        selectedImageIds={selectedImageIds}
        onToggleSelect={handleToggleSelect}
        showCheckboxes={showCheckboxes}
        removedIds={removedIds}
        onSelect={(item, idx, list) => { setItems(list); }}
        onDragSelection={handleDragSelection}
        thumbSize={thumbSize}
        onShiftClick={handleShiftClick}
      />
      
      <BulkActionsBar
        selectedImages={selectedImages}
        onClearSelection={handleClearSelection}
        onImagesRemovedFromCollection={handleImagesRemovedFromCollection}
        currentCollectionId={collectionId}
      />
    </div>
  );
}


