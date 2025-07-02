# Backend Implementation Guide - Metadata Enricher Integration

## 🎯 Overview

This guide provides the exact implementation steps to integrate the existing `projectMetadataEnricher` Lambda function with the PM project management workflow.

## 📋 Implementation Checklist

### Phase 1: Enhance projectMetadataEnricher Lambda

#### 1.1 Update Lambda Function Handler

```python
import json
import boto3
from datetime import datetime, timedelta
from typing import Dict, List, Optional

def lambda_handler(event, context):
    """
    Enhanced metadata enricher that supports PM email filtering
    """

    # Extract parameters
    pm_email = event.get('pm_email')
    project_id = event.get('project_id')
    include_metadata = event.get('include_metadata', True)
    include_acta_status = event.get('include_acta_status', True)

    try:
        if pm_email:
            # New functionality: Return all projects for this PM
            return get_projects_for_pm(pm_email, include_metadata, include_acta_status)
        elif project_id:
            # Enhanced existing functionality
            return get_enriched_project_data(project_id, include_metadata)
        else:
            # Original functionality (backward compatibility)
            return original_enricher_logic(event)

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Metadata enricher failed'
            })
        }

def get_projects_for_pm(pm_email: str, include_metadata: bool, include_acta_status: bool) -> Dict:
    """Get all projects assigned to a PM with enriched metadata"""

    # Initialize DynamoDB client
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('your-projects-table')  # Replace with actual table name

    # Query projects by PM email
    try:
        # Use GSI if PM email is not the primary key
        response = table.query(
            IndexName='pm-email-index',  # Replace with actual GSI name
            KeyConditionExpression=boto3.dynamodb.conditions.Key('pm_email').eq(pm_email)
        )
        projects = response['Items']
    except Exception as e:
        # Fallback to scan if GSI doesn't exist
        response = table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('pm_email').eq(pm_email)
        )
        projects = response['Items']

    # Enrich each project
    enriched_projects = []
    for project in projects:
        enriched = enrich_project_data(project, include_metadata, include_acta_status)
        enriched_projects.append(enriched)

    # Calculate summary statistics
    summary = calculate_pm_summary(enriched_projects)

    return {
        'statusCode': 200,
        'body': {
            'pm_email': pm_email,
            'total_projects': len(enriched_projects),
            'projects': enriched_projects,
            'summary': summary
        }
    }

def enrich_project_data(project: Dict, include_metadata: bool, include_acta_status: bool) -> Dict:
    """Enrich a single project with metadata"""

    enriched = {
        'project_id': project['project_id'],
        'project_name': project.get('project_name', f"Project {project['project_id']}"),
        'pm_email': project['pm_email'],
        'project_status': project.get('project_status', 'active'),
        'last_updated': project.get('last_updated'),
    }

    if include_acta_status:
        # Check if Acta document exists
        enriched['has_acta_document'] = check_acta_exists(project['project_id'])
        enriched['acta_last_generated'] = get_acta_timestamp(project['project_id'])
        enriched['acta_status'] = determine_acta_status(project['project_id'])

    if include_metadata:
        # Add external project data
        enriched['external_project_data'] = fetch_external_data(project['project_id'])
        enriched['timeline_summary'] = get_timeline_summary(project['project_id'])

        # Add computed fields
        enriched['days_since_update'] = calculate_days_since_update(project.get('last_updated'))
        enriched['priority_level'] = calculate_priority(project)

    return enriched

def check_acta_exists(project_id: str) -> bool:
    """Check if Acta document exists for project"""
    s3 = boto3.client('s3')
    bucket = 'your-acta-bucket'  # Replace with actual bucket

    try:
        # Check for PDF
        s3.head_object(Bucket=bucket, Key=f'acta/{project_id}.pdf')
        return True
    except:
        try:
            # Check for DOCX
            s3.head_object(Bucket=bucket, Key=f'acta/{project_id}.docx')
            return True
        except:
            return False

def get_acta_timestamp(project_id: str) -> Optional[str]:
    """Get the timestamp when Acta was last generated"""
    s3 = boto3.client('s3')
    bucket = 'your-acta-bucket'  # Replace with actual bucket

    try:
        response = s3.head_object(Bucket=bucket, Key=f'acta/{project_id}.pdf')
        return response['LastModified'].isoformat()
    except:
        try:
            response = s3.head_object(Bucket=bucket, Key=f'acta/{project_id}.docx')
            return response['LastModified'].isoformat()
        except:
            return None

def determine_acta_status(project_id: str) -> str:
    """Determine the status of the Acta document"""
    if not check_acta_exists(project_id):
        return 'missing'

    timestamp = get_acta_timestamp(project_id)
    if not timestamp:
        return 'missing'

    # Check if Acta is older than 30 days
    acta_date = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    if datetime.now() - acta_date > timedelta(days=30):
        return 'outdated'

    return 'current'

def calculate_days_since_update(last_updated: Optional[str]) -> Optional[int]:
    """Calculate days since last update"""
    if not last_updated:
        return None

    try:
        update_date = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
        return (datetime.now() - update_date).days
    except:
        return None

def calculate_priority(project: Dict) -> str:
    """Calculate project priority based on various factors"""
    # Implement your priority calculation logic
    # This is a simplified example

    status = project.get('project_status', 'active')
    days_since_update = calculate_days_since_update(project.get('last_updated'))

    if status == 'critical' or (days_since_update and days_since_update > 14):
        return 'high'
    elif status == 'active' and (days_since_update and days_since_update > 7):
        return 'medium'
    else:
        return 'low'

def calculate_pm_summary(projects: List[Dict]) -> Dict:
    """Calculate summary statistics for PM projects"""
    total = len(projects)
    with_acta = len([p for p in projects if p.get('has_acta_document', False)])
    without_acta = total - with_acta
    recently_updated = len([p for p in projects if p.get('days_since_update', 999) <= 7])

    return {
        'with_acta': with_acta,
        'without_acta': without_acta,
        'recently_updated': recently_updated
    }

def fetch_external_data(project_id: str) -> Dict:
    """Fetch external project data (implement based on your data sources)"""
    # Placeholder - implement based on your external data sources
    return {
        'timeline_events': 0,
        'completion_percentage': 0,
        'budget_status': 'unknown'
    }

def get_timeline_summary(project_id: str) -> Dict:
    """Get timeline summary for project"""
    # Placeholder - implement based on your timeline data
    return {
        'total_milestones': 0,
        'completed': 0,
        'upcoming': 0
    }

def original_enricher_logic(event):
    """Original enricher logic for backward compatibility"""
    # Keep your existing enricher logic here
    pass
```

