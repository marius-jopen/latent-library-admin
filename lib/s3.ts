import 'server-only';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getCdnUrl, getOptimizedCdnUrl, getCdnType } from './cdn';

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3Client) return s3Client;
  const region = process.env.AWS_REGION;
  if (!region) throw new Error('AWS_REGION is required');
  s3Client = new S3Client({
    region,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    } : undefined,
  });
  return s3Client;
}

export async function getSignedUrlForKey(
  bucket: string,
  key: string,
  ttlSeconds: number,
): Promise<string | null> {
  try {
    const client = getS3Client();
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(client, command, { expiresIn: ttlSeconds });
    return url;
  } catch {
    return null;
  }
}

/**
 * Test if CDN is working by checking if a URL is accessible
 */
async function testCdnUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get a CDN URL for an S3 object, with fallback to signed URL
 * @param bucket - The S3 bucket name
 * @param key - The S3 object key
 * @param ttlSeconds - TTL for fallback signed URL
 * @param useCdn - Whether to use CDN (default: true)
 * @returns The CDN URL or signed URL
 */
export async function getImageUrl(
  bucket: string,
  key: string,
  ttlSeconds: number,
  useCdn: boolean = true // Enable CDN by default
): Promise<string | null> {
  if (useCdn) {
    const cdnUrl = getCdnUrl(key);
    const cdnType = getCdnType();
    
    if (cdnType === 'bunny') {
      // Bunny CDN pulling from CloudFront should work reliably
      // Since CloudFront is public, Bunny CDN can access it without issues
      return cdnUrl;
    } else if (cdnType === 'cloudfront') {
      // CloudFront with OAI should work reliably with private S3 buckets
      return cdnUrl;
    }
  }
  
  return getSignedUrlForKey(bucket, key, ttlSeconds);
}

/**
 * Get an optimized CDN URL for an S3 object
 * @param bucket - The S3 bucket name
 * @param key - The S3 object key
 * @param options - CDN optimization options
 * @returns The optimized CDN URL
 */
export function getOptimizedImageUrl(
  bucket: string,
  key: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png' | 'avif';
    blur?: number;
    grayscale?: boolean;
  } = {}
): string {
  return getOptimizedCdnUrl(key, options);
}


