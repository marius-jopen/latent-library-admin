"use client";

import { useEffect, useRef } from 'react';
import ImageDetailPanel from '@/components/ImageDetailPanel';

export function AdminSidebar({
  show,
  selected,
  items,
  selectedIndex,
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

  // Keep sidebar scroll isolated to avoid visual gaps below it

  return (
    <aside className={`hidden lg:block ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div
        ref={sidebarRef}
        className={`overflow-auto ${show ? 'fixed' : 'sticky'} right-0 top-[88px] h-[calc(100dvh-88px)] w-[min(50vw,760px)]`}
      >
        {selected ? (
          <div className="relative">
            <ImageDetailPanel
              item={selected}
              prevItem={selectedIndex != null && selectedIndex > 0 ? items[selectedIndex - 1] : undefined}
              nextItem={selectedIndex != null && selectedIndex < items.length - 1 ? items[selectedIndex + 1] : undefined}
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


