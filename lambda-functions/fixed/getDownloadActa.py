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
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        # Search for the actual file in S3 with the project ID pattern
        try:
            # List files in the actas/ folder that match the project ID
            response = s3_client.list_objects_v2(
                Bucket=S3_BUCKET,
                Prefix=f"actas/",
                MaxKeys=100
            )
            
            s3_key = None
            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']
                    # Check if the file contains the project ID and has the right format
                    if project_id in key and key.endswith(f'.{format_type}'):
                        s3_key = key
                        break
            
            if not s3_key:
                # If no file found, return 404
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': 'Document not found',
                        'message': f'ACTA document not available for project {project_id}',
                        'suggestion': 'Generate the document first using the Generate ACTA button'
                    })
                }
            
            # Verify the file exists (double check)
            s3_client.head_object(Bucket=S3_BUCKET, Key=s3_key)
            
            # Generate presigned URL for immediate download (more reliable)
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET, 'Key': s3_key},
                ExpiresIn=3600  # 1 hour
            )
            
            # Return 302 redirect to presigned URL
            return {
                'statusCode': 302,
                'headers': {
                    'Location': presigned_url,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                'body': json.dumps({
                    'message': 'Document found, redirecting to download',
                    'download_url': presigned_url,
                    'file_name': s3_key.split('/')[-1]
                })
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
