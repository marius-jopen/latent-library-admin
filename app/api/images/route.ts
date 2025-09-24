import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getImageUrl } from '@/lib/s3';

const DEFAULT_PAGE_SIZE = Number(process.env.PAGE_SIZE || '60');
const SIGNED_URL_TTL_SECONDS = Number(process.env.SIGNED_URL_TTL_SECONDS || '900');
const S3_DEFAULT_BUCKET = process.env.S3_DEFAULT_BUCKET || 'latent-library';

type SortParam = `${string}.${'asc' | 'desc'}`;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? undefined;
  const status = url.searchParams.get('status') ?? undefined;
  const format = url.searchParams.get('format') ?? undefined;
  const nsfw = url.searchParams.get('nsfw') ?? undefined; // 'true' | 'false'
  const tags = url.searchParams.get('tags') ?? undefined; // comma-separated tag slugs
  const tagged = url.searchParams.get('tagged') ?? undefined; // 'true' | 'false'
  const limit = Math.min(Number(url.searchParams.get('limit') || DEFAULT_PAGE_SIZE), 200);
  const sortParam = (url.searchParams.get('sort') as SortParam | null) || 'created_at.desc';
  const cursor = url.searchParams.get('cursor') ?? undefined; // created_at or id depending on sort

  const supabase = getSupabaseAdminClient();
  let query = supabase.from('images').select('*', { count: 'exact' });

  // Filters
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
      // Combine with OR between different fields and tokens
      query = query.or([ilikeParts, captionParts, tagsParts, `uid.eq.${q}`].filter(Boolean).join(','));
    }
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (format) {
    query = query.eq('format', format);
  }
  if (nsfw === 'true') {
    query = query.eq('nsfw', true);
  } else if (nsfw === 'false') {
    query = query.eq('nsfw', false);
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

  // Sorting
  const [sortField, direction] = sortParam.split('.') as [string, 'asc' | 'desc'];
  query = query.order(sortField, { ascending: direction === 'asc', nullsFirst: direction === 'asc' });

  // Pagination via cursor
  if (cursor) {
    // We cursor on the sort field primarily. Fallback to id for tie-breaks isn't implemented to keep it simple.
    // Assume cursor is the raw value string; for created_at use ISO string, for id numeric.
    const isAsc = direction === 'asc';
    const op = isAsc ? 'gt' : 'lt';
    query = query[op as 'gt' | 'lt'](sortField, sortField === 'id' ? Number(cursor) : cursor);
  }

  query = query.limit(limit);

  const { data: rows, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type ImageRow = {
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
    liked?: boolean | null;
    caption?: string | null;
    tags?: string[] | null;
    tagged?: boolean | null;
    last_tagged_at?: string | null;
  };

  const items = await Promise.all(
    (rows as ImageRow[] | null | undefined ?? []).map(async (row) => {
      const bucket = row.s3_bucket || S3_DEFAULT_BUCKET;
      const imageUrl = await getImageUrl(bucket, row.s3_key, SIGNED_URL_TTL_SECONDS, true);
      
      // Generate optimized URL for grid view (smaller images)
      const { getOptimizedCdnUrl, getCdnType } = await import('@/lib/cdn');
      const cdnType = getCdnType();
      let optimizedUrl = imageUrl;
      
      if (cdnType === 'bunny') {
        // Use Bunny CDN optimization for grid view
        optimizedUrl = getOptimizedCdnUrl(row.s3_key, {
          width: 400, // Optimized for grid display
          height: 400,
          quality: 80,
          format: 'webp'
        });
      }
      
      return {
        ...row,
        liked: !!(row as Record<string, unknown>).liked,
        signedUrl: optimizedUrl,
      };
    }),
  );

  let nextCursor: string | null = null;
  if (rows && rows.length === limit) {
    const last = (rows as ImageRow[])[rows.length - 1];
    nextCursor = String((last as Record<string, unknown>)[sortField] ?? last.id);
  }

  return NextResponse.json({ items, nextCursor, total: count ?? null });
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as { id: number; liked: boolean };
    if (!body || typeof body.id !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from('images').update({ liked: body.liked } as never).eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}


