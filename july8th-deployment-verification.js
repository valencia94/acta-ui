#!/usr/bin/env node

import fs from 'fs';

console.log('🔍 July 8th Deployment Feature Verification');
console.log('===========================================\n');

const dashboardPath = 'src/pages/Dashboard.tsx';

if (fs.existsSync(dashboardPath)) {
  const content = fs.readFileSync(dashboardPath, 'utf-8');
  
  // Critical features that should be present based on July 8th working state
  const criticalFeatures = [
    {
      name: 'Cognito Authentication Integration',
      patterns: [
        /import.*getCurrentUser.*from.*api-amplify/,
        /const.*cognitoUser.*=.*await getCurrentUser/,
        /user\?.email/
      ],
      required: true
    },
    {
      name: 'DynamoDB Projects Integration',
      patterns: [
        /import.*DynamoProjectsView/,
        /<DynamoProjectsView/,
        /userEmail.*=.*user.*email/
      ],
      required: true
    },
    {
      name: 'ACTA Document Generation',
      patterns: [
        /generateActaDocument/,
        /getS3DownloadUrl/,
        /checkDocumentInS3/
      ],
      required: true
    },
    {
      name: 'PDF Preview Functionality',
      patterns: [
        /PDFPreview/,
        /setPdfPreviewUrl/,
        /pdfPreviewUrl/
      ],
      required: true
    },
    {
      name: 'Email Approval Workflow',
      patterns: [
        /EmailInputDialog/,
        /sendApprovalEmail/,
        /isEmailDialogOpen/
      ],
      required: true
    },
    {
      name: 'Action Buttons Integration',
      patterns: [
        /ActaButtons/,
        /onGenerateActa/,
        /onDownloadPdf/,
        /onDownloadDocx/
      ],
      required: true
    },
    {
      name: 'Error Handling & Loading States',
      patterns: [
        /actionLoading/,
        /setActionLoading/,
        /toast\.error/,
        /toast\.success/
      ],
      required: true
    },
    {
      name: 'Project Selection Logic',
      patterns: [
        /selectedProjectId/,
        /setSelectedProjectId/,
        /handleProjectSelect/
      ],
      required: true
    }
  ];
  
  console.log('📊 Feature Analysis Results:');
  console.log('============================\n');
  
  let allCriticalPresent = true;
  let featureCount = 0;
  
  criticalFeatures.forEach(feature => {
    const matchedPatterns = feature.patterns.filter(pattern => pattern.test(content));
    const isPresent = matchedPatterns.length > 0;
    const status = isPresent ? '✅' : '❌';
    
    console.log(`${status} ${feature.name}`);
    
    if (isPresent) {
      featureCount += matchedPatterns.length;
      console.log(`     Found ${matchedPatterns.length} implementation(s)`);
    } else if (feature.required) {
      allCriticalPresent = false;
      console.log(`     ⚠️  MISSING - This was working on July 8th!`);
    }
    
    console.log('');
  });
  
  // Check for any potentially problematic patterns
  console.log('🔍 Potential Issues Check:');
  console.log('==========================\n');
  
  const potentialIssues = [
    {
      name: 'Hard-coded values',
      pattern: /localhost|127\.0\.0\.1|8080|3000/g,
      issue: 'Should use environment variables'
    },
    {
      name: 'Console logs in production',
      pattern: /console\.log/g,
      issue: 'Should be removed for production'
    },
    {
      name: 'TODO comments',
      pattern: /TODO|FIXME|HACK/gi,
      issue: 'Unfinished work'
    },
    {
      name: 'Commented out code',
      pattern: /\/\*[\s\S]*?\*\/|\/\/.*\n/g,
      issue: 'Should be cleaned up'
    }
  ];
  
  potentialIssues.forEach(issue => {
    const matches = content.match(issue.pattern);
    const count = matches ? matches.length : 0;
    
    if (count > 0) {
      console.log(`⚠️  ${issue.name}: ${count} occurrences - ${issue.issue}`);
    } else {
      console.log(`✅ ${issue.name}: Clean`);
    }
  });
  
  console.log('\n📈 Dashboard Health Summary:');
  console.log('============================');
  console.log(`Total lines: ${content.split('\n').length}`);
  console.log(`Total imports: ${(content.match(/import\s+/g) || []).length}`);
  console.log(`Feature implementations: ${featureCount}`);
  console.log(`Critical features: ${allCriticalPresent ? 'All present ✅' : 'Some missing ❌'}`);
  
  if (allCriticalPresent) {
    console.log('\n🎉 SUCCESS: Dashboard appears to have all features from July 8th working deployment!');
    console.log('✅ Ready for production build and deployment');
  } else {
    console.log('\n⚠️  WARNING: Some critical features from July 8th deployment may be missing');
    console.log('🔧 Review and restore missing functionality before deployment');
  }
  
} else {
  console.log('❌ Dashboard file not found!');
}

// Check build output size and structure
console.log('\n📦 Build Output Analysis:');
console.log('=========================');

if (fs.existsSync('dist')) {
  const distFiles = fs.readdirSync('dist', { recursive: true });
  const jsFiles = distFiles.filter(f => f.endsWith('.js'));
  const cssFiles = distFiles.filter(f => f.endsWith('.css'));
  
  console.log(`JavaScript files: ${jsFiles.length}`);
  console.log(`CSS files: ${cssFiles.length}`);
  console.log(`Total files: ${distFiles.length}`);
  
  // Check critical files exist in build
  const criticalBuildFiles = ['index.html', 'aws-exports.js'];
  criticalBuildFiles.forEach(file => {
    const exists = fs.existsSync(`dist/${file}`);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
  });
  
} else {
  console.log('⚠️  No build output found - run `pnpm build` first');
}
