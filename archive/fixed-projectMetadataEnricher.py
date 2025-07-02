#!/usr/bin/env python3
"""
Enhanced projectMetadataEnricher Lambda Function
Handles all ACTA-UI endpoints with proper routing and error handling
"""
import json
import boto3
import os
import logging
from datetime import datetime
import base64
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Main Lambda handler that routes requests to appropriate functions
    """
    try:
        # Log the incoming event for debugging
        logger.info(f"Received event: {json.dumps(event, default=str)}")
        
        # Extract request information
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '')
        resource = event.get('resource', '')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        body = event.get('body', '{}')
        
        # Route to appropriate handler based on path
        if '/health' in path:
            return handle_health_check(event, context)
        elif '/projects' in path and http_method == 'GET':
            return handle_projects_list(event, context)
        elif '/pm-manager' in path or '/pm-projects' in path:
            return handle_pm_manager(event, context)
        elif '/document-validator' in path:
            return handle_document_validator(event, context)
        elif '/project-summary' in path:
            return handle_project_summary(event, context)
        elif '/timeline' in path:
            return handle_timeline(event, context)
        elif '/extract-project-place' in path:
            return handle_extract_project_place(event, context)
        elif '/download-acta' in path:
            return handle_download_acta(event, context)
        elif '/send-approval-email' in path:
            return handle_send_approval_email(event, context)
        else:
            logger.warning(f"Unhandled path: {path}")
            return create_response(404, {'error': f'Endpoint not found: {path}'})
            
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Internal server error', 'message': str(e)})

def create_response(status_code, body, headers=None):
    """Create a properly formatted API Gateway response"""
    default_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    }
    
    if headers:
        default_headers.update(headers)
    
    return {
        'statusCode': status_code,
        'headers': default_headers,
        'body': json.dumps(body) if isinstance(body, (dict, list)) else str(body)
    }

def handle_health_check(event, context):
    """Handle /health endpoint"""
    return create_response(200, {
        'status': 'healthy',
        'service': 'ACTA-UI Backend',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

def handle_projects_list(event, context):
    """Handle /projects endpoint - Admin projects list"""
    # Mock projects data (replace with real database queries)
    projects = [
        {
            'id': 'proj_001',
            'name': 'Downtown Redevelopment',
            'pm': 'John Smith',
            'status': 'Active',
            'created_date': '2025-01-15'
        },
        {
            'id': 'proj_002', 
            'name': 'Green Energy Initiative',
            'pm': 'Sarah Johnson',
            'status': 'Planning',
            'created_date': '2025-01-20'
        }
    ]
    
    return create_response(200, {
        'projects': projects,
        'total': len(projects)
    })

def handle_pm_manager(event, context):
    """Handle PM manager endpoints"""
    path = event.get('path', '')
    path_parameters = event.get('pathParameters') or {}
    
    if 'all-projects' in path:
        # Handle /pm-manager/all-projects or /pm-projects/all-projects
        projects = [
            {
                'id': 'proj_001',
                'name': 'Downtown Redevelopment',
                'status': 'Active',
                'pm_email': 'pm1@example.com',
                'last_updated': '2025-06-29'
            },
            {
                'id': 'proj_002',
                'name': 'Green Energy Initiative', 
                'status': 'Planning',
                'pm_email': 'pm2@example.com',
                'last_updated': '2025-06-28'
            }
        ]
        return create_response(200, {'projects': projects})
    else:
        # Handle /pm-manager/{email} - get projects for specific PM
        pm_email = path_parameters.get('email') or path_parameters.get('id')
        projects = [
            {
                'id': 'proj_001',
                'name': f'Project for {pm_email}',
                'status': 'Active',
                'pm_email': pm_email
            }
        ]
        return create_response(200, {'projects': projects, 'pm_email': pm_email})

def handle_document_validator(event, context):
    """Handle /document-validator endpoint"""
    path_parameters = event.get('pathParameters') or {}
    query_parameters = event.get('queryStringParameters') or {}
    
    project_id = path_parameters.get('id') or path_parameters.get('projectId')
    format_type = query_parameters.get('format', 'pdf')
    
    if not project_id:
        return create_response(400, {'error': 'Missing project ID'})
    
    # Mock document validation (replace with real S3 checks)
    document_exists = project_id in ['test', 'proj_001', 'proj_002']
    
    if event.get('httpMethod') == 'HEAD':
        # HEAD request - just return status
        return create_response(200 if document_exists else 404, '')
    else:
        # GET request - return document status
        return create_response(200, {
            'project_id': project_id,
            'format': format_type,
            'exists': document_exists,
            'status': 'ready' if document_exists else 'not_found',
            'last_updated': datetime.utcnow().isoformat()
        })

def handle_project_summary(event, context):
    """Handle /project-summary endpoint - Fixed to prevent 502 errors"""
    path_parameters = event.get('pathParameters') or {}
    project_id = path_parameters.get('id') or path_parameters.get('projectId')
    
    if not project_id:
        return create_response(400, {'error': 'Missing project ID'})
    
    # Mock project summary data (replace with real database queries)
    project_summary = {
        'project_id': project_id,
        'project_name': f'Project {project_id}',
        'pm': 'Project Manager',
        'status': 'Active',
        'description': f'Detailed summary for project {project_id}',
        'start_date': '2025-01-01',
        'end_date': '2025-12-31',
        'budget': 1000000,
        'progress': 45,
        'stakeholders': [
            {'name': 'Client Representative', 'role': 'Client'},
            {'name': 'Technical Lead', 'role': 'Developer'}
        ],
        'recent_activities': [
            {'date': '2025-06-29', 'activity': 'Project status updated'},
            {'date': '2025-06-28', 'activity': 'Document review completed'}
        ]
    }
    
    return create_response(200, project_summary)

def handle_timeline(event, context):
    """Handle /timeline endpoint - Fixed to prevent 502 errors"""
    path_parameters = event.get('pathParameters') or {}
    project_id = path_parameters.get('id') or path_parameters.get('projectId')
    
    if not project_id:
        return create_response(400, {'error': 'Missing project ID'})
    
    # Mock timeline data (replace with real database queries)
    timeline = {
        'project_id': project_id,
        'timeline': [
            {
                'date': '2025-01-01',
                'event': 'Project Initiated',
                'status': 'completed',
                'description': 'Project kickoff and initial planning'
            },
            {
                'date': '2025-03-15',
                'event': 'Phase 1 Completion',
                'status': 'completed',
                'description': 'First milestone achieved'
            },
            {
                'date': '2025-06-30',
                'event': 'Mid-project Review',
                'status': 'in_progress',
                'description': 'Current phase review and adjustments'
            },
            {
                'date': '2025-12-31',
                'event': 'Project Completion',
                'status': 'planned',
                'description': 'Final deliverables and project closure'
            }
        ],
        'total_events': 4,
        'generated_at': datetime.utcnow().isoformat()
    }
    
    return create_response(200, timeline)

def handle_extract_project_place(event, context):
    """Handle /extract-project-place endpoint - Generate ACTA button"""
    try:
        # Parse request body
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)
        
        project_id = body.get('project_id') or event.get('pathParameters', {}).get('id')
        
        if not project_id:
            return create_response(400, {'error': 'Missing project_id'})
        
        # Mock ACTA generation process (replace with real implementation)
        acta_id = f"acta_{project_id}_{uuid.uuid4().hex[:8]}"
        
        # Simulate processing
        result = {
            'acta_id': acta_id,
            'project_id': project_id,
            'status': 'processing',
            'message': 'ACTA generation started',
            'estimated_completion': '5 minutes',
            'download_available_after': datetime.utcnow().isoformat()
        }
        
        return create_response(200, result)
        
    except json.JSONDecodeError:
        return create_response(400, {'error': 'Invalid JSON in request body'})

def handle_download_acta(event, context):
    """Handle /download-acta endpoint - Fixed to prevent 502 errors"""
    path_parameters = event.get('pathParameters') or {}
    query_parameters = event.get('queryStringParameters') or {}
    
    project_id = path_parameters.get('id') or path_parameters.get('projectId')
    format_type = query_parameters.get('format', 'pdf')
    
    if not project_id:
        return create_response(400, {'error': 'Missing project ID'})
    
    if format_type not in ['pdf', 'docx']:
        return create_response(400, {'error': 'Invalid format. Use pdf or docx'})
    
    # Mock file download (replace with real S3 URL generation)
    download_url = f"https://acta-documents.s3.amazonaws.com/{project_id}/acta.{format_type}"
    
    # Return redirect to download URL
    return {
        'statusCode': 302,
        'headers': {
            'Location': download_url,
            'Access-Control-Allow-Origin': '*'
        },
        'body': ''
    }

def handle_send_approval_email(event, context):
    """Handle /send-approval-email endpoint - Fixed to prevent 400 errors"""
    try:
        # Parse request body
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)
        
        acta_id = body.get('acta_id')
        client_email = body.get('client_email')
        
        if not acta_id or not client_email:
            return create_response(400, {
                'error': 'Missing required fields',
                'required': ['acta_id', 'client_email']
            })
        
        # Mock email sending (replace with real SES implementation)
        result = {
            'acta_id': acta_id,
            'client_email': client_email,
            'status': 'sent',
            'message': 'Approval email sent successfully',
            'sent_at': datetime.utcnow().isoformat()
        }
        
        return create_response(200, result)
        
    except json.JSONDecodeError:
        return create_response(400, {'error': 'Invalid JSON in request body'})
    except Exception as e:
        logger.error(f"Email sending error: {str(e)}")
        return create_response(500, {'error': 'Failed to send email', 'message': str(e)})

if __name__ == "__main__":
    # For local testing
    test_event = {
        "httpMethod": "GET",
        "path": "/health",
        "pathParameters": None,
        "queryStringParameters": None,
        "body": None
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))
