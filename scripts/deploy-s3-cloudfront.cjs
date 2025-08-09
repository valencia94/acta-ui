#!/usr/bin/env node
/* Deploy dist/ to S3 and invalidate CloudFront using AWS SDK v3 */
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');

const DIST = path.resolve(process.cwd(), 'dist');
const BUCKET = process.env.FRONTEND_DEPLOYMENT_BUCKET || 'acta-ui-frontend-prod';
const REGION = process.env.AWS_REGION || process.env.VITE_AWS_REGION || 'us-east-2';
const DISTRIBUTION_ID = process.env.VITE_CLOUDFRONT_DISTRIBUTION_ID || 'EPQU7PVDLQXUA';

if (!fs.existsSync(DIST)) {
  console.error('❌ dist/ not found. Run build first.');
  process.exit(1);
}

const s3 = new S3Client({ region: REGION });
const cf = new CloudFrontClient({ region: REGION });

function* walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

function guessContentType(key) {
  if (key.endsWith('.html')) return 'text/html; charset=utf-8';
  if (key.endsWith('.css')) return 'text/css; charset=utf-8';
  if (key.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.svg')) return 'image/svg+xml';
  if (key.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

(async () => {
  console.log(`🚀 Deploying to s3://${BUCKET} (region ${REGION})`);

  // Optionally clean bucket objects under root (excluding hashed assets can be left)
  try {
    const list = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }));
    if (list.Contents && list.Contents.length > 0) {
      // Delete only root files we know we overwrite
      const toDelete = list.Contents.filter(o => ['index.html', '404.html', 'aws-exports.js', 'robots.txt'].includes(o.Key))
        .map(o => ({ Key: o.Key }));
      if (toDelete.length) {
        await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: toDelete } }));
        console.log(`🧹 Cleaned ${toDelete.length} root files`);
      }
    }
  } catch (e) {
    console.warn('⚠️ Could not list/delete existing objects:', e.message);
  }

  // Upload files
  for (const filePath of walk(DIST)) {
    const rel = path.relative(DIST, filePath).replace(/\\/g, '/');
    const isRootHtml = rel === 'index.html' || rel === '404.html' || rel === 'aws-exports.js';
    const Body = fs.readFileSync(filePath);
    const ContentType = guessContentType(rel);
    const CacheControl = isRootHtml ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable';

    try {
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: rel, Body, ContentType, CacheControl }));
      console.log(`⬆️  Uploaded ${rel}`);
    } catch (e) {
      console.error(`❌ Failed to upload ${rel}:`, e.message);
      process.exit(1);
    }
  }

  // Invalidate CloudFront
  try {
    const res = await cf.send(new CreateInvalidationCommand({
      DistributionId: DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: `${Date.now()}`,
        Paths: { Quantity: 1, Items: ['/*'] },
      },
    }));
    console.log('🧹 CloudFront invalidation created:', res.Invalidation?.Id);
  } catch (e) {
    console.error('❌ Failed to create CloudFront invalidation:', e.message);
    process.exit(1);
  }

  console.log('\n✅ Deployment complete. Visit https://d7t9x3j66yd8k.cloudfront.net');
})();
