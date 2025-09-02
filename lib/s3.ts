import 'server-only';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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


