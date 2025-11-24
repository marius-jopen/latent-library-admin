"use client";

import { LazyImage } from './LazyImage';
import ThumbnailActions from '@/components/admin/ThumbnailActions';
import { useEffect, useState } from 'react';

// function formatBytes(num?: number | null): string {
//   if (!num || num <= 0) return '0 B';
//   const units = ['B', 'KB', 'MB', 'GB', 'TB'];
//   const i = Math.floor(Math.log(num) / Math.log(1024));
//   const val = num / Math.pow(1024, i);
//   return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
// }

export type ImageRow = {
  id: number;
  uid: string;
  s3_bucket: string | null;
  s3_key: string;
  bytes: number | null;
  status: string | null;
  created_at: string;
  width: number | null;
  height: number | null;
  format: string | null;
  nsfw: boolean | null;
  metadata: unknown;
  signedUrl: string | null;
  thumbUrl?: string | null;
  placeholderUrl?: string | null;
  liked?: boolean | null;
  caption?: string | null;
  tags?: string[] | null;
  tagged?: boolean | null;
  last_tagged_at?: string | null;
};

export function ImageCard({ item, onSelect, isSelected, onToggleSelect, showCheckbox, thumbSize, onShiftClick, index }: { item: ImageRow; onSelect?: (item: ImageRow) => void; isSelected?: boolean; onToggleSelect?: (item: ImageRow) => void; showCheckbox?: boolean; thumbSize?: 'XL' | 'L' | 'M' | 'S' | 'XS' | 'XXS' | 'XXXS'; onShiftClick?: (item: ImageRow, index: number) => void; index?: number }) {
  const filename = item.s3_key?.split('/').pop() || item.s3_key;
  // const dims = item.width && item.height ? `${item.width}×${item.height}` : '';
  const [liked, setLiked] = useState<boolean>(!!item.liked);
  useEffect(() => {
    setLiked(!!item.liked);
  }, [item.id, item.liked]);

  // Prefetch sidebar-sized image on hover/focus for fast open
  // Lightweight global prefetch cache and rate limiter to avoid overloading the page
  const g = globalThis as unknown as {
    __LL_PREFETCHED?: Set<string>;
    __LL_PREFETCH_INFLIGHT?: number;
    __LL_PREFETCH_LAST_AT?: number;
  };
  const prefetchedUrls = g.__LL_PREFETCHED || new Set<string>();
  g.__LL_PREFETCHED = prefetchedUrls;
  g.__LL_PREFETCH_INFLIGHT = g.__LL_PREFETCH_INFLIGHT || 0;
  g.__LL_PREFETCH_LAST_AT = g.__LL_PREFETCH_LAST_AT || 0;

  const PREFETCH_DELAY_MS = 120; // only prefetch if user hovers briefly
  const PREFETCH_RATE_MS = 350; // at most one prefetch every 350ms
  const PREFETCH_MAX_CONCURRENCY = 2;
  let prefetchTimer: number | null = null;

  function canPrefetchNow(): boolean {
    // Skip on touch devices (hover unreliable)
    if (typeof window !== 'undefined' && 'ontouchstart' in window) return false;
    // Respect Save-Data and very slow networks
    try {
      const conn = (navigator as any).connection as { saveData?: boolean; effectiveType?: string; downlink?: number } | undefined;
      if (conn?.saveData) return false;
      if (conn?.effectiveType && /^(2g)$/i.test(conn.effectiveType)) return false;
      if (typeof conn?.downlink === 'number' && conn.downlink < 0.8) return false;
    } catch {}
    const now = Date.now();
    if ((g.__LL_PREFETCH_INFLIGHT || 0) >= PREFETCH_MAX_CONCURRENCY) return false;
    if (now - (g.__LL_PREFETCH_LAST_AT || 0) < PREFETCH_RATE_MS) return false;
    return true;
  }

  function doPrefetch() {
    if (!item.signedUrl) return;
    try {
      const u = new URL(item.signedUrl);
      if (u.hostname.includes('b-cdn.net')) {
        // Match the exact sizing logic used in ImageDetailPanel to guarantee a cache hit
        const dpr = Math.min(2, Math.max(1, typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1));
        const cssWidth = Math.min(typeof window !== 'undefined' ? window.innerWidth * 0.5 : 800, 760);
        const target = Math.round(Math.min(1600, Math.max(600, cssWidth * dpr)));
        u.searchParams.set('w', String(target));
        u.searchParams.set('q', '80');
        u.searchParams.set('f', 'webp');
      }
      const url = u.toString();
      if (prefetchedUrls.has(url)) return;
      if (!canPrefetchNow()) return;
      prefetchedUrls.add(url);
      g.__LL_PREFETCH_INFLIGHT = (g.__LL_PREFETCH_INFLIGHT || 0) + 1;
      g.__LL_PREFETCH_LAST_AT = Date.now();
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = url;
      const done = () => { g.__LL_PREFETCH_INFLIGHT = Math.max(0, (g.__LL_PREFETCH_INFLIGHT || 1) - 1); };
      img.onload = done;
      img.onerror = done;
    } catch {}
  }

  function schedulePrefetch() {
    if (prefetchTimer) return;
    prefetchTimer = window.setTimeout(() => {
      prefetchTimer = null;
      doPrefetch();
    }, PREFETCH_DELAY_MS);
  }

  function cancelPrefetch() {
    if (prefetchTimer) {
      clearTimeout(prefetchTimer);
      prefetchTimer = null;
    }
  }

  async function toggleLike() {
    setLiked((v) => !v);
    try {
      await fetch('/api/images', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, liked: !liked }),
      });
    } catch {}
  }

  return (
    <div 
      className={`group overflow-hidden rounded-md bg-card/50 shadow-sm hover:shadow-md transition`}
      data-image-card
      data-image-id={item.id}
    >
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!onSelect) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
          }
        }}
        onClick={(e) => {
          if (!showCheckbox) {
            e.stopPropagation();
            if (onSelect) onSelect(item);
          } else {
            // In multi-select mode, handle shift-click for range selection
            if (e.shiftKey && onShiftClick && index !== undefined) {
              e.preventDefault();
              e.stopPropagation();
              onShiftClick(item, index);
            } else if (onToggleSelect) {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelect(item);
            }
          }
        }}
        className="block w-full text-left"
      >
        <div
          className="cursor-pointer relative w-full overflow-hidden rounded-md bg-muted"
          style={{ 
            aspectRatio: '1/1'
          }}
          onMouseEnter={schedulePrefetch}
          onMouseLeave={cancelPrefetch}
          onFocus={schedulePrefetch}
          onBlur={cancelPrefetch}
        >
          {item.signedUrl ? (
            <LazyImage 
              src={item.thumbUrl || item.signedUrl} 
              alt={filename} 
              className="w-full h-full" 
              fit={thumbSize === 'XXS' ? 'cover' : 'cover'} 
              placeholderSrc={item.placeholderUrl || undefined}
            />
          ) : (
            <div className="text-xs text-muted-foreground">missing</div>
          )}
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="pointer-events-auto">
              <ThumbnailActions imageId={item.id} saved={liked} onToggleSaved={toggleLike} />
            </div>
          </div>
          {showCheckbox && (
            <div className="absolute top-2 left-2" data-checkbox>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isSelected || false}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect?.(item);
                  }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full transition-all duration-200 ${
                  isSelected 
                    ? 'bg-green-400' 
                    : 'bg-white border-transparent'
                }`}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImageCard;


