"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import ImageCard, { type ImageRow } from './ImageCard';
import { Skeleton } from '@/components/ui/skeleton';

type QueryState = {
  q?: string;
  status?: string;
  format?: string;
  nsfw?: 'true' | 'false' | '';
  sort?: string; // created_at.desc
};

async function fetchPage(params: QueryState & { cursor?: string }) {
  const url = new URL('/api/images', window.location.origin);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v as string);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch images');
  return (await res.json()) as { items: ImageRow[]; nextCursor: string | null; total: number | null };
}

export function Gallery({ query, onSelect, gridClassName }: { query: QueryState; onSelect?: (item: ImageRow) => void; gridClassName?: string }) {
  const [items, setItems] = useState<ImageRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [total, setTotal] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const stableQuery = useMemo(() => JSON.stringify(query), [query]);

  useEffect(() => {
    let ignore = false;
    async function loadFirst() {
      setLoading(true);
      try {
        const data = await fetchPage(JSON.parse(stableQuery));
        if (ignore) return;
        setItems(data.items);
        setNextCursor(data.nextCursor);
        setTotal(data.total);
        setInitialized(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    setItems([]);
    setNextCursor(null);
    setTotal(null);
    setInitialized(false);
    loadFirst();
    return () => {
      ignore = true;
    };
  }, [stableQuery]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !loading && nextCursor) {
        setLoading(true);
        fetchPage({ ...(JSON.parse(stableQuery) as QueryState), cursor: nextCursor })
          .then((data) => {
            setItems((prev) => prev.concat(data.items));
            setNextCursor(data.nextCursor);
            if (data.total != null) setTotal(data.total);
          })
          .finally(() => setLoading(false));
      }
    }, { rootMargin: '400px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [nextCursor, loading, stableQuery]);

  const loadedCount = items.length;

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        {total != null ? `Loaded ${loadedCount} of ${total}` : `Loaded ${loadedCount}`}
      </div>
      <div className={gridClassName || "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3"}>
        {items.map((item) => (
          <div key={item.id} className="break-inside-avoid mb-3">
            <ImageCard item={item} onSelect={onSelect} />
          </div>
        ))}
        {loading && !initialized
          ? Array.from({ length: 12 }).map((_, i) => (
              <div className="space-y-2 break-inside-avoid" key={`sk-${i}`}>
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          : null}
      </div>
      <div ref={sentinelRef} />
      {initialized && !loading && items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No results</div>
      ) : null}
    </div>
  );
}

export default Gallery;


