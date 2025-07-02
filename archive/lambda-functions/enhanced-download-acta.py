import json
import boto3
import os
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Enhanced Download ACTA Lambda Function
    Handles document downloads with S3 signed URLs
    """
    try:
        logger.info(f"Download request: {json.dumps(event)}")
        
        # Extract parameters
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        
        project_id = path_parameters.get('id', 'unknown')
        format_type = query_parameters.get('format', 'pdf')
        
        logger.info(f"Download request for project {project_id}, format: {format_type}")
        
        # S3 configuration
        s3_bucket = os.environ.get('S3_BUCKET', 'projectplace-dv-2025-x9a7b')
        s3_key = f'acta/{project_id}.{format_type}'
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        try:
            # Check if object exists
            s3_client.head_object(Bucket=s3_bucket, Key=s3_key)
            
            # Generate signed URL for download
            signed_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': s3_bucket, 'Key': s3_key},
                ExpiresIn=3600  # 1 hour
            )
            
            logger.info(f"Generated signed URL for {s3_key}")
            
            # Return 302 redirect to signed URL
            return {
                'statusCode': 302,
                'headers': {
                    'Location': signed_url,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                }
            }
            
        except s3_client.exceptions.NoSuchKey:
            logger.warning(f"Document not found: {s3_key}")
            
            # Document doesn't exist - trigger generation first
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Document not found',
                    'project_id': project_id,
                    'format': format_type,
                    'message': 'Document needs to be generated first',
                    'suggestion': 'Use the Generate ACTA button first'
                })
            }
            
        except Exception as s3_error:
            logger.error(f"S3 error: {str(s3_error)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'S3 access error',
                    'details': str(s3_error)
                })
            }
            
    except Exception as e:
        logger.error(f"Error in download ACTA handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }
