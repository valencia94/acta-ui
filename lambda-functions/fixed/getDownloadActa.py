import json
import logging
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# S3 Configuration
S3_BUCKET = "projectplace-dv-2025-x9a7b"

def lambda_handler(event, context):
    """
    Fixed Download ACTA Lambda - handles GET /download-acta/{id}?format=pdf|docx
    Returns S3 signed URL for document download buttons
    """
    try:
        # Extract parameters
        project_id = event.get('pathParameters', {}).get('id', 'unknown')
        format_type = event.get('queryStringParameters', {}).get('format', 'pdf')
        
        logger.info(f"Download request for project: {project_id}, format: {format_type}")
        
        # Validate format
        if format_type not in ['pdf', 'docx']:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid format. Use pdf or docx'})
            }
        
        # Generate S3 key
        s3_key = f"acta/{project_id}.{format_type}"
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        try:
            # Check if file exists
            s3_client.head_object(Bucket=S3_BUCKET, Key=s3_key)
            
            # Generate signed URL (valid for 1 hour)
            signed_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET, 'Key': s3_key},
                ExpiresIn=3600
            )
            
            # Return 302 redirect to signed URL
            return {
                'statusCode': 302,
                'headers': {
                    'Location': signed_url,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            }
            
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                # File doesn't exist
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': 'Document not found',
                        'message': f'ACTA document not available for project {project_id}',
                        'suggestion': 'Generate the document first using the Generate ACTA button'
                    })
                }
            else:
                raise e
        
    except Exception as e:
        logger.error(f"Error in getDownloadActa: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'project_id': project_id,
                'format': format_type
            })
        }
