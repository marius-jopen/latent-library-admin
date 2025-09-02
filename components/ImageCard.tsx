"use client";

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

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

export function ImageCard({ item }: { item: ImageRow }) {
  const filename = item.s3_key?.split('/').pop() || item.s3_key;
  const dims = item.width && item.height ? `${item.width}×${item.height}` : '';
  const createdRel = item.created_at
    ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
    : '';

  return (
    <Card className="overflow-hidden">
      <Link href={`/admin/images/${item.id}`} prefetch={false} className="block">
        <div className="aspect-square bg-muted flex items-center justify-center">
          {item.signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.signedUrl}
              alt={filename}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="text-xs text-muted-foreground">missing</div>
          )}
        </div>
      </Link>
      <CardHeader className="p-3 pb-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {item.format ? <Badge variant="secondary">{item.format}</Badge> : null}
          {item.status ? <Badge variant="outline">{item.status}</Badge> : null}
          {item.nsfw ? <Badge variant="destructive">NSFW</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="p-3 text-sm">
        <div className="truncate font-medium" title={filename}>{filename}</div>
        <div className="text-muted-foreground flex flex-wrap gap-x-2">
          {dims && <span>{dims}</span>}
          {item.bytes != null && <span>{formatBytes(item.bytes)}</span>}
          {createdRel && <span>{createdRel}</span>}
        </div>
        <div className="mt-2 flex gap-2">
          <button className="text-xs text-muted-foreground cursor-not-allowed" disabled>
            Toggle Public
          </button>
          <button className="text-xs text-muted-foreground cursor-not-allowed" disabled>
            Tag (AI)
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ImageCard;


