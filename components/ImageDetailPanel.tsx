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

export function ImageDetailPanel({ item, onOpenModal }: { item: ImageRow; onOpenModal?: () => void }) {
  const filename = item.s3_key?.split('/').pop() || item.s3_key;
  return (
    <div className="h-full flex flex-col">
      <div className="pl-3 py-3 space-y-3 overflow-auto">
        <div className="overflow-hidden rounded-xl cursor-zoom-in" onClick={onOpenModal}>
          {item.signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.signedUrl} alt={filename} className="w-full h-auto object-contain rounded-xl" />
          ) : (
            <div className="text-sm text-muted-foreground">Signed URL unavailable</div>
          )}
        </div>

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


