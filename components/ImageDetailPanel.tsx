"use client";

import { Card, CardContent } from '@/components/ui/card';
import SaveButton from '@/components/admin/SaveButton';
import CollectionPicker from '@/components/admin/CollectionPicker';
import { useEffect, useMemo, useState } from 'react';
import type { ImageRow } from './ImageCard';
import { extractCaptionText } from '@/lib/captionUtils';

function formatBytes(num?: number | null): string {
  if (!num || num <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  const val = num / Math.pow(1024, i);
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function ImageDetailPanel({ item, prevItem, nextItem, onOpenModal, onClose, onNavigate, currentCollectionId, onRemovedFromCollection, onTagClick }: { item: ImageRow; prevItem?: ImageRow; nextItem?: ImageRow; onOpenModal?: () => void; onClose?: () => void; onNavigate?: (direction: 'prev' | 'next') => void; currentCollectionId?: number | null; onRemovedFromCollection?: (imageId: number) => void; onTagClick?: (tag: string) => void }) {
  const filename = item.s3_key?.split('/').pop() || item.s3_key;
  const [liked, setLiked] = useState<boolean>(!!item.liked);
  useEffect(() => {
    setLiked(!!item.liked);
  }, [item.id, item.liked]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onNavigate?.('prev');
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNavigate?.('next');
      }
    };

    // Add event listener when component mounts
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener when component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNavigate]);
  
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
  
  // Build an optimized image URL for the sidebar detail view
  const panelSrc = useMemo(() => {
    if (!item.signedUrl) return null;
    try {
      const u = new URL(item.signedUrl);
      // Only append Bunny params if we're on Bunny CDN
      if (u.hostname.includes('b-cdn.net')) {
        const dpr = Math.min(2, Math.max(1, typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1));
        const cssWidth = Math.min(typeof window !== 'undefined' ? window.innerWidth * 0.5 : 800, 760);
        const target = Math.round(Math.min(1600, Math.max(600, cssWidth * dpr)));
        u.searchParams.set('w', String(target));
        u.searchParams.set('q', '80');
        u.searchParams.set('f', 'webp');
      }
      return u.toString();
    } catch {
      return item.signedUrl;
    }
  }, [item.signedUrl]);

  // Preload neighbor images for snappy navigation in sidebar
  useEffect(() => {
    const neighbors = [prevItem, nextItem].filter(Boolean) as ImageRow[];
    neighbors.forEach((n) => {
      if (!n.signedUrl) return;
      try {
        const u = new URL(n.signedUrl);
        if (u.hostname.includes('b-cdn.net')) {
          const dpr = Math.min(2, Math.max(1, typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1));
          const cssWidth = Math.min(typeof window !== 'undefined' ? window.innerWidth * 0.5 : 800, 760);
          const target = Math.round(Math.min(1600, Math.max(600, cssWidth * dpr)));
          u.searchParams.set('w', String(target));
          u.searchParams.set('q', '80');
          u.searchParams.set('f', 'webp');
        }
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = u.toString();
      } catch {}
    });
  }, [prevItem?.signedUrl, nextItem?.signedUrl]);

  return (
    <div className="h-full flex flex-col">
      <div className="pl-3 pb-3 space-y-3 overflow-x-hidden">
        <div className="overflow-hidden rounded-md cursor-zoom-in" onClick={onOpenModal}>
          {item.signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={panelSrc || item.signedUrl} alt={filename} loading="eager" decoding="async" className="w-full h-auto object-contain rounded-md shadow-sm" />
          ) : (
            <div className="text-sm text-muted-foreground">Signed URL unavailable</div>
          )}
        </div>

        <Card>
          <CardContent className="px-3 pt-3 pb-5">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <SaveButton saved={liked} onToggle={toggleLike} imageId={item.id} />
                <CollectionPicker imageId={item.id} currentCollectionId={currentCollectionId ?? undefined} onRemoved={onRemovedFromCollection} saved={liked} />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 opacity-0 animate-[slidein_250ms_ease-out_forwards]">
                  <style jsx>{`
                    @keyframes slidein {
                      from { transform: translateX(1.5rem); opacity: 0; }
                      to { transform: translateX(0); opacity: 1; }
                    }
                  `}</style>
                  <button
                    className="h-8 px-3 rounded-full bg-background/80 border text-sm"
                    onClick={onClose}
                    aria-label="Hide"
                  >
                    Hide
                  </button>
                  <button
                    className="h-8 w-8 rounded-full bg-background/80 border text-sm"
                    onClick={() => onNavigate?.('prev')}
                    aria-label="Previous"
                  >
                    ←
                  </button>
                  <button
                    className="h-8 w-8 rounded-full bg-background/80 border text-sm"
                    onClick={() => onNavigate?.('next')}
                    aria-label="Next"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {item.caption && (
          <Card>
            <CardContent className="px-3 py-3">
              <div className="text-sm">
                <div className="font-semibold text-xs text-muted-foreground mb-2">Caption</div>
                <div className="text-sm leading-relaxed">
                  {extractCaptionText(item.caption || '')
                    .replace(/^\{'<MORE_DETAILED_CAPTION>': "/, '')
                    .replace(/"\}$/, '')}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {item.tags && item.tags.length > 0 && (
          <Card>
            <CardContent className="px-3 py-3">
              <div className="text-sm">
                <div className="font-semibold text-xs text-muted-foreground mb-2">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => onTagClick?.(tag)}
                      className="inline-block px-2 py-1 text-xs bg-muted rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          {/* <CardHeader className="px-3 py-1">
            <div className="font-semibold text-xs">Details</div>
          </CardHeader> */}
          <CardContent className="px-3 pb-2">
            <div className="text-xs">
              {[
                { label: 'Filename', value: filename, breakAll: true },
                { label: 'UID', value: item.uid, breakAll: true },
                { label: 'Bytes', value: formatBytes(item.bytes) },
                { label: 'Dimensions', value: item.width && item.height ? `${item.width}×${item.height}` : '—' },
                { label: 'Format', value: item.format || '—' },
                { label: 'Status', value: item.status || '—' },
                { label: 'NSFW', value: item.nsfw ? 'true' : 'false' },
                { label: 'Tagged', value: item.tagged ? 'true' : 'false' },
                { label: 'Last Tagged', value: item.last_tagged_at || '—' },
                { label: 'Created', value: item.created_at },
                { label: 'Bucket', value: item.s3_bucket || '—' },
                { label: 'Key', value: item.s3_key, breakAll: true },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-[110px_1fr] gap-x-3 py-1.5 border-t first:border-t-0">
                  <div className="text-muted-foreground">{row.label}</div>
                  <div className={row.breakAll ? 'break-all' : ''}>{row.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ImageDetailPanel;


