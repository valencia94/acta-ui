import json
import boto3
from botocore.exceptions import ClientError
import os

def lambda_handler(event, context):
    try:
        # Extract project ID from path parameters
        project_id = event.get('pathParameters', {}).get('project_id', 'unknown')
        
        # Extract format from query parameters
        query_params = event.get('queryStringParameters') or {}
        file_format = query_params.get('format', 'docx').lower()
        
        # Validate format
        if file_format not in ['pdf', 'docx']:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid format. Use pdf or docx'})
            }
        
        # Use frontend bucket (where CloudFront works perfectly)
        S3_BUCKET = 'acta-ui-frontend-prod'
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        try:
            # List objects in the docs/actas/ folder to find the file for this project
            response = s3_client.list_objects_v2(
                Bucket=S3_BUCKET,
                Prefix=f'docs/actas/',
                MaxKeys=1000
            )
            
            # Look for files with this project ID and format
            matching_files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']
                    if project_id in key and key.endswith(f'.{file_format}'):
                        matching_files.append(key)
            
            if not matching_files:
                # No file found, return helpful error
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': 'Document not found',
                        'message': f'ACTA document not available for project {project_id} in {file_format.upper()} format',
                        'suggestion': 'Generate the document first using the Generate ACTA button',
                        'project_id': project_id,
                        'format': file_format
                    })
                }
            
            # Use the first matching file (should be only one)
            s3_key = matching_files[0]
            
            # Generate CloudFront URL (frontend bucket works perfectly with CloudFront)
            cloudfront_domain = 'd7t9x3j66yd8k.cloudfront.net'
            cloudfront_url = f"https://{cloudfront_domain}/{s3_key}"
            
            # Return 302 redirect to CloudFront URL
            return {
                'statusCode': 302,
                'headers': {
                    'Location': cloudfront_url,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                'body': json.dumps({
                    'message': 'Document found, redirecting to download',
                    'download_url': cloudfront_url,
                    'file_key': s3_key
                })
            }
            
        except ClientError as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'Server error',
                    'message': str(e)
                })
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Unexpected error',
                'message': str(e)
            })
        }
