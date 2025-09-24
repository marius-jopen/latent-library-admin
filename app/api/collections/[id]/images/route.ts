import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getImageUrl } from '@/lib/s3';

const SIGNED_URL_TTL_SECONDS = Number(process.env.SIGNED_URL_TTL_SECONDS || '900');
const S3_DEFAULT_BUCKET = process.env.S3_DEFAULT_BUCKET || 'latent-library';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await req.json()) as { imageId?: number };
  if (!id || !body.imageId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('collection_images')
    // @ts-expect-error - typed tables not generated here
    .insert({ collection_id: Number(id), image_id: Number(body.imageId) });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await req.json()) as { imageId?: number };
  if (!body.imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 });
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('collection_images')
    .delete()
    .eq('collection_id', Number(id))
    .eq('image_id', Number(body.imageId));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? undefined;
  const tags = url.searchParams.get('tags') ?? undefined; // comma-separated tag slugs
  const tagged = url.searchParams.get('tagged') ?? undefined; // 'true' | 'false'
  const limit = Math.min(Number(url.searchParams.get('limit') || '60'), 200);
  const sortParam = (url.searchParams.get('sort') as `${string}.${'asc' | 'desc'}` | null) || 'created_at.desc';
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const collectionId = Number(id);
  if (!Number.isFinite(collectionId)) {
    return NextResponse.json({ error: 'Invalid collection id' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const [sortField, direction] = sortParam.split('.') as [string, 'asc' | 'desc'];

  let query = supabase
    .from('images')
    .select('*, collection_images!inner(collection_id)', { count: 'estimated' })
    .eq('collection_images.collection_id', collectionId)
    .order(sortField, { ascending: direction === 'asc', nullsFirst: direction === 'asc' });

  // Apply search filters
  if (q) {
    // Word-tokenized OR search across filename, caption, and tags
    const tokens = q
      .split(/[\s,]+/)
      .flatMap((t) => t.split('-'))
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length > 0) {
      const ilikeParts = tokens.map((t) => `s3_key.ilike.%${t}%`).join(',');
      const captionParts = tokens.map((t) => `caption.ilike.%${t}%`).join(',');
      const tagsParts = tokens.map((t) => `tags.cs.{${t}}`).join(',');
      query = query.or([ilikeParts, captionParts, tagsParts, `uid.eq.${q}`].filter(Boolean).join(','));
    }
  }
  if (tags) {
    // Filter by tags - images must contain ALL specified tags
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagArray.length > 0) {
      query = query.contains('tags', tagArray);
    }
  }
  if (tagged === 'true') {
    query = query.eq('tagged', true);
  } else if (tagged === 'false') {
    query = query.or('tagged.is.false,tagged.is.null');
  }

  if (cursor) {
    const isAsc = direction === 'asc';
    const op = isAsc ? 'gt' : 'lt';
    query = query[op](sortField, sortField === 'id' ? Number(cursor) : cursor);
  }

  query = query.limit(limit);

  const { data: rows, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = await Promise.all((rows ?? []).map(async (row: Record<string, unknown>) => {
    const bucket = (row.s3_bucket as string) || S3_DEFAULT_BUCKET;
    const imageUrl = await getImageUrl(bucket, row.s3_key as string, SIGNED_URL_TTL_SECONDS, true);
    
    // Generate optimized URL for grid view (smaller images)
    const { getOptimizedCdnUrl, getCdnType } = await import('@/lib/cdn');
    const cdnType = getCdnType();
    let optimizedUrl = imageUrl;
    
    if (cdnType === 'bunny') {
      // Use Bunny CDN optimization for grid view
      optimizedUrl = getOptimizedCdnUrl(row.s3_key as string, {
        width: 400, // Optimized for grid display
        height: 400,
        quality: 80,
        format: 'webp'
      });
    }
    
    return { ...row, signedUrl: optimizedUrl };
  }));

  let nextCursor: string | null = null;
  if (rows && rows.length === limit) {
    const last = rows[rows.length - 1] as Record<string, unknown>;
    nextCursor = String(last[sortField] ?? last.id);
  }

  return NextResponse.json({ items, nextCursor, total: count ?? null });
}


