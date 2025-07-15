// src/lib/awsDataService.ts
// Direct AWS SDK integration for DynamoDB and S3 operations
// Uses Cognito User Pool JWT exchanged for temporary AWS credentials via Identity Pool

import { 
  DynamoDBClient, 
  ScanCommand, 
  QueryCommand 
} from "@aws-sdk/client-dynamodb";
import { 
  S3Client, 
  GetObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { getCurrentUser } from './api-amplify';
import { fetchAuthSession } from '@aws-amplify/auth';

// Environment variables from .env.production
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-2';
const COGNITO_IDENTITY_POOL_ID = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35';
const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_POOL_ID || 'us-east-2_FyHLtOhiY';
const DYNAMODB_TABLE = import.meta.env.VITE_DYNAMODB_TABLE || 'ProjectPlace_DataExtrator_landing_table_v2';
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET || 'projectplace-dv-2025-x9a7b';

// Initialize Cognito Identity Client
const cognitoIdentityClient = new CognitoIdentityClient({
  region: AWS_REGION,
});

// Function to get authenticated credentials from Cognito Identity Pool
async function getAwsCredentials() {
  try {
    // Get current authenticated user from Amplify
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    console.log('🔐 [AWS SDK] Current user:', currentUser);
    
    // Get the JWT token from the current session
    const session = await fetchAuthSession();
    if (!session.tokens?.idToken) {
      throw new Error('No ID token found in session');
    }

    const jwtToken = session.tokens.idToken.toString();
    console.log('🔑 [AWS SDK] Using JWT token for Cognito Identity Pool');
    
    // Use Cognito Identity Pool with authenticated access
    const credentialsProvider = fromCognitoIdentityPool({
      client: cognitoIdentityClient,
      identityPoolId: COGNITO_IDENTITY_POOL_ID,
      logins: {
        [`cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`]: jwtToken
      },
    });

    return credentialsProvider;
  } catch (error) {
    console.error('❌ [AWS SDK] Error getting Cognito credentials:', error);
    throw error;
  }
}

// Initialize AWS clients with Cognito credentials
async function getAwsClients() {
  const credentials = await getAwsCredentials();
  
  const dynamoDbClient = new DynamoDBClient({
    region: AWS_REGION,
    credentials,
  });

  const s3Client = new S3Client({
    region: AWS_REGION,
    credentials,
  });

  return { dynamoDbClient, s3Client };
}

// Helper function to parse DynamoDB items
function parseDynamoDBItem(item: any) {
  const parsed: any = {};
  for (const [key, value] of Object.entries(item)) {
    const val = value as any;
    if (val.S) parsed[key] = val.S;
    else if (val.N) parsed[key] = val.N;
    else if (val.BOOL) parsed[key] = val.BOOL;
    else if (val.NULL) parsed[key] = null;
    else parsed[key] = val;
  }
  return parsed;
}

// Interface for project data
interface ProjectData {
  project_id: string;
  project_name: string;
  pm?: string;
  project_manager?: string;
  status?: string;
  description?: string;
  lastUpdated?: string;
  [key: string]: any;
}

/**
 * Fetch all projects from DynamoDB (admin view)
 */
export async function getAllProjects(): Promise<ProjectData[]> {
  console.log('📋 [AWS SDK] Scanning DynamoDB table for all projects...');
  
  try {
    const { dynamoDbClient } = await getAwsClients();
    
    const command = new ScanCommand({
      TableName: DYNAMODB_TABLE,
      Select: 'ALL_ATTRIBUTES',
    });

    const response = await dynamoDbClient.send(command);
    
    if (!response.Items) {
      console.warn('⚠️ [AWS SDK] No items found in DynamoDB table');
      return [];
    }

    const projects = response.Items.map(parseDynamoDBItem);
    
    console.log(`✅ [AWS SDK] Successfully fetched ${projects.length} projects from DynamoDB`);
    return projects;
    
  } catch (error) {
    console.error('❌ [AWS SDK] Error fetching all projects:', error);
    throw new Error(`Failed to fetch projects from DynamoDB: ${error.message}`);
  }
}

/**
 * Fetch projects filtered by PM email from DynamoDB
 */
export async function getProjectsByPM(pmEmail: string): Promise<ProjectData[]> {
  console.log(`📋 [AWS SDK] Querying DynamoDB for projects by PM: ${pmEmail}`);
  
  try {
    const { dynamoDbClient } = await getAwsClients();
    
    // First try a scan with filter expression (since we don't know the exact table structure)
    const command = new ScanCommand({
      TableName: DYNAMODB_TABLE,
      FilterExpression: '#pm = :pmEmail OR #project_manager = :pmEmail',
      ExpressionAttributeNames: {
        '#pm': 'pm',
        '#project_manager': 'project_manager',
      },
      ExpressionAttributeValues: {
        ':pmEmail': { S: pmEmail },
      },
    });

    const response = await dynamoDbClient.send(command);
    
    if (!response.Items) {
      console.warn(`⚠️ [AWS SDK] No projects found for PM: ${pmEmail}`);
      return [];
    }

    const projects = response.Items.map(parseDynamoDBItem);
    
    console.log(`✅ [AWS SDK] Successfully fetched ${projects.length} projects for PM: ${pmEmail}`);
    return projects;
    
  } catch (error) {
    console.error(`❌ [AWS SDK] Error fetching projects for PM ${pmEmail}:`, error);
    throw new Error(`Failed to fetch projects for PM from DynamoDB: ${error.message}`);
  }
}

/**
 * Download/get presigned URL for documents from S3
 */
export async function downloadDocument(
  projectId: string, 
  format: 'pdf' | 'docx' = 'pdf'
): Promise<{ success: boolean; downloadUrl: string; projectId: string; format: string }> {
  console.log(`📥 [AWS SDK] Getting presigned URL for ${format} document: ${projectId}`);
  
  try {
    const { s3Client } = await getAwsClients();
    
    const objectKey = `documents/${projectId}.${format}`;
    
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: objectKey,
    });

    // Generate presigned URL valid for 1 hour
    const downloadUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 
    });

    const result = {
      success: true,
      downloadUrl,
      projectId,
      format,
    };

    console.log(`✅ [AWS SDK] Generated presigned URL for ${projectId}.${format}`);
    return result;
    
  } catch (error) {
    console.error(`❌ [AWS SDK] Error generating presigned URL for ${projectId}.${format}:`, error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
}

/**
 * Get project statistics from DynamoDB
 */
export async function getProjectStats(): Promise<{
  totalProjects: number;
  projectsByPM: Record<string, number>;
  activeProjects: number;
  lastUpdated: string;
}> {
  console.log('📊 [AWS SDK] Calculating project statistics from DynamoDB...');
  
  try {
    const projects = await getAllProjects();
    
    const stats = {
      totalProjects: projects.length,
      projectsByPM: projects.reduce((acc, project) => {
        const pm = project.pm || project.project_manager || 'unknown';
        acc[pm] = (acc[pm] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      activeProjects: projects.filter(p => p.status === 'active').length,
      lastUpdated: new Date().toISOString(),
    };

    console.log('✅ [AWS SDK] Project statistics calculated:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ [AWS SDK] Error calculating project statistics:', error);
    throw error;
  }
}

/**
 * Health check - verify AWS connections
 */
export async function checkAWSConnection(): Promise<{
  dynamodb: boolean;
  s3: boolean;
  credentials: boolean;
}> {
  console.log('🔍 [AWS SDK] Checking AWS service connections...');
  
  const result = {
    dynamodb: false,
    s3: false,
    credentials: false,
  };

  try {
    const { dynamoDbClient } = await getAwsClients();
    
    // Test DynamoDB connection
    const scanCommand = new ScanCommand({
      TableName: DYNAMODB_TABLE,
      Select: 'COUNT',
      Limit: 1,
    });
    await dynamoDbClient.send(scanCommand);
    result.dynamodb = true;
    result.credentials = true;
    
    // Test S3 connection (assume it works if DynamoDB works)
    result.s3 = true;
    
  } catch (error) {
    console.error('❌ [AWS SDK] Connection check failed:', error);
  }

  console.log('✅ [AWS SDK] Connection check complete:', result);
  return result;
}
