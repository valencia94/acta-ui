import json
import boto3
import os
from datetime import datetime
import logging
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# S3 Configuration
S3_BUCKET = os.environ.get('S3_BUCKET', 'projectplace-dv-2025-x9a7b')
S3_PREFIX = os.environ.get('S3_PREFIX', 'acta-documents/')

def lambda_handler(event, context):
    """
    Document Status Lambda Function
    Handles: GET/HEAD /check-document/{projectId}?format=pdf|docx
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
        
        logger.info(f"Checking document status: {project_id}.{format_type}")
        
        # Check document status in S3
        document_info = check_document_in_s3(project_id, format_type)
        
        if method == 'HEAD':
            # HEAD request - just return status code
            status_code = 200 if document_info['exists'] else 404
            return create_head_response(status_code, document_info)
        else:
            # GET request - return detailed information
            return create_response(200, document_info)
            
    except Exception as e:
        logger.error(f"Error checking document status: {str(e)}")
        return create_response(500, {
            'error': 'Failed to check document status',
            'details': str(e)
        })

def check_document_in_s3(project_id, format_type):
    """Check if document exists in S3 and get metadata"""
    try:
        s3_client = boto3.client('s3')
        
        # Construct S3 key
        object_key = f"{S3_PREFIX}{project_id}.{format_type}"
        
        logger.info(f"Checking S3: s3://{S3_BUCKET}/{object_key}")
        
        try:
            # Try to get object metadata
            response = s3_client.head_object(Bucket=S3_BUCKET, Key=object_key)
            
            return {
                'exists': True,
                'project_id': project_id,
                'format': format_type,
                'status': 'ready',
                'last_modified': response['LastModified'].isoformat(),
                'size': response['ContentLength'],
                'etag': response['ETag'].strip('"'),
                's3_location': f"s3://{S3_BUCKET}/{object_key}",
                'content_type': response.get('ContentType', f'application/{format_type}'),
                'metadata': response.get('Metadata', {}),
                'checked_at': datetime.now().isoformat()
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            
            if error_code == '404':
                # Document doesn't exist
                return {
                    'exists': False,
                    'project_id': project_id,
                    'format': format_type,
                    'status': 'not_found',
                    'message': f'Document {project_id}.{format_type} not found in S3',
                    's3_location': f"s3://{S3_BUCKET}/{object_key}",
                    'checked_at': datetime.now().isoformat()
                }
            elif error_code == '403':
                # Permission denied
                return {
                    'exists': False,
                    'project_id': project_id,
                    'format': format_type,
                    'status': 'access_denied',
                    'message': 'Access denied to S3 bucket',
                    'error': 'Insufficient S3 permissions',
                    'checked_at': datetime.now().isoformat()
                }
            else:
                # Other S3 error
                raise e
                
    except Exception as e:
        logger.error(f"Error checking S3: {str(e)}")
        return {
            'exists': False,
            'project_id': project_id,
            'format': format_type,
            'status': 'error',
            'message': f'Error checking document status: {str(e)}',
            'checked_at': datetime.now().isoformat()
        }

def generate_presigned_url(project_id, format_type, expiration=3600):
    """Generate presigned URL for downloading document"""
    try:
        s3_client = boto3.client('s3')
        object_key = f"{S3_PREFIX}{project_id}.{format_type}"
        
        # Check if object exists first
        try:
            s3_client.head_object(Bucket=S3_BUCKET, Key=object_key)
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return None
            raise e
        
        # Generate presigned URL
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': object_key},
            ExpiresIn=expiration
        )
        
        return presigned_url
        
    except Exception as e:
        logger.error(f"Error generating presigned URL: {str(e)}")
        return None

def create_response(status_code, body):
    """Create standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS'
        },
        'body': json.dumps(body, default=str)
    }

def create_head_response(status_code, document_info):
    """Create HEAD response (no body)"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS'
    }
    
    # Add document metadata to headers for HEAD requests
    if document_info.get('exists'):
        headers.update({
            'X-Document-Status': document_info.get('status', 'unknown'),
            'X-Document-Size': str(document_info.get('size', 0)),
            'X-Document-LastModified': document_info.get('last_modified', ''),
            'X-Document-Format': document_info.get('format', ''),
            'Content-Type': document_info.get('content_type', 'application/octet-stream')
        })
    
    return {
        'statusCode': status_code,
        'headers': headers
    }

# Enhanced version with download URL generation
def lambda_handler_with_download(event, context):
    """
    Extended version that can also generate download URLs
    Usage: GET /check-document/{projectId}?format=pdf&action=download
    """
    try:
        # Parse request details
        method = event.get('httpMethod', 'GET')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        
        project_id = path_parameters.get('projectId')
        format_type = query_parameters.get('format', 'pdf').lower()
        action = query_parameters.get('action', 'check')  # check or download
        
        if not project_id:
            return create_response(400, {'error': 'Missing projectId parameter'})
        
        # Check document status
        document_info = check_document_in_s3(project_id, format_type)
        
        if action == 'download' and document_info['exists']:
            # Generate presigned download URL
            download_url = generate_presigned_url(project_id, format_type)
            if download_url:
                document_info['download_url'] = download_url
                document_info['download_expires_in'] = 3600  # 1 hour
            else:
                document_info['download_error'] = 'Failed to generate download URL'
        
        if method == 'HEAD':
            status_code = 200 if document_info['exists'] else 404
            return create_head_response(status_code, document_info)
        else:
            return create_response(200, document_info)
            
    except Exception as e:
        logger.error(f"Error in enhanced handler: {str(e)}")
        return create_response(500, {
            'error': 'Failed to process request',
            'details': str(e)
        })

# For testing locally
if __name__ == '__main__':
    # Test different scenarios
    test_events = [
        {
            'httpMethod': 'GET',
            'pathParameters': {'projectId': 'PRJ-001'},
            'queryStringParameters': {'format': 'pdf'}
        },
        {
            'httpMethod': 'HEAD', 
            'pathParameters': {'projectId': 'PRJ-002'},
            'queryStringParameters': {'format': 'docx'}
        },
        {
            'httpMethod': 'GET',
            'pathParameters': {'projectId': 'PRJ-003'},
            'queryStringParameters': {'format': 'pdf', 'action': 'download'}
        }
    ]
    
    for event in test_events:
        project_id = event['pathParameters']['projectId']
        format_type = event['queryStringParameters']['format']
        method = event['httpMethod']
        
        print(f"\n--- Testing {method} /check-document/{project_id}?format={format_type} ---")
        result = lambda_handler(event, None)
        print(f"Status: {result['statusCode']}")
        if result.get('body'):
            print(f"Body: {result['body']}")
        else:
            print("Body: (empty - HEAD request)")
            print(f"Headers: {result.get('headers', {})}")
