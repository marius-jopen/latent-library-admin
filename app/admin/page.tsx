"use client";

import { useEffect, useMemo, useRef, useState, use } from 'react';
import { Gallery } from '@/components/Gallery';
import Lightbox from './Lightbox';
import SearchFilterBar from '@/components/admin/SearchFilterBar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import TopNavLinks from '@/components/admin/TopNavLinks';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import { useDebounce } from '@/hooks/useDebounce';
import { ImageRow } from '@/components/ImageCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Latent Library';

export default function AdminPage({ searchParams }: { searchParams?: Promise<{ collectionId?: string }> }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<string>('created_at.desc');
  const [thumbSize, setThumbSize] = useState<'XL' | 'L' | 'M' | 'S' | 'XS' | 'XXS'>('XXS');
  const [selected, setSelected] = useState<import('@/components/ImageCard').ImageRow | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const sp = searchParams ? use(searchParams) : undefined;
  const initialCollectionId = typeof sp?.collectionId === 'string' ? Number(sp.collectionId) : null;
  const [collectionId, setCollectionId] = useState<number | null>(initialCollectionId);
  const [items, setItems] = useState<import('@/components/ImageCard').ImageRow[]>([]);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set());
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [taggedFilter, setTaggedFilter] = useState<'all' | 'tagged' | 'untagged'>('all');
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // Debounce search query for live search (300ms delay)
  const debouncedQ = useDebounce(q, 300);

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
    setShowCheckboxes(false);
  };

  const handleImagesAddedToCollection = (imageIds: number[]) => {
    // Remove selected images from current view if we're in a collection view
    if (collectionId) {
      setItems(prev => prev.filter(item => !imageIds.includes(item.id)));
      setRemovedIds(prev => [...prev, ...imageIds]);
    }
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      
      // Priority 1: Close lightbox if open
      if (isLightboxOpen) {
        setIsLightboxOpen(false);
        return;
      }
      
      // Priority 2: Close sidebar if open
      if (showDetail) {
        setShowDetail(false);
        return;
      }
      
      // Priority 3: Clear selection if any selected in multi-select mode
      if (selectedImageIds.size > 0) {
        setSelectedImageIds(new Set());
        setLastSelectedIndex(null);
        return;
      }

      // Priority 4: Clear search bar if there's text
      if (q) {
        setQ('');
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLightboxOpen, showDetail, q, selectedImageIds]);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ imageId: number }>).detail?.imageId;
      if (!id) return;
      // If viewing Saved collection, remove immediately
      if (collectionId) {
        setRemovedIds((prev) => (prev.includes(id) ? prev : prev.concat(id)));
        setItems((prev) => prev.filter((it) => it.id !== id));
        if (selected?.id === id) {
          setSelected(null);
          setShowDetail(false);
        }
      }
    };
    window.addEventListener('image-unsaved', handler as EventListener);
    return () => window.removeEventListener('image-unsaved', handler as EventListener);
  }, [collectionId, selected]);

  const query = useMemo(
    () => ({
      q: debouncedQ,
      sort,
      collectionId: collectionId ?? undefined,
      tagged: (taggedFilter === 'all' ? undefined : (taggedFilter === 'tagged' ? 'true' as const : 'false' as const)),
    }),
    [debouncedQ, sort, collectionId, taggedFilter],
  );

  const gridClassName = useMemo(() => {
    // Special-case tiny thumbnails so gaps stay tiny even with sidebar open
    if (thumbSize === 'XXS') {
      return showDetail ? 'grid grid-cols-6 gap-0.5' : 'grid grid-cols-16 gap-0.5';
    }
    // Desired columns at full width
    const fullCols = {
      XL: 2,
      L: 3,
      M: 4,
      S: 5,
      XS: 8,
      XXS: 16,
    }[thumbSize];
    // When the detail sidebar opens (~50% width), keep the same item size by halving columns
    const cols = showDetail
      ? (
          thumbSize === 'XL' ? 1 :
          thumbSize === 'L' ? 2 :
          thumbSize === 'M' ? 2 :
          thumbSize === 'S' ? 3 :
          thumbSize === 'XS' ? 4 :
          /* XXS */ 6
        )
      : fullCols;
    // Return a static class from the allowed set to satisfy Tailwind JIT
    const clsMap: Record<number, string> = {
      1: 'grid grid-cols-1 gap-2',
      2: 'grid grid-cols-2 gap-2',
      3: 'grid grid-cols-3 gap-2',
      4: 'grid grid-cols-4 gap-2',
      5: 'grid grid-cols-5 gap-2',
      6: 'grid grid-cols-6 gap-2',
      7: 'grid grid-cols-7 gap-2',
      8: 'grid grid-cols-8 gap-2',
      9: 'grid grid-cols-9 gap-1',
      10: 'grid grid-cols-10 gap-1',
      11: 'grid grid-cols-11 gap-1',
      12: 'grid grid-cols-12 gap-1',
      13: 'grid grid-cols-13 gap-0.5',
      14: 'grid grid-cols-14 gap-0.5',
      15: 'grid grid-cols-15 gap-0.5',
      16: 'grid grid-cols-16 gap-0.5',
    };
    return clsMap[cols] || 'grid grid-cols-4 gap-2';
  }, [thumbSize, showDetail]);

  return (
    <div className="p-4 space-y-4">
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-30 bg-white">
        <div className="px-4">
          <header className="flex items-center justify-between gap-2 pt-2">
            <a href="/admin" className="text-xl font-semibold">{appName}</a>
            <TopNavLinks />
          </header>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SearchFilterBar
                    q={q}
                    onChangeQ={setQ}
                    size={thumbSize}
                    onChangeSize={setThumbSize}
                    sort={sort}
                    onChangeSort={setSort}
                    collectionId={collectionId}
                    onChangeCollectionId={setCollectionId}
                    totalCount={totalCount}
                  />
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowCheckboxes(!showCheckboxes);
                if (showCheckboxes) {
                  setSelectedImageIds(new Set());
                }
              }}
            >
              {showCheckboxes ? 'Exit Select' : 'Select Images'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">More</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter items</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={taggedFilter}
                  onValueChange={(v) => setTaggedFilter(v as 'all' | 'tagged' | 'untagged')}
                >
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="tagged">Tagged only</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="untagged">Untagged only</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {showDetail && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="default" onClick={() => setShowDetail(false)}>
                  Hide
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (selectedIndex == null) return;
                    const prev = selectedIndex > 0 ? selectedIndex - 1 : 0;
                    setSelectedIndex(prev);
                    setSelected(items[prev] ?? selected);
                  }}
                  aria-label="Previous"
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (selectedIndex == null) return;
                    const next = Math.min((items.length - 1), selectedIndex + 1);
                    setSelectedIndex(next);
                    setSelected(items[next] ?? selected);
                  }}
                  aria-label="Next"
                >
                  →
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ height: headerHeight - 30 }} />



      <div className={`lg:grid gap-0 ${showDetail ? 'lg:grid-cols-[1fr_min(50vw,760px)]' : 'lg:grid-cols-[1fr_0]'}`}>
        <div>
          <Gallery
            query={query}
            onSelect={(it, idx, list) => { setItems(list); setSelected(it); setSelectedIndex(idx); setShowDetail(true); }}
            gridClassName={gridClassName}
            removedIds={removedIds}
            selectedImageIds={selectedImageIds}
            onToggleSelect={handleToggleSelect}
            showCheckboxes={showCheckboxes}
            onDragSelection={handleDragSelection}
            thumbSize={thumbSize}
            onShiftClick={handleShiftClick}
            onItemsChange={(list) => setItems(list)}
            onTotalChange={(t) => setTotalCount(t)}
          />
        </div>
        <AdminSidebar
          show={showDetail}
          selected={selected}
          items={items}
          selectedIndex={selectedIndex}
          onClose={() => setShowDetail(false)}
          onNavigate={(dir) => {
            if (selectedIndex == null) return;
            if (dir === 'prev') {
              const prev = selectedIndex > 0 ? selectedIndex - 1 : 0;
              setSelectedIndex(prev);
              setSelected(items[prev] ?? selected);
            } else {
              const next = Math.min((items.length - 1), selectedIndex + 1);
              setSelectedIndex(next);
              setSelected(items[next] ?? selected);
            }
          }}
          onOpenModal={() => setIsLightboxOpen(true)}
          currentCollectionId={collectionId}
          onRemovedFromCollection={(imageId) => {
            // Optimistically remove from current view if filtering by a collection
            if (collectionId) {
              setItems((prev) => prev.filter((it) => it.id !== imageId));
              setRemovedIds((prev) => (prev.includes(imageId) ? prev : prev.concat(imageId)));
              if (selected?.id === imageId) {
                setSelected(null);
                setShowDetail(false);
              }
            }
          }}
          onTagClick={(tag) => setQ(tag)}
        />
      </div>
      {isLightboxOpen && selected?.signedUrl ? (
        <Lightbox
          src={selected.signedUrl}
          alt={selected.s3_key}
          onClose={() => setIsLightboxOpen(false)}
          onPrev={selectedIndex != null && selectedIndex > 0 ? () => {
            const prev = selectedIndex - 1;
            setSelectedIndex(prev);
            setSelected(items[prev] ?? selected);
          } : undefined}
          onNext={selectedIndex != null && selectedIndex < items.length - 1 ? () => {
            const next = selectedIndex + 1;
            setSelectedIndex(next);
            setSelected(items[next] ?? selected);
          } : undefined}
        />
      ) : null}
      
      <BulkActionsBar
        selectedImages={selectedImages}
        onClearSelection={handleClearSelection}
        onImagesAddedToCollection={handleImagesAddedToCollection}
        onImagesRemovedFromCollection={handleImagesRemovedFromCollection}
        currentCollectionId={collectionId}
      />
    </div>
  );
}


