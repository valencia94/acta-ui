import json
import boto3
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Configuration
DYNAMODB_TABLE = "ProjectPlace_DataExtrator_landing_table_v2"
S3_BUCKET = "projectplace-dv-2025-x9a7b"
AWS_REGION = "us-east-2"

def lambda_handler(event, context):
    """
    Enhanced metadata enricher that supports PM email filtering
    Based on BACKEND_IMPLEMENTATION_GUIDE.md specifications
    """
    
    logger.info(f"Enhanced projectMetadataEnricher called with event: {json.dumps(event)}")
    
    # Extract parameters from different sources
    pm_email = event.get('pm_email')
    project_id = event.get('project_id')
    include_metadata = event.get('include_metadata', True)
    include_acta_status = event.get('include_acta_status', True)
    
    # Handle API Gateway path parameters
    if 'pathParameters' in event and event['pathParameters']:
        if 'pmEmail' in event['pathParameters']:
            pm_email = event['pathParameters']['pmEmail']
        if 'id' in event['pathParameters']:
            project_id = event['pathParameters']['id']
    
    # Handle query parameters for admin access
    if 'queryStringParameters' in event and event['queryStringParameters']:
        if event['queryStringParameters'].get('admin') == 'true':
            pm_email = 'admin-all-access'

    try:
        if pm_email:
            # New functionality: Return all projects for this PM
            logger.info(f"Getting projects for PM: {pm_email}")
            return get_projects_for_pm(pm_email, include_metadata, include_acta_status)
        elif project_id:
            # Enhanced existing functionality
            logger.info(f"Getting enriched data for project: {project_id}")
            return get_enriched_project_data(project_id, include_metadata)
        else:
            # Handle document validation requests
            if 'pathParameters' in event and 'id' in event['pathParameters']:
                project_id = event['pathParameters']['id']
                format_param = event.get('queryStringParameters', {}).get('format', 'pdf')
                return check_document_status(project_id, format_param)
            
            # Original functionality (backward compatibility)
            logger.info("Using original enricher logic")
            return original_enricher_logic(event)

    except Exception as e:
        logger.error(f"Error in enhanced projectMetadataEnricher: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'error': str(e),
                'message': 'Metadata enricher failed',
                'event_info': {
                    'pm_email': pm_email,
                    'project_id': project_id,
                    'path': event.get('path', 'unknown')
                }
            })
        }

def get_projects_for_pm(pm_email: str, include_metadata: bool, include_acta_status: bool) -> Dict:
    """Get all projects assigned to a PM with enriched metadata"""
    
    try:
        # Initialize DynamoDB client
        dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
        table = dynamodb.Table(DYNAMODB_TABLE)
        
        projects = []
        
        if pm_email == 'admin-all-access':
            # Admin access - get all projects
            logger.info("Admin access - scanning all projects")
            response = table.scan()
            items = response.get('Items', [])
        else:
            # PM-specific access
            logger.info(f"Querying projects for PM: {pm_email}")
            try:
                # Try to query by PM email (assuming it's a key or GSI exists)
                response = table.query(
                    KeyConditionExpression=Key('pm_email').eq(pm_email)
                )
                items = response.get('Items', [])
            except Exception:
                # Fallback to scan with filter
                logger.info("Fallback to scan with PM email filter")
                response = table.scan(
                    FilterExpression=boto3.dynamodb.conditions.Attr('pm_email').eq(pm_email)
                )
                items = response.get('Items', [])
        
        # Enrich each project
        for item in items:
            enriched = enrich_project_data(item, include_metadata, include_acta_status)
            projects.append(enriched)
        
        # Calculate summary statistics
        summary = calculate_pm_summary(projects)
        
        logger.info(f"Found {len(projects)} projects for PM: {pm_email}")
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'pm_email': pm_email,
                'total_projects': len(projects),
                'projects': projects,
                'summary': summary,
                'access_level': 'admin' if pm_email == 'admin-all-access' else 'pm',
                'data_source': 'DynamoDB',
                'table': DYNAMODB_TABLE
            })
        }
        
    except Exception as e:
        logger.error(f"Error getting projects for PM {pm_email}: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'error': str(e),
                'pm_email': pm_email,
                'message': 'Failed to fetch PM projects'
            })
        }

