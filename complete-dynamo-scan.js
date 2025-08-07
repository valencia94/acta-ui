// complete-dynamo-scan.js
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

// Load production environment
dotenv.config({ path: '.env.production' });

const dynamoClient = new DynamoDBClient({
  region: process.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function scanCompleteTable() {
  console.log('🔍 Starting COMPLETE DynamoDB table scan with pagination...');
  console.log(`Table: ${process.env.VITE_DYNAMODB_TABLE}`);
  console.log('=====================================\n');

  const allItems = [];
  const pmProjectCount = {};
  const pmSet = new Set();
  let lastEvaluatedKey = undefined;
  let pageCount = 0;
  let totalScanned = 0;

  do {
    pageCount++;
    console.log(`📄 Scanning page ${pageCount}...`);
    
    try {
      const response = await dynamoClient.send(new ScanCommand({
        TableName: process.env.VITE_DYNAMODB_TABLE,
        ExclusiveStartKey: lastEvaluatedKey
      }));
      
      if (response.Items && response.Items.length > 0) {
        allItems.push(...response.Items);
        totalScanned += response.Items.length;
        
        response.Items.forEach(item => {
          const pmEmail = item.pm_email?.S;
          const projectId = item.project_id?.S;
          const projectName = item.project_name?.S;
          
          if (pmEmail) {
            pmSet.add(pmEmail);
            if (!pmProjectCount[pmEmail]) {
              pmProjectCount[pmEmail] = {
                count: 0,
                projects: []
              };
            }
            
            pmProjectCount[pmEmail].count++;
            if (pmProjectCount[pmEmail].projects.length < 3) {
              pmProjectCount[pmEmail].projects.push({
                id: projectId,
                name: projectName || 'Unnamed'
              });
            }
          }
        });
        
        console.log(`   Found ${response.Items.length} items on this page`);
        console.log(`   Total items so far: ${totalScanned}`);
        console.log(`   Unique PMs found: ${pmSet.size}`);
      }
      
      lastEvaluatedKey = response.LastEvaluatedKey;
      
    } catch (error) {
      console.error('Error during scan:', error);
      break;
    }
    
  } while (lastEvaluatedKey);

  console.log('\n✅ Complete scan finished!');
  console.log('=====================');
  console.log(`Total items: ${totalScanned}`);
  console.log(`Total PMs: ${pmSet.size}`);
  console.log(`Pages scanned: ${pageCount}`);

  console.log('\n👥 PROJECT MANAGERS AND THEIR PROJECTS:');
  console.log('=====================================');
  
  // Sort PMs by project count
  Object.entries(pmProjectCount)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([email, data], index) => {
      console.log(`\n${index + 1}. ${email}`);
      console.log(`   Total Projects: ${data.count}`);
      if (data.projects.length > 0) {
        console.log('   Sample projects:');
        data.projects.forEach(p => console.log(`   - ${p.name} (${p.id})`));
      }
    });

  // Save results to file
  const report = {
    scanDate: new Date().toISOString(),
    totalItems: totalScanned,
    totalPMs: pmSet.size,
    pagesScanned: pageCount,
    pmList: Object.entries(pmProjectCount).map(([email, data]) => ({
      email,
      projectCount: data.count,
      sampleProjects: data.projects
    })).sort((a, b) => b.projectCount - a.projectCount)
  };

  console.log('\n💾 Saving complete report...');
  const fs = await import('fs/promises');
  await fs.writeFile(
    'dynamo-scan-report.json',
    JSON.stringify(report, null, 2)
  );
  console.log('Report saved to: dynamo-scan-report.json');
}

console.log('Starting DynamoDB complete scan...\n');
scanCompleteTable().catch(console.error);
node dynamo-scan.mjs

