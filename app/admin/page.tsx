"use client";

import { useEffect, useMemo, useRef, useState, use } from 'react';
import { Gallery } from '@/components/Gallery';
import Lightbox from './Lightbox';
import SearchFilterBar from '@/components/admin/SearchFilterBar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import TopNavLinks from '@/components/admin/TopNavLinks';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Latent Library';

export default function AdminPage({ searchParams }: { searchParams?: Promise<{ collectionId?: string }> }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<string>('created_at.desc');
  const [thumbSize, setThumbSize] = useState<'XL' | 'L' | 'M' | 'S' | 'XS'>('M');
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
      // Priority: close lightbox first if open, otherwise close sidebar
      if (isLightboxOpen) {
        setIsLightboxOpen(false);
        return;
      }
      if (showDetail) setShowDetail(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLightboxOpen, showDetail]);

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
    () => ({ q, sort, collectionId: collectionId ?? undefined }),
    [q, sort, collectionId],
  );

  const gridClassName = useMemo(() => {
    // Desired columns at full width
    const fullCols = {
      XL: 2,
      L: 3,
      M: 4,
      S: 5,
      XS: 8,
    }[thumbSize];
    // When the detail sidebar opens (~50% width), keep the same item size by halving columns
    const cols = showDetail
      ? (
          thumbSize === 'XL' ? 1 :
          thumbSize === 'L' ? 2 :
          thumbSize === 'M' ? 2 :
          thumbSize === 'S' ? 3 :
          /* XS */ 4
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

          <SearchFilterBar
            q={q}
            onChangeQ={setQ}
            size={thumbSize}
            onChangeSize={setThumbSize}
            sort={sort as any}
            onChangeSort={setSort as any}
            collectionId={collectionId}
            onChangeCollectionId={setCollectionId}
          />
        </div>
      </div>
      <div style={{ height: headerHeight }} />



      <div className={`lg:grid gap-0 transition-[grid-template-columns] duration-300 ${showDetail ? 'lg:grid-cols-[1fr_min(50vw,760px)]' : 'lg:grid-cols-[1fr_0]'}`}>
        <div>
          <Gallery
            query={query}
            onSelect={(it, idx, list) => { setItems(list); setSelected(it); setSelectedIndex(idx); setShowDetail(true); }}
            gridClassName={gridClassName}
            removedIds={removedIds}
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
    </div>
  );
}


