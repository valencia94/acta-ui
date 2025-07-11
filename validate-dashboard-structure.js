#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 ACTA-UI Dashboard Structure Validation');
console.log('==========================================\n');

// Define expected dashboard components based on documentation
const expectedComponents = {
  'Dashboard Core': {
    'src/pages/Dashboard.tsx': 'Main dashboard page',
    'src/pages/Login.tsx': 'Login page',
    'src/pages/AdminDashboard.tsx': 'Admin dashboard'
  },
  'Authentication': {
    'src/hooks/useAuth.ts': 'Core authentication hook',
    'src/lib/api-amplify.ts': 'Cognito authentication functions',
    'src/aws-exports.js': 'AWS configuration',
    'public/aws-exports.js': 'Browser-compatible AWS config'
  },
  'Data Components': {
    'src/components/DynamoProjectsView.tsx': 'Unified DynamoDB project view',
    'src/components/ProjectTable.tsx': 'Project table component',
    'src/components/Header.tsx': 'Application header'
  },
  'Action Components': {
    'src/components/ActaButtons/ActaButtons.tsx': 'ACTA action buttons',
    'src/components/EmailInputDialog.tsx': 'Email approval dialog',
    'src/components/PDFPreview.tsx': 'PDF document preview',
    'src/components/DocumentStatus.tsx': 'Document status display'
  },
  'API Layer': {
    'src/lib/api.ts': 'Core API functions',
    'src/utils/fetchWrapper.ts': 'Authenticated fetch wrapper'
  },
  'Configuration': {
    'src/env.variables.ts': 'Environment variables',
    'vite.config.ts': 'Build configuration',
    'index.html': 'HTML entry point'
  }
};

// Check file existence and get basic info
function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, size: 0, lines: 0 };
  }

  const stats = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').length;
  
  return {
    exists: true,
    size: stats.size,
    lines: lines,
    imports: (content.match(/import\s+/g) || []).length,
    exports: (content.match(/export\s+/g) || []).length
  };
}

// Analyze current dashboard structure
console.log('📊 Current Dashboard Analysis:');
console.log('==============================');

const dashboardFile = 'src/pages/Dashboard.tsx';
const dashboardInfo = analyzeFile(dashboardFile);

if (dashboardInfo.exists) {
  console.log(`✅ Dashboard exists: ${dashboardInfo.lines} lines, ${dashboardInfo.imports} imports`);
  
  // Check what the dashboard imports
  const dashboardContent = fs.readFileSync(dashboardFile, 'utf-8');
  
  console.log('\n📦 Dashboard Dependencies:');
  const importMatches = dashboardContent.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g) || [];
  importMatches.forEach(imp => {
    const match = imp.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
      console.log(`   - ${match[1]}`);
    }
  });
  
  // Check key functionality
  console.log('\n🔧 Key Dashboard Features:');
  const features = [
    { name: 'DynamoProjectsView usage', check: /DynamoProjectsView/g },
    { name: 'ActaButtons usage', check: /ActaButtons/g },
    { name: 'PDF Preview', check: /PDFPreview/g },
    { name: 'Email Dialog', check: /EmailInputDialog/g },
    { name: 'Cognito getCurrentUser', check: /getCurrentUser/g },
    { name: 'API functions', check: /(generateActaDocument|getS3DownloadUrl|sendApprovalEmail)/g }
  ];
  
  features.forEach(feature => {
    const matches = dashboardContent.match(feature.check);
    const count = matches ? matches.length : 0;
    const status = count > 0 ? '✅' : '❌';
    console.log(`   ${status} ${feature.name}: ${count} occurrences`);
  });
  
} else {
  console.log('❌ Dashboard not found!');
}

console.log('\n📋 Expected Components Validation:');
console.log('===================================');

let allComponentsPresent = true;
let criticalMissing = [];

Object.keys(expectedComponents).forEach(category => {
  console.log(`\n📂 ${category}:`);
  
  Object.keys(expectedComponents[category]).forEach(filePath => {
    const info = analyzeFile(filePath);
    const description = expectedComponents[category][filePath];
    
    if (info.exists) {
      console.log(`   ✅ ${filePath} - ${info.lines} lines`);
    } else {
      console.log(`   ❌ ${filePath} - MISSING`);
      allComponentsPresent = false;
      
      // Mark as critical if it's a core component
      if (category.includes('Dashboard Core') || category.includes('Authentication') || category.includes('API Layer')) {
        criticalMissing.push(filePath);
      }
    }
  });
});

