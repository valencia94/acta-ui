import json
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Fixed Project Summary Lambda - handles GET /project-summary/{id}
    Returns project summary information for dashboard summary button
    """
    try:
        # Extract project ID from path parameters
        project_id = event.get('pathParameters', {}).get('id', 'unknown')
        
        logger.info(f"Getting project summary for: {project_id}")
        
        # Mock response for now - replace with actual data source
        response_data = {
            "project_id": project_id,
            "project_name": f"Project {project_id}",
            "pm": "project.manager@company.com",
            "status": "active",
            "description": "Project summary retrieved successfully",
            "last_updated": "2025-06-29T12:00:00Z",
            "completion_percentage": 75,
            "budget_status": "on_track"
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        logger.error(f"Error in getProjectSummary: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'project_id': project_id
            })
        }
