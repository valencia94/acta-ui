// real-aws-test.js
// 🧪 Real AWS Integration Test for ACTA-UI
// This test uses actual AWS services with your production credentials

import { DynamoDBClient,ScanCommand } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand,ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// AWS Configuration from your .env.production
const AWS_CONFIG = {
  region: 'us-east-2',
  credentials: {
    accessKeyId: 'AKIA2HVQ467YILFRVJDS',
    secretAccessKey: 'njNFA3ApA8hOW2txFjIaE72pobitrfVFCyWI5pGy'
  }
};

const TEST_CONFIG = {
  dynamoTable: 'ProjectPlace_DataExtrator_landing_table_v2',
  s3Bucket: 'projectplace-dv-2025-x9a7b',
  testUsers: [
    'samirna.beltran@ikusi.com',
    'oscar.gomez@ikusi.com',
    'christian.valencia@ikusi.com'
  ]
};

class RealAWSTest {
  constructor() {
    this.dynamoClient = new DynamoDBClient(AWS_CONFIG);
    this.s3Client = new S3Client(AWS_CONFIG);
    this.results = {
      projectCounts: {},
      documentSamples: [],
      totalProjects: 0,
      errors: []
    };
  }

  async runRealTests() {
    console.log('🚀 REAL AWS INTEGRATION TEST');
    console.log('============================');
    console.log('📡 Connecting to AWS services...\n');

    try {
      // Test 1: Query actual DynamoDB for project counts
      await this.testRealProjectQueries();
      
      // Test 2: Check S3 for actual documents
      await this.testRealDocumentRetrieval();
      
      // Generate real results report
      this.generateRealReport();
      
    } catch (error) {
      console.error('❌ Real AWS test failed:', error);
      this.results.errors.push(error.message);
    }
  }