#### 1.2 Update Lambda IAM Permissions

Ensure the Lambda function has the necessary permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:Query", "dynamodb:Scan", "dynamodb:GetItem"],
      "Resource": [
        "arn:aws:dynamodb:us-east-2:703671891952:table/your-projects-table",
        "arn:aws:dynamodb:us-east-2:703671891952:table/your-projects-table/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:HeadObject", "s3:GetObject"],
      "Resource": ["arn:aws:s3:::your-acta-bucket/*"]
    }
  ]
}
```

### Phase 2: Create API Gateway Endpoints

#### 2.1 GET /pm-projects/{pm_email}

```python
import json
import boto3

def lambda_handler(event, context):
    """API Gateway handler for PM projects endpoint"""

    # Extract PM email from path parameters
    pm_email = event['pathParameters']['pm_email']

    # Validate PM email
    if not pm_email or '@' not in pm_email:
        return {
            'statusCode': 400,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Invalid PM email'})
        }

    try:
        # Invoke the enhanced metadata enricher
        lambda_client = boto3.client('lambda')

        response = lambda_client.invoke(
            FunctionName='projectMetadataEnricher',
            Payload=json.dumps({
                'pm_email': pm_email,
                'include_metadata': True,
                'include_acta_status': True
            })
        )

        # Parse response
        payload = json.loads(response['Payload'].read())

        if payload['statusCode'] == 200:
            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps(payload['body'])
            }
        else:
            return {
                'statusCode': payload['statusCode'],
                'headers': cors_headers(),
                'body': json.dumps(payload.get('body', {'error': 'Unknown error'}))
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to fetch PM projects'
            })
        }

