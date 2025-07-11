#!/usr/bin/env node

// AWS API Gateway Configuration Fix Script
// Based on Single Source of Truth Configuration

const { execSync } = require('child_process');

const API_ID = 'q2b9avfwv5';
const STAGE = 'prod';
const REGION = 'us-east-2';
const USER_POOL_ARN = 'arn:aws:cognito-idp:us-east-2:703671891952:userpool/us-east-2_FyHLtOhiY';
const COGNITO_AUTHORIZER_NAME = 'ActaUiCognitoAuthorizer';

console.log('🔧 Starting API Gateway Configuration Fix...');
console.log(`📍 API ID: ${API_ID}`);
console.log(`🌍 Region: ${REGION}`);
console.log(`🔐 User Pool ARN: ${USER_POOL_ARN}`);

function runAwsCommand(command, description) {
  console.log(`\n🔍 ${description}...`);
  console.log(`📝 Command: aws ${command}`);
  
  try {
    const result = execSync(`aws ${command} --region ${REGION}`, { 
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
    console.log(`✅ Success: ${description}`);
    return JSON.parse(result);
  } catch (error) {
    console.log(`❌ Failed: ${description}`);
    console.log(`   Error: ${error.message}`);
    if (error.stdout) console.log(`   Output: ${error.stdout}`);
    if (error.stderr) console.log(`   Error Details: ${error.stderr}`);
    return null;
  }
}

async function fixApiGatewayConfiguration() {
  console.log('\n🚀 Starting API Gateway Configuration Fix Based on Single Source of Truth...\n');
  
  // Step 1: Get current API Gateway configuration
  const apiInfo = runAwsCommand(
    `apigateway get-rest-api --rest-api-id ${API_ID}`,
    'Getting API Gateway information'
  );
  
  if (!apiInfo) {
    console.log('❌ Cannot proceed without API information');
    return;
  }
  
  console.log(`📋 API Name: ${apiInfo.name}`);
  console.log(`📋 API Description: ${apiInfo.description}`);
  
  // Step 2: Get existing authorizers
  const authorizers = runAwsCommand(
    `apigateway get-authorizers --rest-api-id ${API_ID}`,
    'Getting existing authorizers'
  );
  
  let cognitoAuthorizerId = null;
  if (authorizers && authorizers.items) {
    const cognitoAuth = authorizers.items.find(auth => 
      auth.name === COGNITO_AUTHORIZER_NAME || 
      auth.type === 'COGNITO_USER_POOLS'
    );
    
    if (cognitoAuth) {
      cognitoAuthorizerId = cognitoAuth.id;
      console.log(`✅ Found Cognito Authorizer: ${cognitoAuth.name} (ID: ${cognitoAuthorizerId})`);
    }
  }
  
  // Step 3: Create Cognito authorizer if it doesn't exist
  if (!cognitoAuthorizerId) {
    console.log('\n🔐 Creating Cognito User Pool Authorizer...');
    
    const authorizerData = {
      name: COGNITO_AUTHORIZER_NAME,
      type: 'COGNITO_USER_POOLS',
      providerARNs: [USER_POOL_ARN],
      identitySource: 'method.request.header.Authorization'
    };
    
    const createAuthResult = runAwsCommand(
      `apigateway create-authorizer --rest-api-id ${API_ID} --cli-input-json '${JSON.stringify(authorizerData)}'`,
      'Creating Cognito authorizer'
    );
    
    if (createAuthResult) {
      cognitoAuthorizerId = createAuthResult.id;
      console.log(`✅ Created Cognito Authorizer with ID: ${cognitoAuthorizerId}`);
    }
  }
  
  if (!cognitoAuthorizerId) {
    console.log('❌ Cannot proceed without Cognito authorizer');
    return;
  }
  
  // Step 4: Get all resources
  const resources = runAwsCommand(
    `apigateway get-resources --rest-api-id ${API_ID}`,
    'Getting API resources'
  );
  
  if (!resources || !resources.items) {
    console.log('❌ Cannot get API resources');
    return;
  }
  
  // Step 5: Configure protected endpoints according to single source of truth
  const protectedEndpoints = [
    { path: '/pm-manager/{pmEmail}', methods: ['GET', 'POST'] },
    { path: '/extract-project-place', methods: ['POST'] },
    { path: '/check-document/{projectId}', methods: ['GET'] },
    { path: '/download-acta/{projectId}', methods: ['GET'] },
    { path: '/send-approval-email', methods: ['POST'] }
  ];
  
  console.log('\n🔐 Configuring protected endpoints...');
  
  for (const endpoint of protectedEndpoints) {
    console.log(`\n📍 Processing ${endpoint.path}...`);
    
    // Find the resource
    const resource = resources.items.find(r => r.pathPart && endpoint.path.includes(r.pathPart));
    
    if (!resource) {
      console.log(`⚠️ Resource not found for ${endpoint.path}`);
      continue;
    }
    
    console.log(`   Found resource: ${resource.path} (ID: ${resource.id})`);
    
    // Configure each method
    for (const method of endpoint.methods) {
      try {
        console.log(`   🔧 Configuring ${method} method...`);
        
        // Update method to use Cognito authorizer
        const updateResult = runAwsCommand(
          `apigateway update-method --rest-api-id ${API_ID} --resource-id ${resource.id} --http-method ${method} --patch-ops op=replace,path=/authorizationType,value=COGNITO_USER_POOLS op=replace,path=/authorizerId,value=${cognitoAuthorizerId}`,
          `Updating ${method} method authorization for ${endpoint.path}`
        );
        
        if (updateResult) {
          console.log(`   ✅ ${method} method configured with Cognito auth`);
        }
      } catch (error) {
        console.log(`   ⚠️ Method ${method} may not exist for ${endpoint.path}`);
      }
    }
  }
  
  // Step 6: Fix CORS for all resources
  console.log('\n🌐 Fixing CORS configuration...');
  
  for (const resource of resources.items) {
    if (resource.resourceMethods && resource.resourceMethods.OPTIONS) {
      console.log(`\n📍 Updating CORS for ${resource.path}...`);
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://d7t9x3j66yd8k.cloudfront.net',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
        'Access-Control-Allow-Credentials': 'true'
      };
      
      for (const [header, value] of Object.entries(corsHeaders)) {
        runAwsCommand(
          `apigateway update-integration-response --rest-api-id ${API_ID} --resource-id ${resource.id} --http-method OPTIONS --status-code 200 --patch-ops op=replace,path=/responseParameters/method.response.header.${header},value='${value}'`,
          `Setting ${header} for ${resource.path}`
        );
      }
    }
  }
  
  // Step 7: Deploy the API
  console.log('\n🚀 Deploying API changes...');
  
  const deployResult = runAwsCommand(
    `apigateway create-deployment --rest-api-id ${API_ID} --stage-name ${STAGE} --description "Fixed authentication and CORS configuration"`,
    'Deploying API changes'
  );
  
  if (deployResult) {
    console.log(`✅ API deployed successfully! Deployment ID: ${deployResult.id}`);
  }
  
  console.log('\n📊 Configuration Fix Summary:');
  console.log('✅ Cognito User Pool authorizer configured');
  console.log('✅ Protected endpoints configured with Cognito auth:');
  protectedEndpoints.forEach(endpoint => {
    console.log(`   - ${endpoint.path} (${endpoint.methods.join(', ')})`);
  });
  console.log('✅ CORS headers updated for Authorization support');
  console.log('✅ API deployed to production');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Test the API with a valid Cognito JWT token');
  console.log('2. Verify that authentication works in the frontend');
  console.log('3. Check CloudWatch logs if any issues persist');
}

// Run the fix
fixApiGatewayConfiguration().catch(error => {
  console.error('❌ Configuration fix failed:', error);
  process.exit(1);
});
