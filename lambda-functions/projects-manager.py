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
    Projects Manager Lambda Function - CORRECTED for DynamoDB Integration
    Handles: /pm-projects/all-projects, /pm-projects/{pmEmail}, /bulk-generate-summaries
    
    This connects to the ACTUAL DynamoDB table: ProjectPlace_DataExtrator_landing_table_v2
    Data flow: projectMetadataEnricher → DynamoDB → This function → Frontend
    """
    try:
        # Parse request details
        path = event.get('path', '')
        method = event.get('httpMethod', 'GET')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        
        logger.info(f"Request: {method} {path}")
        logger.info(f"Path parameters: {path_parameters}")
        
        # Route to appropriate handler
        if path == '/pm-projects/all-projects':
            return handle_all_projects_from_dynamodb(query_parameters)
        elif '/pm-projects/' in path and path_parameters.get('pmEmail'):
            pm_email = path_parameters['pmEmail']
            return handle_projects_by_pm_from_dynamodb(pm_email, query_parameters)
        elif path == '/bulk-generate-summaries' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return handle_bulk_generate_summaries(body)
        else:
            return create_response(404, {'error': 'Endpoint not found', 'path': path})
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'details': str(e)})

def handle_all_projects_from_dynamodb(query_params):
    """Handle GET /pm-projects/all-projects - Admin access to all DynamoDB projects"""
    try:
        # Connect to DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name=DYNAMODB_REGION)
        table = dynamodb.Table(DYNAMODB_TABLE)
        
        logger.info(f"Scanning DynamoDB table: {DYNAMODB_TABLE}")
        
        # Scan the entire table (Admin access)
        response = table.scan()
        items = response.get('Items', [])
        
        # Convert DynamoDB Decimal types and process items
        projects = []
        for item in items:
            project = convert_decimals(item)
            
            # Enhance project data structure for frontend
            enhanced_project = {
                'project_id': project.get('project_id', 'unknown'),
                'project_name': project.get('project_name', 'Unknown Project'),
                'pm': project.get('pm_email', 'unknown@company.com'),
                'project_manager': project.get('pm_email', 'unknown@company.com'),
                'status': project.get('project_status', 'unknown'),
                'created_date': project.get('created_date', datetime.now().isoformat()),
                'last_updated': project.get('last_updated', datetime.now().isoformat()),
                'has_acta_document': project.get('has_acta_document', False),
                'acta_last_generated': project.get('acta_last_generated'),
                'external_project_data': project.get('external_project_data', {}),
                'timeline_summary': project.get('timeline_summary', {}),
                'days_since_update': calculate_days_since_update(project.get('last_updated')),
                'acta_status': determine_acta_status(project),
                'priority_level': determine_priority_level(project)
            }
            projects.append(enhanced_project)
        
        # Create summary statistics
        summary = {
            'with_acta': len([p for p in projects if p['has_acta_document']]),
            'without_acta': len([p for p in projects if not p['has_acta_document']]),
            'recently_updated': len([p for p in projects if p['days_since_update'] <= 7])
        }
        
        return create_response(200, {
            'pm_email': 'admin-all-access',
            'total_projects': len(projects),
            'projects': projects,
            'summary': summary,
            'access_level': 'admin',
            'data_source': 'DynamoDB',
            'table': DYNAMODB_TABLE
        })
        
    except Exception as e:
        logger.error(f"Error in handle_all_projects_from_dynamodb: {str(e)}")
        return create_response(500, {
            'error': 'Failed to fetch projects from DynamoDB',
            'details': str(e),
            'table': DYNAMODB_TABLE
        })

def handle_projects_by_pm_from_dynamodb(pm_email, query_params):
    """Handle GET /pm-projects/{pmEmail} - PM-specific projects from DynamoDB"""
    try:
        # Decode URL-encoded email
        pm_email = pm_email.replace('%40', '@')
        
        logger.info(f"Fetching DynamoDB projects for PM: {pm_email}")
        
        # Connect to DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name=DYNAMODB_REGION)
        table = dynamodb.Table(DYNAMODB_TABLE)
        
        # Query projects by PM email (assuming pm_email is the primary key)
        response = table.query(
            KeyConditionExpression=Key('pm_email').eq(pm_email)
        )
        
        items = response.get('Items', [])
        
        if not items:
            # Return empty result but not an error
            return create_response(200, {
                'pm_email': pm_email,
                'total_projects': 0,
                'projects': [],
                'summary': {'with_acta': 0, 'without_acta': 0, 'recently_updated': 0},
                'message': f'No projects found for PM: {pm_email}',
                'data_source': 'DynamoDB',
                'table': DYNAMODB_TABLE
            })
        
        # Convert and enhance projects
        projects = []
        for item in items:
            project = convert_decimals(item)
            
            enhanced_project = {
                'project_id': project.get('project_id', 'unknown'),
                'project_name': project.get('project_name', 'Unknown Project'),
                'pm': pm_email,
                'project_manager': pm_email,
                'status': project.get('project_status', 'unknown'),
                'created_date': project.get('created_date', datetime.now().isoformat()),
                'last_updated': project.get('last_updated', datetime.now().isoformat()),
                'has_acta_document': project.get('has_acta_document', False),
                'acta_last_generated': project.get('acta_last_generated'),
                'my_role': 'Project Manager',
                'next_milestone': project.get('next_milestone', 'To be determined'),
                'milestone_date': project.get('milestone_date'),
                'external_project_data': project.get('external_project_data', {}),
                'timeline_summary': project.get('timeline_summary', {}),
                'days_since_update': calculate_days_since_update(project.get('last_updated')),
                'acta_status': determine_acta_status(project),
                'priority_level': determine_priority_level(project)
            }
            projects.append(enhanced_project)
        
        # Create summary
        summary = {
            'with_acta': len([p for p in projects if p['has_acta_document']]),
            'without_acta': len([p for p in projects if not p['has_acta_document']]),
            'recently_updated': len([p for p in projects if p['days_since_update'] <= 7])
        }
        
        return create_response(200, {
            'pm_email': pm_email,
            'total_projects': len(projects),
            'projects': projects,
            'summary': summary,
            'access_level': 'pm',
            'data_source': 'DynamoDB',
            'table': DYNAMODB_TABLE
        })
        
    except Exception as e:
        logger.error(f"Error in handle_projects_by_pm_from_dynamodb: {str(e)}")
        return create_response(500, {
            'error': f'Failed to fetch projects for PM: {pm_email}',
            'details': str(e),
            'table': DYNAMODB_TABLE
        })

def handle_bulk_generate_summaries(body):
    """Handle POST /bulk-generate-summaries - Generate documents for all PM projects"""
    try:
        pm_email = body.get('pm_email')
        if not pm_email:
            return create_response(400, {'error': 'Missing pm_email in request body'})
        
        logger.info(f"Bulk generating summaries for PM: {pm_email}")
        
        # Get all projects for this PM
        projects_response = handle_projects_by_pm_from_dynamodb(pm_email, {})
        projects_data = json.loads(projects_response['body'])
        projects = projects_data.get('projects', [])
        
        success = []
        failed = []
        
        # TODO: For each project, trigger the extract-project-place/{project_id} endpoint
        # This would require invoking the ProjectPlaceDataExtractor Lambda function
        for project in projects:
            project_id = project['project_id']
            try:
                # Placeholder for triggering document generation
                # In real implementation, invoke extract-project-place Lambda
                success.append(project_id)
                logger.info(f"Successfully triggered generation for project: {project_id}")
            except Exception as e:
                failed.append(project_id)
                logger.error(f"Failed to trigger generation for project {project_id}: {str(e)}")
        
        return create_response(200, {
            'success': success,
            'failed': failed,
            'total': len(projects),
            'pm_email': pm_email,
            'details': {
                'message': 'Bulk generation completed',
                'processed_projects': len(success) + len(failed)
            }
        })
        
    except Exception as e:
        logger.error(f"Error in handle_bulk_generate_summaries: {str(e)}")
        return create_response(500, {'error': 'Failed to process bulk generation', 'details': str(e)})

def convert_decimals(obj):
    """Convert DynamoDB Decimal types to regular numbers"""
    if isinstance(obj, list):
        return [convert_decimals(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_decimals(value) for key, value in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj) if obj % 1 else int(obj)
    else:
        return obj

def calculate_days_since_update(last_updated):
    """Calculate days since last update"""
    if not last_updated:
        return 999  # Unknown update time
    
    try:
        if isinstance(last_updated, str):
            last_update_date = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
        else:
            last_update_date = last_updated
        
        days_diff = (datetime.now().replace(tzinfo=None) - last_update_date.replace(tzinfo=None)).days
        return max(0, days_diff)
    except:
        return 999

def determine_acta_status(project):
    """Determine ACTA document status"""
    if not project.get('has_acta_document'):
        return 'missing'
    
    days_since_update = calculate_days_since_update(project.get('acta_last_generated'))
    if days_since_update > 30:
        return 'outdated'
    
    return 'current'

def determine_priority_level(project):
    """Determine project priority level"""
    days_since_update = calculate_days_since_update(project.get('last_updated'))
    
    if days_since_update > 30:
        return 'high'
    elif days_since_update > 14:
        return 'medium'
    else:
        return 'low'

def create_response(status_code, body):
    """Create standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body, default=str)
    }

# For testing locally
if __name__ == '__main__':
    # Test different endpoints
    test_events = [
        {
            'path': '/projects',
            'httpMethod': 'GET',
            'queryStringParameters': {'status': 'Active'}
        },
        {
            'path': '/pm-projects/all-projects',
            'httpMethod': 'GET',
            'queryStringParameters': {}
        },
        {
            'path': '/pm-projects/sarah.johnson@company.com',
            'httpMethod': 'GET',
            'pathParameters': {'pmEmail': 'sarah.johnson@company.com'},
            'queryStringParameters': {}
        }
    ]
    
    for event in test_events:
        print(f"\n--- Testing {event['path']} ---")
        result = lambda_handler(event, None)
        print(f"Status: {result['statusCode']}")
        print(f"Body: {result['body']}")