def enrich_project_data(project: Dict, include_metadata: bool, include_acta_status: bool) -> Dict:
    """Enrich a single project with metadata"""
    
    # Convert DynamoDB Decimal types
    project = convert_decimals(project)
    
    enriched = {
        'project_id': project.get('project_id', 'unknown'),
        'project_name': project.get('project_name', f"Project {project.get('project_id', 'unknown')}"),
        'pm_email': project.get('pm_email', 'unknown@company.com'),
        'project_status': project.get('project_status', 'active'),
        'last_updated': project.get('last_updated', datetime.now().isoformat()),
    }
    
    if include_acta_status:
        # Check if Acta document exists
        enriched['has_acta_document'] = check_acta_exists(project['project_id'])
        enriched['acta_last_generated'] = get_acta_timestamp(project['project_id'])
        enriched['acta_status'] = determine_acta_status(project['project_id'])
    
    if include_metadata:
        # Add external project data (mock for now)
        enriched['external_project_data'] = {
            'timeline_events': 5,
            'completion_percentage': 75,
            'budget_status': 'on_track'
        }
        enriched['timeline_summary'] = {
            'total_milestones': 6,
            'completed': 3,
            'upcoming': 3
        }
        
        # Add computed fields
        enriched['days_since_update'] = calculate_days_since_update(project.get('last_updated'))
        enriched['priority_level'] = calculate_priority(project)
    
    return enriched

def check_acta_exists(project_id: str) -> bool:
    """Check if Acta document exists for project"""
    s3 = boto3.client('s3', region_name=AWS_REGION)
    
    try:
        # Check for PDF
        s3.head_object(Bucket=S3_BUCKET, Key=f'acta/{project_id}.pdf')
        return True
    except:
        try:
            # Check for DOCX
            s3.head_object(Bucket=S3_BUCKET, Key=f'acta/{project_id}.docx')
            return True
        except:
            return False

def get_acta_timestamp(project_id: str) -> Optional[str]:
    """Get the timestamp when Acta was last generated"""
    s3 = boto3.client('s3', region_name=AWS_REGION)
    
    try:
        response = s3.head_object(Bucket=S3_BUCKET, Key=f'acta/{project_id}.pdf')
        return response['LastModified'].isoformat()
    except:
        try:
            response = s3.head_object(Bucket=S3_BUCKET, Key=f'acta/{project_id}.docx')
            return response['LastModified'].isoformat()
        except:
            return None

def check_document_status(project_id: str, format_type: str) -> Dict:
    """Check document status for document-validator endpoint"""
    
    try:
        s3 = boto3.client('s3', region_name=AWS_REGION)
        s3_key = f'acta/{project_id}.{format_type}'
        
        response = s3.head_object(Bucket=S3_BUCKET, Key=s3_key)
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'available': True,
                'project_id': project_id,
                'format': format_type,
                'last_modified': response['LastModified'].isoformat(),
                'size': response['ContentLength'],
                's3_key': s3_key
            })
        }
        
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            return {
                'statusCode': 404,
                'headers': get_cors_headers(),
                'body': json.dumps({
                    'available': False,
                    'project_id': project_id,
                    'format': format_type,
                    'message': 'Document not found'
                })
            }
        else:
            raise e

def calculate_pm_summary(projects: List[Dict]) -> Dict:
    """Calculate summary statistics for PM projects"""
    
    return {
        'with_acta': len([p for p in projects if p.get('has_acta_document', False)]),
        'without_acta': len([p for p in projects if not p.get('has_acta_document', False)]),
        'recently_updated': len([p for p in projects if p.get('days_since_update', 999) <= 7])
    }

def calculate_days_since_update(last_updated: str) -> int:
    """Calculate days since last update"""
    if not last_updated:
        return 999
    
    try:
        last_date = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
        return (datetime.now() - last_date).days
    except:
        return 999

def calculate_priority(project: Dict) -> str:
    """Calculate project priority level"""
    days_since_update = calculate_days_since_update(project.get('last_updated'))
    
    if days_since_update > 30:
        return 'high'
    elif days_since_update > 14:
        return 'medium'
    else:
        return 'low'

def determine_acta_status(project_id: str) -> str:
    """Determine ACTA document status"""
    if check_acta_exists(project_id):
        timestamp = get_acta_timestamp(project_id)
        if timestamp:
            try:
                acta_date = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                days_old = (datetime.now() - acta_date).days
                if days_old > 30:
                    return 'outdated'
                else:
                    return 'current'
            except:
                return 'current'
        return 'current'
    else:
        return 'missing'

def convert_decimals(obj):
    """Convert DynamoDB Decimal types to regular numbers"""
    if isinstance(obj, list):
        return [convert_decimals(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_decimals(value) for key, value in obj.items()}
    elif hasattr(obj, '__class__') and obj.__class__.__name__ == 'Decimal':
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    else:
        return obj

def get_enriched_project_data(project_id: str, include_metadata: bool) -> Dict:
    """Get enriched data for a single project (existing functionality)"""
    
    # This would contain the original projectMetadataEnricher logic
    # For now, return a structured response
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps({
            'project_id': project_id,
            'project_name': f'Project {project_id}',
            'status': 'active',
            'enriched': True,
            'metadata_included': include_metadata
        })
    }

def original_enricher_logic(event) -> Dict:
    """Original enricher logic for backward compatibility"""
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps({
            'message': 'Original enricher logic',
            'event': event
        })
    }

def get_cors_headers():
    """Return CORS headers"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
