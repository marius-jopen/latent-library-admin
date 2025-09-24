import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { imageIds, collectionId, action } = await req.json() as { 
      imageIds: number[]; 
      collectionId: number; 
      action: 'add' | 'remove' 
    };

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'imageIds array is required' }, { status: 400 });
    }

    if (!collectionId || typeof collectionId !== 'number') {
      return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
    }

    if (!action || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'action must be "add" or "remove"' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    if (action === 'add') {
      // Add multiple images to collection
      const collectionImageData = imageIds.map(imageId => ({
        collection_id: collectionId,
        image_id: imageId
      }));

      const { error } = await supabase
        .from('collection_images')
        // @ts-expect-error - upsert options typing
        .upsert(collectionImageData, { 
          onConflict: 'collection_id,image_id', 
          ignoreDuplicates: true 
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        added: imageIds.length,
        message: `Successfully added ${imageIds.length} image${imageIds.length !== 1 ? 's' : ''} to collection`
      });

    } else if (action === 'remove') {
      // Remove multiple images from collection
      const { error } = await supabase
        .from('collection_images')
        .delete()
        .eq('collection_id', collectionId)
        .in('image_id', imageIds);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        removed: imageIds.length,
        message: `Successfully removed ${imageIds.length} image${imageIds.length !== 1 ? 's' : ''} from collection`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Bulk collection operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
