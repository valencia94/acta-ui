import json
import boto3
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Enhanced projectMetadataEnricher Lambda Function
    Handles all project-related API endpoints with proper routing
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Extract request details
        path = event.get('path', '')
        method = event.get('httpMethod', 'GET')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        
        logger.info(f"Processing: {method} {path}")
        
        # Route based on path patterns
        if '/pm-manager/all-projects' in path:
            return handle_all_projects_for_admin(query_parameters)
        elif '/pm-manager/' in path and path_parameters.get('pmEmail'):
            pm_email = path_parameters['pmEmail'].replace('%40', '@')
            return handle_projects_by_pm(pm_email, query_parameters)
        elif '/projects' in path:
            return handle_projects_list(query_parameters)
        elif '/document-validator/' in path and path_parameters.get('id'):
            project_id = path_parameters['id']
            format_type = query_parameters.get('format', 'pdf')
            return handle_document_status(project_id, format_type, method)
        elif '/project-summary/' in path and path_parameters.get('id'):
            project_id = path_parameters['id']
            pm_email = query_parameters.get('pm_email')
            return handle_project_summary(project_id, pm_email)
        elif '/timeline/' in path and path_parameters.get('id'):
            project_id = path_parameters['id']
            return handle_timeline(project_id)
        else:
            # Original metadata enricher functionality for backward compatibility
            return handle_original_enricher_logic(event, context)
            
    except Exception as e:
        logger.error(f"Error in projectMetadataEnricher: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e),
            'path': event.get('path', 'unknown')
        })

def handle_all_projects_for_admin(query_params):
    """Handle GET /pm-manager/all-projects - Admin access to all projects"""
    try:
        logger.info("Handling admin request for all projects")
        
        # Mock data for now - replace with actual data source
        mock_projects = [
            {
                'project_id': '1000000064013473',
                'project_name': 'Infrastructure Upgrade Phase 1',
                'pm_email': 'pm1@ikusi.com',
                'project_status': 'active',
                'has_acta_document': True,
                'last_updated': '2025-06-27T10:30:00Z',
                'acta_last_generated': '2025-06-26T14:22:00Z',
                'days_since_update': 2,
                'acta_status': 'current',
                'priority_level': 'high'
            },
            {
                'project_id': '1000000049842296',
                'project_name': 'Network Security Enhancement',
                'pm_email': 'pm2@ikusi.com',
                'project_status': 'active',
                'has_acta_document': False,
                'last_updated': '2025-06-25T15:45:00Z',
                'days_since_update': 4,
                'acta_status': 'missing',
                'priority_level': 'medium'
            }
        ]
        
        summary = {
            'with_acta': len([p for p in mock_projects if p['has_acta_document']]),
            'without_acta': len([p for p in mock_projects if not p['has_acta_document']]),
            'recently_updated': len([p for p in mock_projects if p['days_since_update'] <= 7])
        }
        
        return create_response(200, {
            'pm_email': 'admin-all-access',
            'total_projects': len(mock_projects),
            'projects': mock_projects,
            'summary': summary,
            'access_level': 'admin',
            'data_source': 'enhanced_metadata_enricher'
        })
        
    except Exception as e:
        logger.error(f"Error in handle_all_projects_for_admin: {str(e)}")
        return create_response(500, {'error': str(e)})

def handle_projects_by_pm(pm_email, query_params):
    """Handle GET /pm-manager/{pmEmail} - PM-specific projects"""
    try:
        logger.info(f"Handling PM request for email: {pm_email}")
        
        # Mock data filtered by PM - replace with actual data source
        all_projects = [
            {
                'project_id': '1000000064013473',
                'project_name': 'Infrastructure Upgrade Phase 1',
                'pm_email': 'pm1@ikusi.com',
                'project_status': 'active',
                'has_acta_document': True,
                'last_updated': '2025-06-27T10:30:00Z'
            },
            {
                'project_id': '1000000049842296',
                'project_name': 'Network Security Enhancement',  
                'pm_email': 'pm2@ikusi.com',
                'project_status': 'active',
                'has_acta_document': False,
                'last_updated': '2025-06-25T15:45:00Z'
            }
        ]
        
        # Filter projects for the specific PM
        pm_projects = [p for p in all_projects if p['pm_email'] == pm_email]
        
        # Add enriched fields
        for project in pm_projects:
            project.update({
                'acta_last_generated': project.get('acta_last_generated', '2025-06-26T14:22:00Z') if project['has_acta_document'] else None,
                'days_since_update': calculate_days_since_update(project['last_updated']),
                'acta_status': 'current' if project['has_acta_document'] else 'missing',
                'priority_level': 'high' if project['project_status'] == 'active' else 'medium'
            })
        
        summary = {
            'with_acta': len([p for p in pm_projects if p['has_acta_document']]),
            'without_acta': len([p for p in pm_projects if not p['has_acta_document']]),
            'recently_updated': len([p for p in pm_projects if p.get('days_since_update', 999) <= 7])
        }
        
        return create_response(200, {
            'pm_email': pm_email,
            'total_projects': len(pm_projects),
            'projects': pm_projects,
            'summary': summary,
            'access_level': 'pm',
            'data_source': 'enhanced_metadata_enricher'
        })
        
    except Exception as e:
        logger.error(f"Error in handle_projects_by_pm: {str(e)}")
        return create_response(500, {'error': str(e)})

