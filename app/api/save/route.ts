import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const { imageId, collectionName } = (await req.json()) as { imageId?: number; collectionName?: string };
  if (!imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 });
  const supabase = getSupabaseAdminClient();
  const name = (collectionName || 'Saved').trim();

  // Find or create collection by name
  let { data: col, error: findErr } = await supabase
    .from('collections')
    .select('id, name')
    .eq('name', name)
    .single();
  if (findErr) {
    const { data: created, error: createErr } = await supabase
      .from('collections')
      .insert({ name })
      .select('id, name')
      .single();
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
    col = created as any;
  }

  // Attach image to collection (idempotent)
  const { error: attachErr } = await supabase
    .from('collection_images')
    // @ts-ignore - upsert options typing
    .upsert({ collection_id: col!.id, image_id: imageId }, { onConflict: 'collection_id,image_id', ignoreDuplicates: true });
  if (attachErr) return NextResponse.json({ error: attachErr.message }, { status: 500 });

  // Also reflect saved state on the image row for quick UI reads
  const { error: updateErr } = await supabase.from('images').update({ liked: true }).eq('id', imageId);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, collectionId: col!.id });
}

export async function DELETE(req: Request) {
  const { imageId } = (await req.json()) as { imageId?: number };
  if (!imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 });
  const supabase = getSupabaseAdminClient();
  // Find the Saved collection
  const { data: col, error } = await supabase.from('collections').select('id').eq('name', 'Saved').single();
  if (error || !col) return NextResponse.json({ error: 'Saved collection not found' }, { status: 404 });
  const { error: delErr } = await supabase
    .from('collection_images')
    .delete()
    .eq('collection_id', col.id)
    .eq('image_id', imageId);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // Reflect unsaved state on the image row
  const { error: updateErr } = await supabase.from('images').update({ liked: false }).eq('id', imageId);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