  async testRealProjectQueries() {
    console.log('📊 Testing Real DynamoDB Queries...');
    
    try {
      // Get all projects first
      const scanParams = {
        TableName: TEST_CONFIG.dynamoTable,
        Select: 'ALL_ATTRIBUTES'
      };
      
      const scanResult = await this.dynamoClient.send(new ScanCommand(scanParams));
      const allProjects = scanResult.Items || [];
      this.results.totalProjects = allProjects.length;
      
      console.log(`✅ Total projects in DynamoDB: ${allProjects.length}`);
      
      // Count projects by PM for each test user
      for (const userEmail of TEST_CONFIG.testUsers) {
        try {
          const userProjects = allProjects.filter(item => {
            const pmEmail = item.pm_email?.S || item.pm?.S || item.project_manager?.S || '';
            return pmEmail.toLowerCase() === userEmail.toLowerCase();
          });
          
          this.results.projectCounts[userEmail] = {
            count: userProjects.length,
            sampleProjects: userProjects.slice(0, 3).map(item => ({
              id: item.project_id?.S || item.id?.S || 'unknown',
              name: item.project_name?.S || item.name?.S || 'Unnamed Project',
              pm: item.pm_email?.S || item.pm?.S || 'Unknown PM',
              status: item.status?.S || 'Unknown'
            }))
          };
          
          console.log(`👤 ${userEmail}: ${userProjects.length} projects`);
          if (userProjects.length > 0) {
            const sampleName = userProjects[0].project_name?.S || userProjects[0].name?.S || 'Unnamed';
            const sampleId = userProjects[0].project_id?.S || userProjects[0].id?.S || 'unknown';
            console.log(`   Sample: "${sampleName}" (ID: ${sampleId})`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing projects for ${userEmail}:`, error.message);
          this.results.projectCounts[userEmail] = { error: error.message };
        }
      }
      
    } catch (error) {
      console.error('❌ DynamoDB query failed:', error.message);
      this.results.errors.push(`DynamoDB: ${error.message}`);
    }
  }

  async testRealDocumentRetrieval() {
    console.log('\n📄 Testing Real S3 Document Retrieval...');
    
    try {
      // List objects in S3 bucket
      const listParams = {
        Bucket: TEST_CONFIG.s3Bucket,
        MaxKeys: 100
      };
      
      const listResult = await this.s3Client.send(new ListObjectsV2Command(listParams));
      const objects = listResult.Contents || [];
      
      console.log(`✅ Found ${objects.length} objects in S3 bucket`);
      
      // Look for PDF and DOCX files
      const pdfFiles = objects.filter(obj => obj.Key?.endsWith('.pdf'));
      const docxFiles = objects.filter(obj => obj.Key?.endsWith('.docx'));
      
      console.log(`📄 PDF files: ${pdfFiles.length}`);
      console.log(`📝 DOCX files: ${docxFiles.length}`);
      
      // Generate download URLs for sample documents
      const sampleFiles = [...pdfFiles.slice(0, 3), ...docxFiles.slice(0, 3)];
      
      for (const file of sampleFiles) {
        try {
          const getObjectParams = {
            Bucket: TEST_CONFIG.s3Bucket,
            Key: file.Key
          };
          
          const url = await getSignedUrl(this.s3Client, new GetObjectCommand(getObjectParams), {
            expiresIn: 3600 // 1 hour
          });
          
          const format = file.Key.endsWith('.pdf') ? 'PDF' : 'DOCX';
          const projectId = file.Key.replace(/\.(pdf|docx)$/, '');
          
          this.results.documentSamples.push({
            projectId,
            fileName: file.Key,
            format,
            size: file.Size,
            lastModified: file.LastModified,
            downloadUrl: url
          });
          
          console.log(`✅ ${format} available: ${file.Key} (${Math.round(file.Size / 1024)}KB)`);
          
        } catch (error) {
          console.error(`❌ Error generating URL for ${file.Key}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('❌ S3 document retrieval failed:', error.message);
      this.results.errors.push(`S3: ${error.message}`);
    }
  }

  generateRealReport() {
    console.log('\n✨ REAL AWS TEST RESULTS');
    console.log('========================');
    
    // Project statistics
    console.log(`\n📊 DynamoDB Project Statistics:`);
    console.log(`   Total Projects: ${this.results.totalProjects}`);
    
    console.log('\n👥 Project Counts by User:');
    Object.entries(this.results.projectCounts).forEach(([email, data]) => {
      if (data.error) {
        console.log(`❌ ${email}: Error - ${data.error}`);
      } else {
        console.log(`✅ ${email}: ${data.count} projects`);
        if (data.sampleProjects && data.sampleProjects.length > 0) {
          console.log(`   Sample: "${data.sampleProjects[0].name}" (ID: ${data.sampleProjects[0].id})`);
        }
      }
    });
    
    // Document samples
    console.log('\n📄 Real Document Samples:');
    if (this.results.documentSamples.length > 0) {
      this.results.documentSamples.forEach(doc => {
        console.log(`✅ ${doc.format}: ${doc.fileName}`);
        console.log(`   Size: ${Math.round(doc.size / 1024)}KB | Modified: ${doc.lastModified.toLocaleDateString()}`);
        console.log(`   Download URL: ${doc.downloadUrl.substring(0, 80)}...`);
        console.log('');
      });
    } else {
      console.log('❌ No documents found in S3');
    }
    
    // Error summary
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors Encountered:');
      this.results.errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('\n✅ All AWS services responding correctly!');
    }
    
    // Final assessment
    console.log('\n🎯 REAL-WORLD ASSESSMENT:');
    const hasProjects = this.results.totalProjects > 0;
    const hasDocuments = this.results.documentSamples.length > 0;
    const hasErrors = this.results.errors.length > 0;
    
    if (hasProjects && hasDocuments && !hasErrors) {
      console.log('🎉 ACTA-UI is fully functional with real AWS data!');
      console.log('✅ Ready for production deployment and user testing');
    } else if (hasProjects && !hasErrors) {
      console.log('⚠️  ACTA-UI backend is working, but no documents found');
      console.log('💡 Consider generating sample documents for testing');
    } else {
      console.log('❌ Issues detected - review errors above');
    }
    
    console.log('\n🔗 Next Steps:');
    console.log('1. Test the web interface with real login credentials');
    console.log('2. Generate ACTA documents for sample projects');
    console.log('3. Verify email notifications are working');
    console.log('4. Deploy to production environment');
  }
}

// Run the real AWS test
const realTest = new RealAWSTest();
realTest.runRealTests().catch(console.error);