def cors_headers():
    """Return CORS headers"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
```

#### 2.2 POST /bulk-enrich-projects

```python
import json
import boto3
from concurrent.futures import ThreadPoolExecutor

def lambda_handler(event, context):
    """API Gateway handler for bulk project enrichment"""

    try:
        # Parse request body
        body = json.loads(event['body'])
        pm_email = body.get('pm_email')

        if not pm_email:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'PM email is required'})
            }

        # Get projects for PM
        lambda_client = boto3.client('lambda')

        projects_response = lambda_client.invoke(
            FunctionName='projectMetadataEnricher',
            Payload=json.dumps({
                'pm_email': pm_email,
                'include_metadata': True,
                'include_acta_status': True
            })
        )

        projects_payload = json.loads(projects_response['Payload'].read())

        if projects_payload['statusCode'] != 200:
            return {
                'statusCode': projects_payload['statusCode'],
                'headers': cors_headers(),
                'body': json.dumps(projects_payload.get('body', {'error': 'Failed to get projects'}))
            }

        projects = projects_payload['body']['projects']

        # Process each project for Acta generation
        results = {
            'success': [],
            'failed': [],
            'total': len(projects)
        }

        # Use ThreadPoolExecutor for parallel processing
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = []

            for project in projects:
                future = executor.submit(generate_acta_for_project, project['project_id'])
                futures.append((project['project_id'], future))

            # Collect results
            for project_id, future in futures:
                try:
                    future.result()  # This will raise an exception if the task failed
                    results['success'].append(project_id)
                except Exception as e:
                    results['failed'].append({
                        'project_id': project_id,
                        'error': str(e)
                    })

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(results)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({
                'error': str(e),
                'message': 'Bulk enrichment failed'
            })
        }

def generate_acta_for_project(project_id: str):
    """Generate Acta for a single project"""
    # Implement your Acta generation logic here
    # This should call your existing Acta generation process

    # Example:
    lambda_client = boto3.client('lambda')

    response = lambda_client.invoke(
        FunctionName='your-acta-generator-function',  # Replace with actual function name
        Payload=json.dumps({'project_id': project_id})
    )

    result = json.loads(response['Payload'].read())

    if result.get('statusCode') != 200:
        raise Exception(f"Acta generation failed: {result.get('body', 'Unknown error')}")

    return result
```

### Phase 3: Deploy and Test

#### 3.1 Deploy Lambda Functions

```bash
# Deploy the enhanced metadata enricher
aws lambda update-function-code \
    --function-name projectMetadataEnricher \
    --zip-file fileb://enhanced-metadata-enricher.zip

# Deploy API Gateway endpoints
# (Use your existing deployment process)
```

#### 3.2 Test with Frontend

Once deployed, test using the frontend testing utilities:

```javascript
// Test the integration
testBackendAPIRequirements();

// Test the metadata enricher endpoints
testMetadataEnricherIntegration('your.pm@company.com');

// Test the complete workflow
testCompleteWorkflowWithEnricher('your.pm@company.com');
```

## 🔧 Configuration Requirements

### Environment Variables

Make sure these are set in your API Gateway Lambda functions:

```bash
PROJECTS_TABLE_NAME=your-projects-table
ACTA_BUCKET_NAME=your-acta-bucket
METADATA_ENRICHER_FUNCTION_NAME=projectMetadataEnricher
```

### DynamoDB Table Structure

Ensure your projects table has the following structure:

```json
{
  "project_id": "string",
  "pm_email": "string",
  "project_name": "string",
  "project_status": "string",
  "last_updated": "string (ISO 8601)"
}
```

### Global Secondary Index (GSI)

Create a GSI for efficient PM email queries:

```json
{
  "IndexName": "pm-email-index",
  "KeySchema": [
    {
      "AttributeName": "pm_email",
      "KeyType": "HASH"
    }
  ],
  "Projection": {
    "ProjectionType": "ALL"
  }
}
```

## 🎯 Next Steps

1. **Implement Phase 1**: Enhance the `projectMetadataEnricher` Lambda
2. **Test Lambda**: Use AWS Console or CLI to test the enhanced function
3. **Implement Phase 2**: Create the API Gateway endpoints
4. **Test Integration**: Use the frontend testing utilities
5. **Deploy to Production**: Update your deployment pipeline

The frontend is already ready and will automatically work once the backend is implemented!
