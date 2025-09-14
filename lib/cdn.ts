import 'server-only';

/**
 * CDN utility functions supporting both Bunny CDN and AWS CloudFront
 * 
 * CloudFront provides better integration with private S3 buckets:
 * - CloudFront Distribution Domain: {distribution-id}.cloudfront.net
 * - Origin: https://latent-library.s3.eu-central-1.amazonaws.com
 * - Supports OAI (Origin Access Identity) for private S3 access
 * 
 * Bunny CDN (fallback):
 * - Pull Zone Hostname: latent-library.b-cdn.net
 * - Origin: https://latent-library.s3.eu-central-1.amazonaws.com
 */

const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || 'latent-library.b-cdn.net';

// Use CloudFront if available, otherwise fall back to Bunny CDN
const CDN_HOSTNAME = CLOUDFRONT_DOMAIN || BUNNY_CDN_HOSTNAME;
const CDN_TYPE = CLOUDFRONT_DOMAIN ? 'cloudfront' : 'bunny';

/**
 * Generate a CDN URL for an S3 object
 * @param s3Key - The S3 object key (path)
 * @param bucket - The S3 bucket name (optional, defaults to S3_DEFAULT_BUCKET)
 * @returns The CDN URL
 */
export function getCdnUrl(s3Key: string): string {
  // Remove leading slash if present
  const cleanKey = s3Key.startsWith('/') ? s3Key.slice(1) : s3Key;
  
  // Construct the CDN URL
  return `https://${CDN_HOSTNAME}/${cleanKey}`;
}

/**
 * Generate a CDN URL with query parameters for optimization
 * @param s3Key - The S3 object key (path)
 * @param options - CDN optimization options
 * @param bucket - The S3 bucket name (optional)
 * @returns The CDN URL with query parameters
 */
export function getOptimizedCdnUrl(
  s3Key: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png' | 'avif';
    blur?: number;
    grayscale?: boolean;
  } = {}
): string {
  const baseUrl = getCdnUrl(s3Key);
  
  // Bunny CDN supports query parameters for image optimization
  const params = new URLSearchParams();
  
  if (options.width) params.set('w', options.width.toString());
  if (options.height) params.set('h', options.height.toString());
  if (options.quality) params.set('q', options.quality.toString());
  if (options.format) params.set('f', options.format);
  if (options.blur) params.set('blur', options.blur.toString());
  if (options.grayscale) params.set('grayscale', '1');
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Check if a URL is a CDN URL
 * @param url - The URL to check
 * @returns True if it's a CDN URL
 */
export function isCdnUrl(url: string): boolean {
  return url.includes(CDN_HOSTNAME);
}

/**
 * Get the CDN type being used
 * @returns 'cloudfront' or 'bunny'
 */
export function getCdnType(): string {
  return CDN_TYPE;
}

/**
 * Convert an S3 URL to a CDN URL
 * @param s3Url - The S3 URL
 * @returns The CDN URL
 */
export function s3UrlToCdnUrl(s3Url: string): string {
  try {
    const url = new URL(s3Url);
    
    // Extract the key from the S3 URL
    // S3 URLs typically look like: https://bucket.s3.region.amazonaws.com/key
    const pathParts = url.pathname.split('/').filter(Boolean);
    const key = pathParts.slice(1).join('/'); // Remove bucket name from path
    
    return getCdnUrl(key);
  } catch {
    // If URL parsing fails, return the original URL
    return s3Url;
  }
}

/**
 * Get the fallback S3 signed URL if CDN is not available
 * This is used as a fallback mechanism
 */
export async function getFallbackS3Url(
  bucket: string,
  key: string,
  ttlSeconds: number
): Promise<string | null> {
  // Import here to avoid circular dependencies
  const { getSignedUrlForKey } = await import('./s3');
  return getSignedUrlForKey(bucket, key, ttlSeconds);
}
