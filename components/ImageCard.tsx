"use client";

import { LazyImage } from './LazyImage';
import SaveButton from '@/components/admin/SaveButton';
import { useEffect, useState } from 'react';

function formatBytes(num?: number | null): string {
  if (!num || num <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  const val = num / Math.pow(1024, i);
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

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
  liked?: boolean | null;
};

export function ImageCard({ item, onSelect }: { item: ImageRow; onSelect?: (item: ImageRow) => void }) {
  const filename = item.s3_key?.split('/').pop() || item.s3_key;
  const dims = item.width && item.height ? `${item.width}×${item.height}` : '';
  const [liked, setLiked] = useState<boolean>(!!item.liked);
  useEffect(() => {
    setLiked(!!item.liked);
  }, [item.id, item.liked]);

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
    <div className="group overflow-hidden rounded-md bg-card/50 shadow-sm hover:shadow-md transition">
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
        onClick={onSelect ? () => onSelect(item) : undefined}
        className="block w-full text-left"
      >
        <div
          className="cursor-pointer  relative w-full overflow-hidden rounded-md bg-muted"
          style={{ aspectRatio: item.width && item.height ? `${item.width}/${item.height}` : undefined }}
        >
          {item.signedUrl ? (
            <LazyImage src={item.signedUrl} alt={filename} className="w-full h-full" fit="cover" />
          ) : (
            <div className="text-xs text-muted-foreground">missing</div>
          )}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <SaveButton saved={liked} onToggle={toggleLike} imageId={item.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageCard;