def handle_projects_list(query_params):
    """Handle GET /projects - General projects list"""
    try:
        logger.info("Handling general projects list request")
        
        # Return same as admin for now
        return handle_all_projects_for_admin(query_params)
        
    except Exception as e:
        logger.error(f"Error in handle_projects_list: {str(e)}")
        return create_response(500, {'error': str(e)})

def handle_document_status(project_id, format_type, method):
    """Handle GET/HEAD /document-validator/{id} - Document status checking"""
    try:
        logger.info(f"Checking document status for project {project_id}, format: {format_type}")
        
        # Mock document checking - replace with actual S3 checking
        mock_exists = project_id in ['1000000064013473', 'test']  # Mock some documents exist
        
        if method == 'HEAD':
            # HEAD request - return headers only
            if mock_exists:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Last-Modified': 'Thu, 27 Jun 2025 10:30:00 GMT',
                        'Content-Length': '1024'
                    }
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
        else:
            # GET request - return document metadata
            if mock_exists:
                return create_response(200, {
                    'available': True,
                    'project_id': project_id,
                    'format': format_type,
                    'last_modified': '2025-06-27T10:30:00Z',
                    'size': 1024,
                    's3_key': f'acta/{project_id}.{format_type}'
                })
            else:
                return create_response(404, {
                    'available': False,
                    'project_id': project_id,
                    'format': format_type,
                    'message': 'Document not found'
                })
                
    except Exception as e:
        logger.error(f"Error in handle_document_status: {str(e)}")
        return create_response(500, {'error': str(e)})

def handle_project_summary(project_id, pm_email=None):
    """Handle GET /project-summary/{id} - Project summary with enhanced data"""
    try:
        logger.info(f"Getting project summary for {project_id}, PM: {pm_email}")
        
        # Mock project summary - replace with actual data fetching
        summary = {
            'project_id': project_id,
            'project_name': f'Project {project_id}',
            'pm': pm_email or 'pm@example.com',
            'project_manager': pm_email or 'pm@example.com',
            'status': 'active',
            'description': f'Enhanced project summary for {project_id}',
            'created_date': '2025-01-01T00:00:00Z',
            'last_updated': '2025-06-27T10:30:00Z',
            'completion_percentage': 75,
            'next_milestone': 'Phase 2 Completion',
            'milestone_date': '2025-07-15T00:00:00Z'
        }
        
        return create_response(200, summary)
        
    except Exception as e:
        logger.error(f"Error in handle_project_summary: {str(e)}")
        return create_response(500, {'error': str(e)})

def handle_timeline(project_id):
    """Handle GET /timeline/{id} - Project timeline data"""
    try:
        logger.info(f"Getting timeline for project {project_id}")
        
        # Mock timeline data - replace with actual data fetching
        timeline = [
            {
                'hito': 'Project Initiation',
                'actividades': 'Requirements gathering and team setup',
                'desarrollo': 'Completed initial project planning and resource allocation',
                'fecha': '2025-01-15'
            },
            {
                'hito': 'Phase 1 Completion',
                'actividades': 'Core infrastructure implementation',
                'desarrollo': 'Successfully implemented base infrastructure components',
                'fecha': '2025-03-30'
            },
            {
                'hito': 'Phase 2 Planning',
                'actividades': 'Advanced features design and planning',
                'desarrollo': 'Currently in progress - 75% complete',
                'fecha': '2025-06-15'
            }
        ]
        
        return create_response(200, timeline)
        
    except Exception as e:
        logger.error(f"Error in handle_timeline: {str(e)}")
        return create_response(500, {'error': str(e)})

def handle_original_enricher_logic(event, context):
    """Handle original metadata enricher functionality for backward compatibility"""
    try:
        logger.info("Handling original enricher logic")
        
        # Return a basic response for now
        return create_response(200, {
            'message': 'Original metadata enricher functionality',
            'event_type': 'original',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in handle_original_enricher_logic: {str(e)}")
        return create_response(500, {'error': str(e)})

def calculate_days_since_update(last_updated):
    """Calculate days since last update"""
    try:
        if not last_updated:
            return None
        
        last_date = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
        now = datetime.now(last_date.tzinfo)
        return (now - last_date).days
    except:
        return None

def create_response(status_code, body):
    """Create a standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        },
        'body': json.dumps(body)
    }
