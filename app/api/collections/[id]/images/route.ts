import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getSignedUrlForKey } from '@/lib/s3';

const SIGNED_URL_TTL_SECONDS = Number(process.env.SIGNED_URL_TTL_SECONDS || '900');
const S3_DEFAULT_BUCKET = process.env.S3_DEFAULT_BUCKET || 'latent-library';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = (await req.json()) as { imageId?: number };
  if (!id || !body.imageId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('collection_images')
    // @ts-ignore - typed tables not generated here
    .insert({ collection_id: Number(id), image_id: Number(body.imageId) } as any);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || '60'), 200);
  const sortParam = (url.searchParams.get('sort') as `${string}.${'asc' | 'desc'}` | null) || 'created_at.desc';
  const cursor = url.searchParams.get('cursor') ?? undefined;

  const supabase = getSupabaseAdminClient();
  const [sortField, direction] = sortParam.split('.') as [string, 'asc' | 'desc'];

  let query = supabase
    .from('images')
    .select('*, collection_images!inner(collection_id)', { count: 'exact' })
    .eq('collection_images.collection_id', Number(id))
    .order(sortField, { ascending: direction === 'asc', nullsFirst: direction === 'asc' });

  if (cursor) {
    const isAsc = direction === 'asc';
    const op = isAsc ? 'gt' : 'lt';
    // @ts-ignore dynamic operator
    query = query[op](sortField, sortField === 'id' ? Number(cursor) : cursor);
  }

  query = query.limit(limit);

  const { data: rows, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = await Promise.all((rows ?? []).map(async (row: any) => {
    const bucket = row.s3_bucket || S3_DEFAULT_BUCKET;
    const signedUrl = await getSignedUrlForKey(bucket, row.s3_key, SIGNED_URL_TTL_SECONDS);
    return { ...row, signedUrl };
  }));

  let nextCursor: string | null = null;
  if (rows && rows.length === limit) {
    const last = rows[rows.length - 1] as any;
    nextCursor = String(last[sortField] ?? last.id);
  }

  return NextResponse.json({ items, nextCursor, total: count ?? null });
}


