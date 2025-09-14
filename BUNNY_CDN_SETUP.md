# Bunny CDN Setup Guide for Private S3 Bucket

This guide will help you configure Bunny CDN to work with your **private** S3 bucket for the Latent Library application.

## Current Configuration

- **CDN Hostname**: `latent-library.b-cdn.net`
- **S3 Bucket**: `latent-library` (Private)
- **S3 Region**: `eu-central-1`
- **Expected Origin**: `https://latent-library.s3.eu-central-1.amazonaws.com`

## Option 1: Bunny CDN with AWS Credentials (Recommended)

### Step 1: Configure Bunny CDN with AWS Credentials

In your Bunny CDN dashboard:

1. **Go to your Pull Zone settings**
2. **Navigate to "Origin" tab**
3. **Set Origin URL**: `https://latent-library.s3.eu-central-1.amazonaws.com`
4. **Enable "Origin Shield"** for better performance
5. **Go to "Authentication" tab**
6. **Enable "Origin Authentication"**
7. **Set Authentication Type**: "AWS Signature V4"
8. **Enter your AWS credentials**:
   - **Access Key ID**: Your AWS Access Key ID
   - **Secret Access Key**: Your AWS Secret Access Key
   - **Region**: `eu-central-1`

### Step 2: Configure S3 Bucket for Bunny CDN Access

#### 2.1 Update Bucket Policy

Add this bucket policy to allow Bunny CDN to access your S3 bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowBunnyCDNAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/bunny-cdn-user"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::latent-library/*"
        }
    ]
}
```

**Note**: Replace `YOUR_ACCOUNT_ID` with your AWS account ID and create a dedicated IAM user for Bunny CDN.

#### 2.2 Create IAM User for Bunny CDN

1. **Create a new IAM user**: `bunny-cdn-user`
2. **Attach this policy**:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::latent-library/*"
        }
    ]
}
```

3. **Generate access keys** for this user
4. **Use these credentials** in Bunny CDN dashboard

#### 2.3 Configure CORS

Add this CORS configuration to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": [
            "https://latent-library.b-cdn.net",
            "https://*.b-cdn.net"
        ],
        "ExposeHeaders": ["ETag", "x-amz-meta-*"]
    }
]
```

## Option 2: Hybrid Approach with Signed URLs

If Bunny CDN doesn't support AWS authentication, you can use a hybrid approach:

### Step 1: Configure Bunny CDN for Signed URLs

1. **Set Origin URL**: `https://latent-library.s3.eu-central-1.amazonaws.com`
2. **Enable "Origin Shield"**
3. **Configure custom headers** to pass signed URL parameters

### Step 2: Modify Application to Use Signed URLs with CDN

The application will generate signed URLs and pass them to Bunny CDN. This requires custom implementation.

## Option 3: Use CloudFront Instead (Alternative)

If Bunny CDN doesn't work well with private S3 buckets, consider using AWS CloudFront:

1. **Create CloudFront distribution**
2. **Set S3 as origin**
3. **Configure signed URLs or OAI (Origin Access Identity)**
4. **Update CDN hostname** in your application

## Step 2: Verify Bunny CDN Configuration

### 2.1 Check Pull Zone Settings

In your Bunny CDN dashboard:

1. **Origin URL**: `https://latent-library.s3.eu-central-1.amazonaws.com`
2. **Origin Shield**: Enable for better performance
3. **Cache Control**: Set appropriate cache headers
4. **Compression**: Enable Gzip/Brotli compression

### 2.2 Test CDN Access

Run the test script to verify configuration:

```bash
node test-cdn.js
```

## Step 3: Environment Variables

Add these environment variables to your `.env.local`:

```env
# Bunny CDN Configuration
BUNNY_CDN_HOSTNAME=latent-library.b-cdn.net

# S3 Configuration (existing)
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_DEFAULT_BUCKET=latent-library
```

## Step 4: Test the Setup

### 4.1 Test with a Real Image

1. Upload an image to your S3 bucket
2. Note the S3 key (path)
3. Test the CDN URL: `https://latent-library.b-cdn.net/your-image-key.jpg`

### 4.2 Verify in Application

1. Start your development server
2. Check the browser network tab
3. Verify that images are being served from the CDN URL

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check S3 bucket policy and CORS configuration
2. **404 Not Found**: Verify the S3 key path and CDN origin URL
3. **CORS Errors**: Ensure CORS is properly configured for the CDN domain

### Debug Steps

1. Test S3 direct access: `https://latent-library.s3.eu-central-1.amazonaws.com/your-image-key.jpg`
2. Test CDN access: `https://latent-library.b-cdn.net/your-image-key.jpg`
3. Check browser developer tools for error messages

## Benefits of Using Bunny CDN

- **Faster Loading**: Images served from edge locations closer to users
- **Reduced S3 Costs**: Less direct S3 requests
- **Better Performance**: Optimized image delivery
- **Global Distribution**: Images cached worldwide

## Fallback Mechanism

The application includes a fallback mechanism:
- If CDN fails, it automatically falls back to S3 signed URLs
- This ensures images always load, even if CDN is temporarily unavailable

## Security Considerations

- S3 bucket is now publicly readable
- Consider using CloudFront with signed URLs for more security
- Monitor S3 access logs for unusual activity
- Consider implementing rate limiting if needed
