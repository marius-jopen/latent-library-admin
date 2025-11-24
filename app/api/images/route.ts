import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getImageUrl } from '@/lib/s3';

const DEFAULT_PAGE_SIZE = Number(process.env.PAGE_SIZE || '48');
const SIGNED_URL_TTL_SECONDS = Number(process.env.SIGNED_URL_TTL_SECONDS || '900');
const S3_DEFAULT_BUCKET = process.env.S3_DEFAULT_BUCKET || 'latent-library';

type SortParam = `${string}.${'asc' | 'desc'}`;

function escapeArrayLiteralToken(token: string): string {
  // Escape for Postgres array literal inside braces with double quotes
  return token.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

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
  const thumbW = Math.max(0, Number(url.searchParams.get('thumb_w') || '0')); // requested thumbnail width (square)

  const supabase = getSupabaseAdminClient();
  // Narrow selection for grid to reduce payload; keep fields needed for sorting and UI
  let query = supabase
    .from('images')
    .select('id,uid,s3_bucket,s3_key,bytes,created_at,width,height,format,nsfw,liked,tagged,last_tagged_at');

  // Filters
  if (q) {
    const isQuoted = q.length >= 2 && q.startsWith('"') && q.endsWith('"');
    if (isQuoted) {
      const exact = q.slice(1, -1).trim();
      if (exact) {
        // Exact match when query is wrapped in quotes
        query = query.or([`uid.eq.${exact}`, `s3_key.eq.${exact}`, `caption.eq.${exact}`].join(','));
      }
    } else {
      // Word-tokenized OR search across filename, caption, and tags
      const tokens = q
        .split(/[\s,]+/)
        .flatMap((t) => t.split('-'))
        .map((t) => t.trim())
        .filter(Boolean);

      if (tokens.length > 0) {
        const ilikeParts = tokens.map((t) => `s3_key.ilike.%${t}%`).join(',');
        const captionParts = tokens.map((t) => `caption.ilike.%${t}%`).join(',');
        const tagsParts = tokens.map((t) => `tags.cs.{"${escapeArrayLiteralToken(t)}"}`).join(',');
        // Combine with OR between different fields and tokens, and allow exact UID lookup
        query = query.or([ilikeParts, captionParts, tagsParts, `uid.eq.${q}`].filter(Boolean).join(','));
      }
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
      let thumbUrl: string | null = null;
      let placeholderUrl: string | null = null;
      
      if (cdnType === 'bunny') {
        // Use Bunny CDN optimization for grid view
        const size = thumbW > 0 ? thumbW : 400; // fallback to previous behavior
        thumbUrl = getOptimizedCdnUrl(row.s3_key, {
          width: size,
          height: size,
          quality: 80,
          format: 'webp'
        });
        // Tiny blurred placeholder (very small, low quality)
        const phSize = Math.max(12, Math.min(40, Math.round(size / 6)));
        placeholderUrl = getOptimizedCdnUrl(row.s3_key, {
          width: phSize,
          height: phSize,
          quality: 20,
          format: 'webp',
          blur: 8,
        });
      }
      
      return {
        ...row,
        liked: !!(row as Record<string, unknown>).liked,
        signedUrl: imageUrl,     // keep full/base CDN URL for detail views
        thumbUrl,                // optimized thumbnail URL for grid
        placeholderUrl,          // tiny blurred preview
      };
    }),
  );

  let nextCursor: string | null = null;
  if (rows && rows.length === limit) {
    const last = (rows as ImageRow[])[rows.length - 1];
    nextCursor = String((last as Record<string, unknown>)[sortField] ?? last.id);
  }

  return NextResponse.json(
    { items, nextCursor, total: count ?? null },
    {
      headers: {
        // Short-lived cache at the edge; safe for list views
        'Cache-Control': 's-maxage=15, stale-while-revalidate=60',
      },
    },
  );
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


