import json
import boto3
import os
from datetime import datetime
import logging
from botocore.exceptions import ClientError
import urllib.parse

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# S3 Configuration
S3_BUCKET = os.environ.get('S3_BUCKET', 'projectplace-dv-2025-x9a7b')
S3_PREFIX = os.environ.get('S3_PREFIX', 'acta-documents/')

def lambda_handler(event, context):
    """
    Download ACTA Document Lambda Function
    Handles: GET /download-acta/{projectId}?format=pdf|docx
    
    Returns a presigned URL for downloading the document from S3
    """
    try:
        # Parse request details
        method = event.get('httpMethod', 'GET')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        
        project_id = path_parameters.get('projectId')
        if not project_id:
            return create_response(400, {'error': 'Missing projectId parameter'})
        
        format_type = query_parameters.get('format', 'pdf').lower()
        if format_type not in ['pdf', 'docx']:
            return create_response(400, {'error': 'Invalid format. Must be pdf or docx'})
        
        logger.info(f"Download request for: {project_id}.{format_type}")
        
        if method != 'GET':
            return create_response(405, {'error': 'Method not allowed'})
        
        # Check if document exists and get download URL
        download_info = get_download_url(project_id, format_type)
        
        if not download_info['exists']:
            return create_response(404, {
                'error': 'Document not found',
                'projectId': project_id,
                'format': format_type
            })
        
        return create_response(200, download_info)
        
    except Exception as e:
        logger.error(f"Error processing download request: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'details': str(e)
        })

def get_download_url(project_id, format_type):
    """
    Generate a presigned URL for downloading the document from S3
    """
    try:
        s3_client = boto3.client('s3')
        
        # Construct S3 object key
        object_key = f"{S3_PREFIX}{project_id}.{format_type}"
        
        # Check if object exists
        try:
            s3_client.head_object(Bucket=S3_BUCKET, Key=object_key)
            exists = True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                exists = False
            else:
                raise
        
        if not exists:
            return {
                'exists': False,
                'projectId': project_id,
                'format': format_type
            }
        
        # Generate presigned URL (valid for 1 hour)
        download_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': object_key},
            ExpiresIn=3600  # 1 hour
        )
        
        # Get object metadata
        response = s3_client.head_object(Bucket=S3_BUCKET, Key=object_key)
        
        return {
            'exists': True,
            'projectId': project_id,
            'format': format_type,
            'downloadUrl': download_url,
            'fileName': f"{project_id}.{format_type}",
            'contentType': get_content_type(format_type),
            'size': response.get('ContentLength', 0),
            'lastModified': response.get('LastModified', '').isoformat() if response.get('LastModified') else '',
            'expiresIn': 3600,
            'expiresAt': (datetime.utcnow().timestamp() + 3600)
        }
        
    except Exception as e:
        logger.error(f"Error generating download URL: {str(e)}")
        raise

def get_content_type(format_type):
    """Get the appropriate content type for the file format"""
    content_types = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    return content_types.get(format_type, 'application/octet-stream')

def create_response(status_code, body):
    """Create a properly formatted API Gateway response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        'body': json.dumps(body, default=str)
    }
