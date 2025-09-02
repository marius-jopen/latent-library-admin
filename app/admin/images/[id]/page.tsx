import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getSignedUrlForKey } from '@/lib/s3';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SIGNED_URL_TTL_SECONDS = Number(process.env.SIGNED_URL_TTL_SECONDS || '900');
const S3_DEFAULT_BUCKET = process.env.S3_DEFAULT_BUCKET || 'latent-library';

function formatBytes(num?: number | null): string {
  if (!num || num <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  const val = num / Math.pow(1024, i);
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default async function ImageDetailPage({ params }: { params: { id: string } }) {
  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) notFound();

  const supabase = getSupabaseAdminClient();
  const { data: row, error } = await supabase
    .from('images')
    .select('*')
    .eq('id', idNum)
    .single();

  if (error || !row) notFound();

  const bucket = row.s3_bucket || S3_DEFAULT_BUCKET;
  const signedUrl = await getSignedUrlForKey(bucket, row.s3_key, SIGNED_URL_TTL_SECONDS);
  const filename = row.s3_key?.split('/').pop() || row.s3_key;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:underline">← Back</Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">Image #{row.id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="p-3 pb-0">
            <div className="flex items-center gap-2 flex-wrap">
              {row.format ? <Badge variant="secondary">{row.format}</Badge> : null}
              {row.status ? <Badge variant="outline">{row.status}</Badge> : null}
              {row.nsfw ? <Badge variant="destructive">NSFW</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="bg-muted flex items-center justify-center max-h-[80vh]">
              {signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signedUrl} alt={filename} className="max-h-[80vh] w-auto object-contain" />
              ) : (
                <div className="text-sm text-muted-foreground">Signed URL unavailable</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-0">
            <div className="font-semibold">Details</div>
          </CardHeader>
          <CardContent className="p-3 text-sm space-y-1">
            <div><span className="text-muted-foreground">Filename:</span> {filename}</div>
            <div><span className="text-muted-foreground">UID:</span> {row.uid}</div>
            <div><span className="text-muted-foreground">Bucket:</span> {bucket}</div>
            <div><span className="text-muted-foreground">Key:</span> {row.s3_key}</div>
            <div><span className="text-muted-foreground">Bytes:</span> {formatBytes(row.bytes)}</div>
            <div><span className="text-muted-foreground">Dimensions:</span> {row.width && row.height ? `${row.width}×${row.height}` : '—'}</div>
            <div><span className="text-muted-foreground">Format:</span> {row.format || '—'}</div>
            <div><span className="text-muted-foreground">Status:</span> {row.status || '—'}</div>
            <div><span className="text-muted-foreground">NSFW:</span> {row.nsfw ? 'true' : 'false'}</div>
            <div><span className="text-muted-foreground">Created:</span> {row.created_at}</div>
            <div className="pt-2">
              <div className="text-muted-foreground mb-1">Metadata:</div>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">{JSON.stringify(row.metadata, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


