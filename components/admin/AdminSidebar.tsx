"use client";

import { useEffect, useRef } from 'react';
import ImageDetailPanel from '@/components/ImageDetailPanel';

export function AdminSidebar({
  show,
  selected,
  // items,
  // selectedIndex,
  onClose,
  onNavigate,
  onOpenModal,
  currentCollectionId,
  onRemovedFromCollection,
  onTagClick,
}: {
  show: boolean;
  selected: import('@/components/ImageCard').ImageRow | null;
  items: import('@/components/ImageCard').ImageRow[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onOpenModal: () => void;
  currentCollectionId?: number | null;
  onRemovedFromCollection?: (imageId: number) => void;
  onTagClick?: (tag: string) => void;
}) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Scroll to top when a new item is selected
  useEffect(() => {
    if (selected && sidebarRef.current) {
      sidebarRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selected?.id]); // Only trigger when the selected item changes

  return (
    <aside className={`hidden lg:block transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div ref={sidebarRef} className="h-[calc(100dvh-0rem)] sticky top-[88px] overflow-auto">
        {selected ? (
          <div className="relative">
            <ImageDetailPanel
              item={selected}
              onOpenModal={onOpenModal}
              onClose={onClose}
              onNavigate={onNavigate}
              currentCollectionId={currentCollectionId}
              onRemovedFromCollection={onRemovedFromCollection}
              onTagClick={onTagClick}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Select an image
          </div>
        )}
      </div>
    </aside>
  );
}

export default AdminSidebar;


