import json
import logging
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Fixed Send Approval Email Lambda - handles POST /send-approval-email
    Sends approval email for send approval button
    """
    try:
        # Parse request body
        if event.get('body'):
            body = json.loads(event['body'])
        else:
            body = event
            
        acta_id = body.get('acta_id', 'unknown')
        client_email = body.get('client_email', '')
        
        logger.info(f"Sending approval email for ACTA: {acta_id} to: {client_email}")
        
        # Validate required fields
        if not client_email:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'Missing required field: client_email'
                })
            }
        
        # Mock email sending - replace with actual SES implementation
        email_result = {
            "message": f"Approval email sent successfully for ACTA {acta_id}",
            "token": f"approval-token-{acta_id}-{hash(client_email) % 10000}",
            "recipient": client_email,
            "acta_id": acta_id,
            "sent_at": "2025-06-29T12:00:00Z"
        }
        
        # Here you would typically use AWS SES:
        # ses_client = boto3.client('ses')
        # ses_client.send_email(...)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps(email_result)
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
        
    except Exception as e:
        logger.error(f"Error in sendApprovalEmail: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'acta_id': acta_id
            })
        }
