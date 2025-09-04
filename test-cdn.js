#!/usr/bin/env node

/**
 * Test script to verify Bunny CDN configuration
 * Run with: node test-cdn.js
 */

const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || 'latent-library.b-cdn.net';

async function testCdnConfiguration() {
  console.log('🔍 Testing Bunny CDN Configuration...\n');
  
  // Test 1: Check if CDN hostname is reachable
  console.log(`1. Testing CDN hostname: ${BUNNY_CDN_HOSTNAME}`);
  try {
    const response = await fetch(`https://${BUNNY_CDN_HOSTNAME}`, { method: 'HEAD' });
    console.log(`   ✅ CDN hostname is reachable (Status: ${response.status})`);
  } catch (error) {
    console.log(`   ❌ CDN hostname is not reachable: ${error.message}`);
  }
  
  // Test 2: Check if we can access a sample image
  console.log(`\n2. Testing sample image access...`);
  const sampleImageUrl = `https://${BUNNY_CDN_HOSTNAME}/sample-image.jpg`;
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
  
  // Test 3: Check CDN configuration
  console.log(`\n3. CDN Configuration Check:`);
  console.log(`   CDN Hostname: ${BUNNY_CDN_HOSTNAME}`);
  console.log(`   Expected Origin: https://latent-library.s3.eu-central-1.amazonaws.com`);
  
  console.log(`\n📋 Next Steps:`);
  console.log(`   1. Verify your Bunny CDN pull zone is configured with the correct origin`);
  console.log(`   2. Ensure the origin URL matches your S3 bucket: https://latent-library.s3.eu-central-1.amazonaws.com`);
  console.log(`   3. Check that your S3 bucket allows access from the CDN`);
  console.log(`   4. Test with an actual image from your S3 bucket`);
  
  console.log(`\n🔧 To test with a real image:`);
  console.log(`   Replace 'sample-image.jpg' with an actual S3 key from your bucket`);
  console.log(`   Example: https://${BUNNY_CDN_HOSTNAME}/your-actual-image-key.jpg`);
}

testCdnConfiguration().catch(console.error);
