import { S3Client } from '@aws-sdk/client-s3';

import { 
  awsRegion, 
} from '@/env.variables';

export const s3Client = new S3Client({
  region: awsRegion || 'us-east-2',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  }
});
