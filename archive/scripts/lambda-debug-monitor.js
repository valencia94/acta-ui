#!/usr/bin/env node

// Lambda CloudWatch Logs Monitor for API Debugging
const API_BASE_URL =
  'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

console.log('🔍 Lambda CloudWatch Logs Monitor');
console.log(
  '📋 This script helps identify Lambda function issues causing 502 errors'
);
console.log('🌐 API Base URL:', API_BASE_URL);

// Common Lambda function names that might be causing issues
const LAMBDA_FUNCTIONS = [
  'acta-project-summary',
  'acta-timeline',
  'acta-extract-project',
  'ProjectSummaryFunction',
  'TimelineFunction',
  'ExtractProjectFunction',
  'acta-backend',
  'acta-api',
];

console.log('\n🚀 CloudWatch Debugging Steps:');
console.log('\n1. 📊 Check AWS CloudWatch Logs');
console.log('   - Go to AWS Console → CloudWatch → Log groups');
console.log('   - Look for log groups matching these patterns:');
LAMBDA_FUNCTIONS.forEach((func) => {
  console.log(`     • /aws/lambda/${func}`);
});

console.log('\n2. 🔍 Look for Recent Errors');
console.log('   - Filter by timeframe: Last 1 hour');
console.log('   - Search for keywords: "ERROR", "Exception", "timeout", "502"');

console.log('\n3. 🐛 Common Lambda Issues to Check:');
console.log('   • Timeout errors (function exceeding time limit)');
console.log('   • Memory errors (function running out of memory)');
console.log('   • Import/dependency errors');
console.log('   • External API connection failures');
console.log('   • Database connection issues');
console.log('   • Permission/IAM role issues');

console.log('\n4. 📱 Test Specific Problematic Endpoints:');

async function testProblematicEndpoints() {
  const problematicEndpoints = [
    { url: `${API_BASE_URL}/project-summary/test`, name: 'Project Summary' },
    { url: `${API_BASE_URL}/timeline/test`, name: 'Timeline' },
    {
      url: `${API_BASE_URL}/extract-project-place/test`,
      name: 'Extract Project',
    },
  ];

  for (const endpoint of problematicEndpoints) {
    console.log(`\n🔬 Testing ${endpoint.name}...`);
    console.log(`   URL: ${endpoint.url}`);

    try {
      const start = Date.now();
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CloudWatch-Debug/1.0',
        },
      });
      const duration = Date.now() - start;

      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Duration: ${duration}ms`);

      if (response.status === 502) {
        console.log(
          '   ❌ 502 Error - Check CloudWatch logs for Lambda function errors'
        );
        console.log(`   🕐 Timestamp for logs: ${new Date().toISOString()}`);
      }

      // Get X-Amzn-RequestId for CloudWatch correlation
      const requestId = response.headers.get('x-amzn-requestid');
      if (requestId) {
        console.log(`   📋 Request ID: ${requestId}`);
        console.log(
          '   💡 Use this Request ID to find specific logs in CloudWatch'
        );
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Wait between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

console.log('\n5. 🔧 AWS CLI Commands for Log Investigation:');
console.log('   # List all Lambda log groups');
console.log(
  '   aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/"'
);
console.log('');
console.log(
  '   # Get recent logs for a specific function (replace FUNCTION_NAME)'
);
console.log('   aws logs filter-log-events \\');
console.log('     --log-group-name "/aws/lambda/FUNCTION_NAME" \\');
console.log('     --start-time $(date -d "1 hour ago" +%s)000 \\');
console.log('     --filter-pattern "ERROR"');

console.log('\n6. 🎯 Quick Deployment Check:');
console.log(
  '   ✅ Check GitHub Actions: https://github.com/valencia94/acta-ui/actions'
);
console.log('   ✅ Monitor CloudFront: https://d7t9x3j66yd8k.cloudfront.net');

async function runMonitoring() {
  console.log('\n🚀 Running Endpoint Monitoring...');
  await testProblematicEndpoints();

  console.log('\n📊 Summary:');
  console.log('• 502 errors indicate Lambda function issues');
  console.log('• Use Request IDs to correlate with CloudWatch logs');
  console.log('• Check function timeouts, memory, and dependencies');
  console.log('• Verify IAM permissions for external service access');

  console.log('\n🔗 Useful Links:');
  console.log(
    '• AWS CloudWatch Console: https://console.aws.amazon.com/cloudwatch/'
  );
  console.log(
    '• API Gateway Console: https://console.aws.amazon.com/apigateway/'
  );
  console.log('• Lambda Console: https://console.aws.amazon.com/lambda/');
}

runMonitoring().catch(console.error);
