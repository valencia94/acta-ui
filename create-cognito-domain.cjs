#!/usr/bin/env node

/**
 * ACTA-UI Cognito Custom Domain Setup
 * ==================================
 * This script creates a custom domain for the existing Cognito User Pool
 * using the AWS SDK for JavaScript.
 */

const https = require('https');
const crypto = require('crypto');

// Configuration
const USER_POOL_ID = 'us-east-2_FyHLtOhiY';
const DOMAIN_NAME = 'acta-ui-prod';
const REGION = 'us-east-2';
const CLOUDWATCH_POLICY_ID = 'WDnzkPmx3dKaEAQgFKx2jj';

// AWS credentials from environment
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || REGION;

function log(level, message, details = '') {
  const timestamp = new Date().toISOString();
  const prefix = {
    INFO: 'ℹ️',
    SUCCESS: '✅',
    WARNING: '⚠️',
    ERROR: '❌'
  }[level] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
  if (details) console.log(`   ${details}`);
}

// AWS v4 signing
function sign(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = sign(('AWS4' + key), dateStamp);
  const kRegion = sign(kDate, regionName);
  const kService = sign(kRegion, serviceName);
  const kSigning = sign(kService, 'aws4_request');
  return kSigning;
}

function awsRequest(service, action, payload) {
  return new Promise((resolve, reject) => {
    const host = `${service}.${AWS_REGION}.amazonaws.com`;
    const endpoint = `https://${host}`;
    
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
    
    const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
    
    const headers = {
      'Content-Type': 'application/x-amz-json-1.1',
      'Host': host,
      'X-Amz-Target': action,
      'X-Amz-Date': timeStamp,
      'Authorization': '',
      'Content-Length': payload.length
    };
    
    // Create canonical request
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
      .join('');
    
    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';');
    
    const canonicalRequest = [
      'POST',
      '/',
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');
    
    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${AWS_REGION}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      timeStamp,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');
    
    // Calculate signature
    const signingKey = getSignatureKey(AWS_SECRET_ACCESS_KEY, dateStamp, AWS_REGION, service);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    
    // Add authorization header
    headers.Authorization = `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    const req = https.request({
      hostname: host,
      path: '/',
      method: 'POST',
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${response.message || data}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });
    
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function createCognitoDomain() {
  log('INFO', '🚀 Creating Cognito Custom Domain');
  
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    log('ERROR', 'AWS credentials not found in environment variables');
    return false;
  }
  
  log('SUCCESS', `Using AWS credentials for region: ${AWS_REGION}`);
  
  try {
    // Check if domain already exists
    log('INFO', 'Checking if domain already exists...');
    try {
      const describePayload = JSON.stringify({
        Domain: DOMAIN_NAME
      });
      
      const describeResult = await awsRequest(
        'cognito-idp',
        'AWSCognitoIdentityProviderService.DescribeUserPoolDomain',
        describePayload
      );
      
      if (describeResult.DomainDescription && describeResult.DomainDescription.Status === 'ACTIVE') {
        log('WARNING', 'Domain already exists and is active');
        log('SUCCESS', `Domain URL: https://${DOMAIN_NAME}.auth.${AWS_REGION}.amazoncognito.com`);
        return true;
      }
    } catch (e) {
      log('INFO', 'Domain does not exist, creating new one...');
    }
    
    // Create the domain
    log('INFO', `Creating custom domain: ${DOMAIN_NAME}`);
    const createPayload = JSON.stringify({
      Domain: DOMAIN_NAME,
      UserPoolId: USER_POOL_ID
    });
    
    const createResult = await awsRequest(
      'cognito-idp',
      'AWSCognitoIdentityProviderService.CreateUserPoolDomain',
      createPayload
    );
    
    log('SUCCESS', 'Domain creation initiated');
    log('INFO', `CloudFront Distribution: ${createResult.CloudFrontDomain || 'Creating...'}`);
    
    // Wait for domain to be ready
    log('INFO', 'Waiting for domain to become active...');
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      try {
        const statusPayload = JSON.stringify({
          Domain: DOMAIN_NAME
        });
        
        const statusResult = await awsRequest(
          'cognito-idp',
          'AWSCognitoIdentityProviderService.DescribeUserPoolDomain',
          statusPayload
        );
        
        if (statusResult.DomainDescription && statusResult.DomainDescription.Status === 'ACTIVE') {
          log('SUCCESS', 'Domain is now active!');
          break;
        }
        
        log('INFO', `Domain status: ${statusResult.DomainDescription?.Status || 'UNKNOWN'}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        attempts++;
        
      } catch (e) {
        log('WARNING', `Status check failed: ${e.message}`);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    if (attempts >= maxAttempts) {
      log('WARNING', 'Domain creation may still be in progress. Check AWS Console for status.');
    }
    
    // Update configuration
    log('INFO', 'Updating aws-exports.js configuration...');
    const fs = require('fs');
    const domainUrl = `${DOMAIN_NAME}.auth.${AWS_REGION}.amazoncognito.com`;
    
    // Read current configuration
    let awsExports = fs.readFileSync('src/aws-exports.js', 'utf8');
    
    // Update domain
    awsExports = awsExports.replace(
      /domain: '[^']*'/,
      `domain: '${domainUrl}'`
    );
    
    // Write updated configuration
    fs.writeFileSync('src/aws-exports.js', awsExports);
    
    log('SUCCESS', 'Configuration updated successfully');
    log('SUCCESS', `Domain URL: https://${domainUrl}`);
    log('INFO', `Policy ID: ${CLOUDWATCH_POLICY_ID}`);
    
    return true;
    
  } catch (error) {
    log('ERROR', `Failed to create domain: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 ACTA-UI Cognito Custom Domain Setup');
  console.log('======================================');
  
  const success = await createCognitoDomain();
  
  if (success) {
    console.log('\\n🎉 SETUP COMPLETE!');
    console.log('==================');
    console.log(`✅ Custom domain: ${DOMAIN_NAME}.auth.${AWS_REGION}.amazoncognito.com`);
    console.log(`✅ Policy ID: ${CLOUDWATCH_POLICY_ID}`);
    console.log('✅ Configuration updated');
    console.log('\\n📋 Next Steps:');
    console.log('1. Test authentication flow');
    console.log('2. Deploy frontend changes');
  } else {
    console.log('\\n❌ SETUP FAILED');
    console.log('Check the logs above for details');
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}
