"use client";

import { useMemo, useRef, useEffect, useState, use } from 'react';
import { Gallery } from '@/components/Gallery';
import TopNavLinks from '@/components/admin/TopNavLinks';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Latent Library';

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const collectionId = Number(id);
  const [sort, setSort] = useState<string>('created_at.desc');
  const [thumbSize, setThumbSize] = useState<'XL' | 'L' | 'M' | 'S' | 'XS'>('L');
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(0);

  const query = useMemo(() => ({ sort, collectionId }), [sort, collectionId]);

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
            <TopNavLinks />
          </header>
        </div>
      </div>
      <div style={{ height: headerHeight }} />

      <Gallery query={query as any} gridClassName={gridClassName} />
    </div>
  );
}


