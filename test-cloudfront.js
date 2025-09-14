#!/usr/bin/env node

/**
 * Test script to verify CloudFront configuration
 * Run with: CLOUDFRONT_DOMAIN=your-domain.cloudfront.net node test-cloudfront.js
 */

const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || 'latent-library.b-cdn.net';

async function testCloudFrontConfiguration() {
  console.log('🔍 Testing CloudFront Configuration...\n');
  
  if (!CLOUDFRONT_DOMAIN) {
    console.log('❌ CLOUDFRONT_DOMAIN environment variable not set');
    console.log('   Set it to your CloudFront distribution domain (e.g., d1234567890.cloudfront.net)');
    console.log('   Example: CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net node test-cloudfront.js');
    return;
  }
  
  // Test 1: Check if CloudFront domain is reachable
  console.log(`1. Testing CloudFront domain: ${CLOUDFRONT_DOMAIN}`);
  try {
    const response = await fetch(`https://${CLOUDFRONT_DOMAIN}`, { method: 'HEAD' });
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 403) {
      console.log('   ✅ CloudFront is accessible but S3 bucket is private (expected)');
    } else if (response.status === 200) {
      console.log('   ✅ CloudFront is accessible and working');
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ CloudFront not accessible: ${error.message}`);
  }
  
  // Test 2: Check if we can access a sample image
  console.log(`\n2. Testing sample image access...`);
  const sampleImageUrl = `https://${CLOUDFRONT_DOMAIN}/sample-image.jpg`;
  try {
    const response = await fetch(sampleImageUrl, { method: 'HEAD' });
    if (response.ok) {
      console.log(`   ✅ Sample image is accessible (Status: ${response.status})`);
    } else {
      console.log(`   ⚠️  Sample image not found (Status: ${response.status}) - This is expected if no sample image exists`);
    }
  } catch (error) {
    console.log(`   ❌ Cannot access sample image: ${error.message}`);
  }
  
  // Test 3: Check configuration
  console.log(`\n3. Configuration Check:`);
  console.log(`   CloudFront Domain: ${CLOUDFRONT_DOMAIN}`);
  console.log(`   Expected Origin: https://latent-library.s3.eu-central-1.amazonaws.com`);
  console.log(`   CDN Type: CloudFront`);
  
  console.log(`\n📋 Next Steps:`);
  console.log(`   1. Verify your CloudFront distribution is deployed`);
  console.log(`   2. Check that OAC (Origin Access Control) is configured`);
  console.log(`   3. Verify S3 bucket policy allows CloudFront access`);
  console.log(`   4. Test with an actual image from your S3 bucket`);
  
  console.log(`\n🔧 To test with a real image:`);
  console.log(`   Replace 'sample-image.jpg' with an actual S3 key from your bucket`);
  console.log(`   Example: https://${CLOUDFRONT_DOMAIN}/your-actual-image-key.jpg`);
  
  console.log(`\n💡 Benefits of CloudFront:`);
  console.log(`   ✅ Works with private S3 buckets`);
  console.log(`   ✅ Global edge locations`);
  console.log(`   ✅ Automatic compression`);
  console.log(`   ✅ Better performance than direct S3 access`);
  console.log(`   ✅ Reduced S3 costs`);
}

testCloudFrontConfiguration().catch(console.error);