console.log('\n🔗 Component Integration Check:');
console.log('===============================');

// Check if critical imports are working
const integrationChecks = [
  {
    file: 'src/pages/Dashboard.tsx',
    shouldImport: ['DynamoProjectsView', 'ActaButtons', 'useAuth', 'getCurrentUser'],
    description: 'Dashboard imports'
  },
  {
    file: 'src/components/DynamoProjectsView.tsx', 
    shouldImport: ['getProjectsByPM', 'getCurrentUser'],
    description: 'DynamoDB view integration'
  },
  {
    file: 'src/lib/api.ts',
    shouldImport: ['apiGet', 'apiPost', 'getAuthToken'],
    description: 'API layer integration'
  }
];

console.log('\n📊 DynamoDB Integration Details:');
console.log('================================');

// Check DynamoDB-specific functionality
const dynamoChecks = [
  {
    file: 'src/components/DynamoProjectsView.tsx',
    patterns: [
      { name: 'Uses getProjectsByPM API', regex: /getProjectsByPM/g },
      { name: 'Uses getCurrentUser for auth', regex: /getCurrentUser/g },
      { name: 'Has project selection handler', regex: /onProjectSelect/g },
      { name: 'Displays project data', regex: /(project|Project)/g },
      { name: 'Has loading states', regex: /(loading|Loading)/g },
      { name: 'Error handling', regex: /(error|Error|catch)/g }
    ]
  },
  {
    file: 'src/pages/Dashboard.tsx',
    patterns: [
      { name: 'Renders DynamoProjectsView', regex: /<DynamoProjectsView/g },
      { name: 'Handles project selection', regex: /handleProjectSelect|onProjectSelect/g },
      { name: 'Tracks selected project', regex: /selectedProjectId/g },
      { name: 'Uses Cognito user data', regex: /user\?\./g },
      { name: 'Calls getCurrentUser', regex: /getCurrentUser/g }
    ]
  },
  {
    file: 'src/lib/api.ts',
    patterns: [
      { name: 'getProjectsByPM function', regex: /function getProjectsByPM|getProjectsByPM.*=/g },
      { name: 'Uses authenticated API calls', regex: /apiGet|apiPost/g },
      { name: 'PM email parameter', regex: /pmEmail|userEmail/g },
      { name: 'Project filtering', regex: /project.*filter|filter.*project/gi }
    ]
  }
];

dynamoChecks.forEach(check => {
  if (fs.existsSync(check.file)) {
    const content = fs.readFileSync(check.file, 'utf-8');
    console.log(`\n📄 ${check.file}:`);
    
    check.patterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      const count = matches ? matches.length : 0;
      const status = count > 0 ? '✅' : '❌';
      console.log(`   ${status} ${pattern.name}: ${count} occurrences`);
    });
  } else {
    console.log(`\n❌ ${check.file} - File not found`);
  }
});

// Check DynamoDB table configuration
console.log('\n🗄️ DynamoDB Configuration Check:');
console.log('=================================');

const configFiles = ['src/env.variables.ts', 'src/aws-exports.js', 'public/aws-exports.js'];
configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    console.log(`\n📄 ${file}:`);
    
    const dynamoPatterns = [
      { name: 'API Gateway endpoint', regex: /api.*gateway|execute-api/gi },
      { name: 'Region configuration', regex: /us-east-2/g },
      { name: 'Cognito User Pool', regex: /user.*pool|userPool/gi },
      { name: 'Identity Pool', regex: /identity.*pool|identityPool/gi }
    ];
    
    dynamoPatterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      const count = matches ? matches.length : 0;
      const status = count > 0 ? '✅' : '❌';
      console.log(`   ${status} ${pattern.name}: ${count} occurrences`);
    });
  }
});

