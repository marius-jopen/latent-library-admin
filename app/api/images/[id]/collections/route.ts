import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const imageId = Number(params.id);
  if (!imageId) return NextResponse.json({ error: 'Invalid image id' }, { status: 400 });
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('collection_images')
    .select('collection_id, collections(name)')
    .eq('image_id', imageId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (data ?? []).map((r: any) => r.collection_id as number);
  const names = (data ?? []).map((r: any) => r.collections?.name).filter(Boolean) as string[];
  return NextResponse.json({ collectionIds: ids, collectionNames: names });
}


