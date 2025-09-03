"use client";

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
}) {
  return (
    <aside className={`hidden lg:block transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className="h-[calc(100dvh-0rem)] sticky top-[88px] overflow-auto">
        {selected ? (
          <div className="relative">
            <ImageDetailPanel
              item={selected}
              onOpenModal={onOpenModal}
              onClose={onClose}
              onNavigate={onNavigate}
              currentCollectionId={currentCollectionId}
              onRemovedFromCollection={onRemovedFromCollection}
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


