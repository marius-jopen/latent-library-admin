# AWS CloudFront Setup Guide for Private S3 Bucket

This guide will help you set up AWS CloudFront to work with your private S3 bucket for the Latent Library application.

## Why CloudFront?

- **Native AWS Integration**: Works seamlessly with private S3 buckets
- **Origin Access Identity (OAI)**: Secure access to private S3 without making it public
- **Better Performance**: Global edge locations with AWS infrastructure
- **Cost Effective**: Lower data transfer costs compared to direct S3 access
- **Reliable**: Built-in fallback and error handling

## Current Configuration

- **S3 Bucket**: `latent-library` (Private)
- **S3 Region**: `eu-central-1`
- **S3 Origin**: `https://latent-library.s3.eu-central-1.amazonaws.com`

## Step 1: Create CloudFront Distribution

### 1.1 Access CloudFront Console

1. **Go to AWS Console** → **CloudFront**
2. **Click "Create Distribution"**

### 1.2 Configure Origin

**Origin Domain**: `latent-library.s3.eu-central-1.amazonaws.com`
- **Origin Path**: Leave empty
- **Origin ID**: `latent-library-s3-origin`

**Origin Access Control (OAC)**:
- **Origin Access Control**: Create new OAC
- **Name**: `latent-library-oac`
- **Description**: `OAC for latent-library S3 bucket`
- **Signing Behavior**: `Sign requests (recommended)`

### 1.3 Configure Default Cache Behavior

**Path Pattern**: `*` (Default)
**Viewer Protocol Policy**: `Redirect HTTP to HTTPS`
**Cache Policy**: `CachingOptimized`
**Origin Request Policy**: `CORS-S3Origin`
**Response Headers Policy**: `CORS-with-preflight-and-SecurityHeaders`

**Cache Key and Origin Requests**:
- **Cache Key**: `Cache policy and origin request policy (recommended)`
- **Origin Request Policy**: `CORS-S3Origin`

### 1.4 Configure Distribution Settings

**Price Class**: `Use all edge locations (best performance)`
**Alternate Domain Names (CNAMEs)**: Leave empty for now
**Custom SSL Certificate**: Use default CloudFront certificate
**Default Root Object**: Leave empty
**Logging**: Optional (enable for debugging)

### 1.5 Create Distribution

Click **"Create Distribution"** and wait for deployment (5-15 minutes).

## Step 2: Configure S3 Bucket Policy

### 2.1 Get CloudFront OAC ARN

After creating the distribution:
1. **Go to your distribution** → **Origins** tab
2. **Click on your origin**
3. **Copy the OAC ARN** (looks like: `arn:aws:cloudfront::123456789012:origin-access-control/...`)

### 2.2 Update S3 Bucket Policy

Replace `YOUR_OAC_ARN` with your actual OAC ARN:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::latent-library/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "YOUR_CLOUDFRONT_DISTRIBUTION_ARN"
                }
            }
        }
    ]
}
```

**To get your CloudFront Distribution ARN**:
- Go to your distribution → **General** tab
- Copy the **ARN** (looks like: `arn:aws:cloudfront::123456789012:distribution/ABC123DEF456`)

## Step 3: Configure Application

### 3.1 Environment Variables

Add to your `.env.local`:

```env
# CloudFront Configuration
CLOUDFRONT_DOMAIN=your-distribution-id.cloudfront.net

# S3 Configuration (existing)
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_DEFAULT_BUCKET=latent-library
```

### 3.2 Get Your CloudFront Domain

After distribution is deployed:
1. **Go to your distribution** → **General** tab
2. **Copy the Domain Name** (e.g., `d1234567890.cloudfront.net`)
3. **Add it to your environment variables**

## Step 4: Test the Setup

### 4.1 Test CloudFront Access

```bash
# Test CloudFront domain
curl -I https://your-distribution-id.cloudfront.net/

# Test with a real image (replace with actual S3 key)
curl -I https://your-distribution-id.cloudfront.net/your-image-key.jpg
```

### 4.2 Test in Application

1. **Start your development server**
2. **Check browser network tab**
3. **Verify images are served from CloudFront URLs**

## Step 5: Optional Optimizations

### 5.1 Custom Domain (Optional)

If you want a custom domain:
1. **Add CNAME record** in your DNS: `cdn.yourdomain.com` → `your-distribution-id.cloudfront.net`
2. **Request SSL certificate** in AWS Certificate Manager
3. **Update CloudFront** with custom domain and certificate

### 5.2 Cache Headers

Configure appropriate cache headers in S3:
- **Cache-Control**: `public, max-age=31536000` (1 year for images)
- **Expires**: Set appropriate expiration

### 5.3 Compression

CloudFront automatically compresses content, but you can optimize:
- **Enable Gzip compression** in S3
- **Use WebP format** for better compression

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check S3 bucket policy and OAC configuration
2. **404 Not Found**: Verify S3 key path and CloudFront origin
3. **CORS Errors**: Ensure CORS is configured in S3

### Debug Steps

1. **Check CloudFront logs** (if enabled)
2. **Test S3 direct access**: `https://latent-library.s3.eu-central-1.amazonaws.com/your-key`
3. **Test CloudFront access**: `https://your-distribution-id.cloudfront.net/your-key`
4. **Check browser developer tools** for error messages

## Benefits

- **Security**: Private S3 bucket remains private
- **Performance**: Global edge locations
- **Cost**: Reduced S3 data transfer costs
- **Reliability**: AWS infrastructure with automatic failover
- **Scalability**: Handles traffic spikes automatically

## Cost Considerations

- **CloudFront Data Transfer**: ~$0.085/GB for first 10TB
- **CloudFront Requests**: ~$0.0075 per 10,000 requests
- **S3 Data Transfer**: Reduced due to CloudFront caching
- **Overall**: Usually cheaper than direct S3 access for high-traffic applications

## Next Steps

1. **Create CloudFront distribution** following this guide
2. **Update environment variables** with your CloudFront domain
3. **Test the setup** with real images
4. **Monitor performance** and adjust cache settings as needed
