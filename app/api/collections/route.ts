import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getSupabaseAdminClient();
  // Fetch collections with up to 4 preview image signed URLs
  const { data: cols, error } = await supabase
    .from('collections')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // For simplicity, fetch previews by joining collection_images → images; signed URLs are handled client-side today.
  // To avoid S3 calls here, we just return the image rows needed for previews.
  const collectionIds = (cols ?? []).map((c) => c.id);
  if (!collectionIds.length) return NextResponse.json(cols ?? []);

  const { data: previews, error: pErr } = await supabase
    .from('collection_images')
    .select('collection_id, images(id, s3_bucket, s3_key)')
    .in('collection_id', collectionIds)
    .limit(4, { foreignTable: 'images' });
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const map = new Map<number, Array<{ id: number; s3_bucket: string | null; s3_key: string }>>();
  (previews ?? []).forEach((row: Record<string, unknown>) => {
    const arr = map.get(row.collection_id) || [];
    if (row.images) arr.push(row.images);
    map.set(row.collection_id, arr);
  });

  let withPreviews = (cols ?? []).map((c) => ({
    ...c,
    previews: map.get(c.id) || [],
  }));
  // Ensure "Saved" appears first
  withPreviews = withPreviews.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aP = String(a.name).toLowerCase() === 'saved' ? 0 : 1;
    const bP = String(b.name).toLowerCase() === 'saved' ? 0 : 1;
    if (aP !== bP) return aP - bP;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return NextResponse.json(withPreviews);
}

export async function POST(req: Request) {
  const body = (await req.json()) as { name?: string; description?: string | null };
  if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('collections')
    .insert({ name: body.name.trim(), description: body.description ?? null })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}


