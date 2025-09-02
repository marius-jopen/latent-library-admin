"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import ImageCard, { type ImageRow } from './ImageCard';
import { Skeleton } from '@/components/ui/skeleton';

type QueryState = {
  q?: string;
  sort?: string; // created_at.desc
  collectionId?: number;
};

async function fetchPage(params: QueryState & { cursor?: string }) {
  const basePath = params.collectionId != null ? `/api/collections/${params.collectionId}/images` : '/api/images';
  const url = new URL(basePath, window.location.origin);
  // Only forward known string query params; path already encodes collectionId
  const allowedKeys: Array<keyof (QueryState & { cursor?: string })> = ['q', 'sort', 'cursor'];
  for (const key of allowedKeys) {
    const value = params[key];
    if (typeof value === 'string' && value) {
      url.searchParams.set(key, value);
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    let message = `Failed to fetch images (${res.status} ${res.statusText})`;
    try {
      const data = await res.clone().json();
      if (data && typeof data.error === 'string') message = data.error;
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {}
    }
    throw new Error(message);
  }
  return (await res.json()) as { items: ImageRow[]; nextCursor: string | null; total: number | null };
}

export function Gallery({ query, onSelect, gridClassName, removedIds }: { query: QueryState; onSelect?: (item: ImageRow, index: number, list: ImageRow[]) => void; gridClassName?: string; removedIds?: number[] }) {
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

  // Remove any items that were removed externally (e.g., from a collection) immediately
  useEffect(() => {
    if (!removedIds || removedIds.length === 0) return;
    setItems((prev) => prev.filter((it) => !removedIds.includes(it.id)));
  }, [removedIds]);

  const loadedCount = items.length;

  return (
    <div className="space-y-3">
      {/* <div className="text-sm text-muted-foreground">
        {total != null ? `Loaded ${loadedCount} of ${total}` : `Loaded ${loadedCount}`}
      </div> */}
      <div className={gridClassName || "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"}>
        {items.map((item, idx) => (
          <div key={item.id}>
            <ImageCard item={item} onSelect={onSelect ? () => onSelect(item, idx, items) : undefined} />
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


