import json
import logging
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Fixed Timeline Lambda - handles GET /timeline/{id}
    Returns timeline events for dashboard timeline button
    """
    try:
        # Extract project ID from path parameters
        project_id = event.get('pathParameters', {}).get('id', 'unknown')
        
        logger.info(f"Getting timeline for project: {project_id}")
        
        # Generate mock timeline data - replace with actual data source
        base_date = datetime.now()
        timeline_events = []
        
        # Create sample timeline events
        events = [
            {"hito": "Project Initiation", "actividades": "Project setup and planning", "desarrollo": "Completed"},
            {"hito": "Requirements Analysis", "actividades": "Gather and analyze requirements", "desarrollo": "In Progress"},
            {"hito": "Design Phase", "actividades": "System design and architecture", "desarrollo": "Pending"},
            {"hito": "Implementation", "actividades": "Development and coding", "desarrollo": "Pending"},
            {"hito": "Testing", "actividades": "Quality assurance and testing", "desarrollo": "Pending"},
            {"hito": "Deployment", "actividades": "Production deployment", "desarrollo": "Pending"}
        ]
        
        for i, event in enumerate(events):
            event_date = base_date + timedelta(days=i*30)
            timeline_events.append({
                "hito": event["hito"],
                "actividades": event["actividades"], 
                "desarrollo": event["desarrollo"],
                "fecha": event_date.strftime("%Y-%m-%d")
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps(timeline_events)
        }
        
    except Exception as e:
        logger.error(f"Error in getTimeline: {str(e)}")
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
