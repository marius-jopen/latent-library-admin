"use client";

import { LazyImage } from './LazyImage';
import SaveButton from '@/components/admin/SaveButton';
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
  const prefetchedUrls = (globalThis as unknown as { __LL_PREFETCHED?: Set<string> }).__LL_PREFETCHED || new Set<string>();
  (globalThis as unknown as { __LL_PREFETCHED?: Set<string> }).__LL_PREFETCHED = prefetchedUrls;
  function prefetchPanel() {
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
      prefetchedUrls.add(url);
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = url;
    } catch {}
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
          onMouseEnter={prefetchPanel}
          onFocus={prefetchPanel}
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
          {thumbSize !== 'XXS' && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <SaveButton saved={liked} onToggle={toggleLike} imageId={item.id} />
            </div>
          )}
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


