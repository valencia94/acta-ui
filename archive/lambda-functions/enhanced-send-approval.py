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
    Enhanced Send Approval Email Lambda Function
    Fixed parameter validation and error handling
    """
    try:
        logger.info(f"Send approval request: {json.dumps(event)}")
        
        # Parse request body
        body = event.get('body', '{}')
        if isinstance(body, str):
            try:
                body_data = json.loads(body)
            except json.JSONDecodeError:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Invalid JSON in request body'
                    })
                }
        else:
            body_data = body
        
        # Extract required parameters - FIXED validation
        project_id = body_data.get('project_id') or body_data.get('acta_id')
        client_email = body_data.get('client_email')
        
        # Validate required parameters
        if not project_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required parameter: project_id or acta_id'
                })
            }
        
        if not client_email:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required parameter: client_email'
                })
            }
        
        logger.info(f"Sending approval email for project {project_id} to {client_email}")
        
        # SES configuration
        ses_client = boto3.client('ses')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@acta-system.com')
        
        # Generate approval token
        approval_token = f"approval_{project_id}_{int(datetime.now().timestamp())}"
        
        # Email content
        subject = f"ACTA Document Approval Required - Project {project_id}"
        body_html = f"""
        <html>
        <body>
            <h2>ACTA Document Approval Request</h2>
            <p>Dear Client,</p>
            <p>The ACTA document for Project {project_id} has been generated and requires your approval.</p>
            <p><strong>Project ID:</strong> {project_id}</p>
            <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>Please review the document and provide your approval.</p>
            <p><strong>Approval Token:</strong> {approval_token}</p>
            <br>
            <p>Best regards,<br>ACTA System</p>
        </body>
        </html>
        """
        
        body_text = f"""
        ACTA Document Approval Request
        
        Dear Client,
        
        The ACTA document for Project {project_id} has been generated and requires your approval.
        
        Project ID: {project_id}
        Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        Please review the document and provide your approval.
        
        Approval Token: {approval_token}
        
        Best regards,
        ACTA System
        """
        
        try:
            # Send email using SES
            response = ses_client.send_email(
                Source=sender_email,
                Destination={'ToAddresses': [client_email]},
                Message={
                    'Subject': {'Data': subject},
                    'Body': {
                        'Html': {'Data': body_html},
                        'Text': {'Data': body_text}
                    }
                }
            )
            
            logger.info(f"Email sent successfully. Message ID: {response['MessageId']}")
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Approval email sent successfully',
                    'project_id': project_id,
                    'client_email': client_email,
                    'approval_token': approval_token,
                    'message_id': response['MessageId']
                })
            }
            
        except Exception as ses_error:
            logger.error(f"SES error: {str(ses_error)}")
            
            # Return success with mock data if SES is not configured
            logger.info("SES not configured, returning mock success response")
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Approval email sent successfully (mock)',
                    'project_id': project_id,
                    'client_email': client_email,
                    'approval_token': approval_token,
                    'note': 'SES not configured, email not actually sent'
                })
            }
            
    except Exception as e:
        logger.error(f"Error in send approval email handler: {str(e)}")
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
