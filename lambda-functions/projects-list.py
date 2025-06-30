import json
import boto3
import os
from datetime import datetime
import logging
from boto3.dynamodb.conditions import Key
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB Configuration
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'ProjectPlace_DataExtrator_landing_table_v2')
DYNAMODB_REGION = os.environ.get('AWS_REGION', 'us-east-2')

def lambda_handler(event, context):
    """
    Simple Projects List Lambda Function
    Handles: GET /projects
    
    Returns a simplified list of all projects from DynamoDB
    """
    try:
        # Parse request details
        method = event.get('httpMethod', 'GET')
        query_parameters = event.get('queryStringParameters') or {}
        
        logger.info(f"Request: {method} /projects")
        
        if method != 'GET':
            return create_response(405, {'error': 'Method not allowed'})
        
        # Get projects from DynamoDB
        projects = get_all_projects_simple()
        
        return create_response(200, {
            'projects': projects,
            'count': len(projects),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'details': str(e)})

def get_all_projects_simple():
    """Get a simplified list of all projects from DynamoDB"""
    try:
        dynamodb = boto3.resource('dynamodb', region_name=DYNAMODB_REGION)
        table = dynamodb.Table(DYNAMODB_TABLE)
        
        # Scan the table for all items
        response = table.scan()
        items = response.get('Items', [])
        
        # Handle pagination if needed
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))
        
        # Convert to simplified format
        projects = []
        for item in items:
            # Convert Decimal objects to float/int for JSON serialization
            project = convert_decimals(item)
            
            # Extract key fields for simplified view
            simplified_project = {
                'projectId': project.get('projectId', ''),
                'projectName': project.get('projectName', ''),
                'pmEmail': project.get('pmEmail', ''),
                'projectManager': project.get('projectManager', ''),
                'status': project.get('status', 'unknown'),
                'lastUpdated': project.get('lastUpdated', ''),
                'timeline': project.get('timeline', {}),
                'documentStatus': project.get('documentStatus', {})
            }
            projects.append(simplified_project)
        
        logger.info(f"Retrieved {len(projects)} projects from DynamoDB")
        return projects
        
    except Exception as e:
        logger.error(f"Error retrieving projects from DynamoDB: {str(e)}")
        raise

def convert_decimals(obj):
    """Convert DynamoDB Decimal objects to regular Python numbers"""
    if isinstance(obj, list):
        return [convert_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    else:
        return obj

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