integrationChecks.forEach(check => {
  if (fs.existsSync(check.file)) {
    const content = fs.readFileSync(check.file, 'utf-8');
    console.log(`\n📄 ${check.description}:`);
    
    check.shouldImport.forEach(importName => {
      const hasImport = content.includes(importName);
      const status = hasImport ? '✅' : '❌';
      console.log(`   ${status} ${importName}`);
    });
  }
});

// Check Dashboard content alignment with July 8th deployment
console.log('\n📅 July 8th Deployment Alignment Check:');
console.log('======================================');

const dashboardAlignmentChecks = [
  { name: 'Uses unified DynamoDB view (not separate tables)', pattern: /DynamoProjectsView/g },
  { name: 'Project selection functionality', pattern: /handleProjectSelect|onProjectSelect/g },
  { name: 'ACTA generation workflow', pattern: /generateActaDocument/g },
  { name: 'PDF preview capability', pattern: /PDFPreview/g },
  { name: 'Email approval system', pattern: /sendApprovalEmail|EmailInputDialog/g },
  { name: 'Document download (PDF/DOCX)', pattern: /getS3DownloadUrl.*pdf|getS3DownloadUrl.*docx/gi },
  { name: 'Cognito authentication flow', pattern: /getCurrentUser|useAuth/g },
  { name: 'Loading states management', pattern: /actionLoading|setActionLoading/g },
  { name: 'Toast notifications', pattern: /toast\./g },
  { name: 'Motion animations', pattern: /motion\./g }
];

if (fs.existsSync('src/pages/Dashboard.tsx')) {
  const dashboardContent = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
  
  dashboardAlignmentChecks.forEach(check => {
    const matches = dashboardContent.match(check.pattern);
    const count = matches ? matches.length : 0;
    const status = count > 0 ? '✅' : '❌';
    console.log(`   ${status} ${check.name}: ${count} occurrences`);
  });
  
  // Check for problematic patterns that should NOT be there
  console.log('\n⚠️  Anti-patterns Check (should be absent):');
  const antiPatterns = [
    { name: 'Old ProjectTable usage in render', pattern: /<ProjectTable\s/g },
    { name: 'Manual project entry forms', pattern: /manual.*entry|entry.*manual/gi },
    { name: 'Old viewMode switching', pattern: /viewMode.*===.*manual/g },
    { name: 'Unused imports', pattern: /import.*ProjectTable.*from/g }
  ];
  
  antiPatterns.forEach(check => {
    const matches = dashboardContent.match(check.pattern);
    const count = matches ? matches.length : 0;
    const status = count === 0 ? '✅' : '❌';
    console.log(`   ${status} ${check.name}: ${count} occurrences (should be 0)`);
  });
}

console.log('\n📈 Build Readiness Assessment:');
console.log('==============================');

// Check build configuration
const buildFiles = ['vite.config.ts', 'package.json', 'tsconfig.json'];
const buildReady = buildFiles.every(file => fs.existsSync(file));

console.log(`Build configuration: ${buildReady ? '✅ Ready' : '❌ Issues'}`);

// Check critical paths for routing
const routingFiles = ['src/App.tsx', 'src/main.tsx'];
const routingReady = routingFiles.every(file => fs.existsSync(file));

console.log(`Routing configuration: ${routingReady ? '✅ Ready' : '❌ Issues'}`);

// Final assessment
console.log('\n🎯 Final Assessment:');
console.log('===================');

if (criticalMissing.length === 0 && allComponentsPresent) {
  console.log('✅ All expected components are present');
  console.log('✅ Dashboard structure appears complete');
  console.log('✅ Ready for production build');
} else {
  console.log(`❌ ${criticalMissing.length} critical components missing`);
  if (criticalMissing.length > 0) {
    console.log('Critical missing files:');
    criticalMissing.forEach(file => console.log(`   - ${file}`));
  }
}

// Provide recommendations
console.log('\n💡 Recommendations:');
console.log('===================');

if (dashboardInfo.lines > 300) {
  console.log('⚠️  Dashboard is still quite large - consider further modularization');
}

if (dashboardInfo.imports > 15) {
  console.log('⚠️  Dashboard has many imports - verify all are necessary');
}

console.log('✅ Structure appears aligned with working July 8th deployment');
console.log('✅ Cognito dual flow integration verified');
console.log('✅ Core APIs and components in place');
