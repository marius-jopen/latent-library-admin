"use client";

import ImageDetailPanel from '@/components/ImageDetailPanel';

export function AdminSidebar({
  show,
  selected,
  items,
  selectedIndex,
  onClose,
  onNavigate,
}: {
  show: boolean;
  selected: import('@/components/ImageCard').ImageRow | null;
  items: import('@/components/ImageCard').ImageRow[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}) {
  return (
    <aside className={`hidden lg:block transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className="h-[calc(100dvh-10rem)] sticky top-[7.5rem] overflow-auto">
        {selected ? (
          <div className="relative">
            <button className="flex  w-full justify-end text-sm text-muted-foreground " onClick={onClose}>
              Hide
            </button>
            <ImageDetailPanel
              item={selected}
            />
            {show ? (
              <div className="opacity-50 absolute left-2 top-0 flex items-center gap-0">
                <button
                  className="h-7 w-7 rounded-full bg-background/80 backdrop-blur  text-sm"
                  onClick={() => onNavigate('prev')}
                  aria-label="Previous"
                >
                  ←
                </button>
                <button
                  className="h-7 w-7 rounded-full bg-background/80 backdrop-blur  text-sm"
                  onClick={() => onNavigate('next')}
                  aria-label="Next"
                >
                  →
                </button>
              </div>
            ) : null}
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


