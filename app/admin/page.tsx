"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Gallery } from '@/components/Gallery';
import Lightbox from './Lightbox';
import SearchFilterBar from '@/components/admin/SearchFilterBar';
import AdminSidebar from '@/components/admin/AdminSidebar';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Latent Library';

export default function AdminPage() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<string>('created_at.desc');
  const [thumbSize, setThumbSize] = useState<'XL' | 'L' | 'M' | 'S' | 'XS'>('L');
  const [selected, setSelected] = useState<import('@/components/ImageCard').ImageRow | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [items, setItems] = useState<import('@/components/ImageCard').ImageRow[]>([]);
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

  const query = useMemo(
    () => ({ q, sort }),
    [q, sort],
  );

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
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-30 bg-white border-b">
        <div className="px-4">
          <header className="flex items-center justify-between gap-2 pt-2">
            <div className="text-xl font-semibold">{appName}</div>
          </header>

          <SearchFilterBar
            q={q}
            onChangeQ={setQ}
            size={thumbSize}
            onChangeSize={setThumbSize}
            sort={sort as any}
            onChangeSort={setSort as any}
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


