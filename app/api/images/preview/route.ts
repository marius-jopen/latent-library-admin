import { NextResponse } from 'next/server';
import { getImageUrl } from '@/lib/s3';

const S3_DEFAULT_BUCKET = process.env.S3_DEFAULT_BUCKET || 'latent-library';
const SIGNED_URL_TTL_SECONDS = Number(process.env.SIGNED_URL_TTL_SECONDS || '900');

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bucket = url.searchParams.get('bucket') || S3_DEFAULT_BUCKET;
  const key = url.searchParams.get('key');
  if (!key) return new NextResponse('Missing key', { status: 400 });
  const imageUrl = await getImageUrl(bucket, key, SIGNED_URL_TTL_SECONDS, false);
  if (!imageUrl) return new NextResponse('Not found', { status: 404 });
  return NextResponse.redirect(imageUrl, { status: 302 });
}


