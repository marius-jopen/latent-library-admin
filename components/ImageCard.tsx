"use client";

import { LazyImage } from './LazyImage';

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
};

export function ImageCard({ item, onSelect }: { item: ImageRow; onSelect?: (item: ImageRow) => void }) {
  const filename = item.s3_key?.split('/').pop() || item.s3_key;
  const dims = item.width && item.height ? `${item.width}×${item.height}` : '';

  return (
    <div className="group overflow-hidden rounded-xl bg-card/50 shadow-sm hover:shadow-md transition">
      <button type="button" onClick={onSelect ? () => onSelect(item) : undefined} className="block w-full text-left">
        <div
          className="cursor-pointer  relative w-full overflow-hidden rounded-xl bg-muted"
          style={{ aspectRatio: item.width && item.height ? `${item.width}/${item.height}` : undefined }}
        >
          {item.signedUrl ? (
            <LazyImage src={item.signedUrl} alt={filename} className="w-full h-full" fit="cover" />
          ) : (
            <div className="text-xs text-muted-foreground">missing</div>
          )}
        </div>
      </button>
    </div>
  );
}

export default ImageCard;


