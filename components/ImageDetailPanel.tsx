"use client";

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ImageRow } from './ImageCard';

function formatBytes(num?: number | null): string {
  if (!num || num <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  const val = num / Math.pow(1024, i);
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function ImageDetailPanel({ item }: { item: ImageRow }) {
  const filename = item.s3_key?.split('/').pop() || item.s3_key;
  return (
    <div className="h-full flex flex-col">
      <div className="pl-3 py-3 space-y-3 overflow-auto">
        <div className="overflow-hidden rounded-xl">
          {item.signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.signedUrl} alt={filename} className="w-full h-auto object-contain rounded-xl" />
          ) : (
            <div className="text-sm text-muted-foreground">Signed URL unavailable</div>
          )}
        </div>

        <Card>
          <CardHeader className="p-3 pb-0">
            <div className="font-semibold">Details</div>
          </CardHeader>
          <CardContent className="p-3 text-sm space-y-1">
            <div><span className="text-muted-foreground">Filename:</span> {filename}</div>
            <div className="flex items-center gap-2 flex-wrap">
              {item.format ? <Badge variant="secondary">{item.format}</Badge> : null}
              {item.status ? <Badge variant="outline">{item.status}</Badge> : null}
              {item.nsfw ? <Badge variant="destructive">NSFW</Badge> : null}
            </div>
            <div><span className="text-muted-foreground">UID:</span> {item.uid}</div>
            <div><span className="text-muted-foreground">Bytes:</span> {formatBytes(item.bytes)}</div>
            <div><span className="text-muted-foreground">Dimensions:</span> {item.width && item.height ? `${item.width}×${item.height}` : '—'}</div>
            <div><span className="text-muted-foreground">Format:</span> {item.format || '—'}</div>
            <div><span className="text-muted-foreground">Status:</span> {item.status || '—'}</div>
            <div><span className="text-muted-foreground">NSFW:</span> {item.nsfw ? 'true' : 'false'}</div>
            <div><span className="text-muted-foreground">Created:</span> {item.created_at}</div>
            <div className="pt-2">
              <div className="text-muted-foreground mb-1">S3</div>
              <div className="text-xs break-all">
                <div>Bucket: {item.s3_bucket || '—'}</div>
                <div>Key: {item.s3_key}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ImageDetailPanel;


