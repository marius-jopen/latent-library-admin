import { NextResponse } from 'next/server';
import { getSignedUrlForKey } from '@/lib/s3';

const S3_DEFAULT_BUCKET = process.env.S3_DEFAULT_BUCKET || 'latent-library';
const SIGNED_URL_TTL_SECONDS = Number(process.env.SIGNED_URL_TTL_SECONDS || '900');

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bucket = url.searchParams.get('bucket') || S3_DEFAULT_BUCKET;
  const key = url.searchParams.get('key');
  if (!key) return new NextResponse('Missing key', { status: 400 });
  const signed = await getSignedUrlForKey(bucket, key, SIGNED_URL_TTL_SECONDS);
  if (!signed) return new NextResponse('Not found', { status: 404 });
  return NextResponse.redirect(signed, { status: 302 });
}


