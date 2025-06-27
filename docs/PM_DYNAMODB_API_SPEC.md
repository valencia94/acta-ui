# PM Project Management API Specification

## Overview

This document specifies the backend API endpoints needed to integrate with the DynamoDB table `ProjectPlace_DataExtrator_landing_table_v2` for PM project management functionality.

## DynamoDB Table Structure

**Table**: `ProjectPlace_DataExtrator_landing_table_v2`
**Region**: `us-east-2`
**ARN**: `arn:aws:dynamodb:us-east-2:703671891952:table/ProjectPlace_DataExtrator_landing_table_v2`

### Required Fields
- `pm_email` (String) - Primary key for PM identification
- `project_id` (String) - Unique project identifier
- `project_name` (String) - Human readable project name
- `project_status` (String) - Current project status
- `last_updated` (String) - ISO timestamp of last update
- `has_acta_document` (Boolean) - Whether Acta document exists
- `acta_last_generated` (String) - ISO timestamp of last Acta generation

## API Endpoints

### 1. Get Projects by PM Email

**Endpoint**: `GET /projects-by-pm/{pm_email}`

**Description**: Retrieve all projects assigned to a specific PM from DynamoDB.

**Parameters**:
- `pm_email` (path) - URL-encoded email address of the PM

**Response**:
```json
[
  {
    "project_id": "1000000064013473",
    "project_name": "Customer Portal Upgrade",
    "pm_email": "john.pm@company.com",
    "project_status": "active",
    "last_updated": "2025-06-27T10:30:00Z",
    "has_acta_document": true,
    "acta_last_generated": "2025-06-26T14:22:00Z"
  }
]
```

**DynamoDB Query**:
```python
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('ProjectPlace_DataExtrator_landing_table_v2')

response = table.query(
    KeyConditionExpression=Key('pm_email').eq(pm_email)
)
return response['Items']
```

### 2. Enhanced Project Summary

**Endpoint**: `GET /project-summary/{project_id}?pm_email={pm_email}`

**Description**: Get project summary with PM context from DynamoDB.

**Parameters**:
- `project_id` (path) - Project identifier
- `pm_email` (query) - PM email for context lookup

**Response**:
```json
{
  "project_id": "1000000064013473",
  "project_name": "Customer Portal Upgrade", 
  "pm": "John Smith",
  "project_manager": "john.pm@company.com",
  "pm_context": {
    "project_id": "1000000064013473",
    "project_name": "Customer Portal Upgrade",
    "pm_email": "john.pm@company.com", 
    "project_status": "active",
    "last_updated": "2025-06-27T10:30:00Z",
    "has_acta_document": true,
    "acta_last_generated": "2025-06-26T14:22:00Z"
  }
}
```

### 3. Bulk Generate Summaries

**Endpoint**: `POST /bulk-generate-summaries`

**Description**: Generate Acta documents for all projects assigned to a PM.

**Request Body**:
```json
{
  "pm_email": "john.pm@company.com"
}
```

**Response**:
```json
{
  "success": ["1000000064013473", "1000000064013474"],
  "failed": ["1000000064013475"],
  "total": 3,
  "details": {
    "1000000064013475": "External data source unavailable"
  }
}
```

**Implementation Notes**:
1. Query DynamoDB for all projects by PM email
2. For each project, trigger the existing `extract-project-place/{project_id}` logic
3. Update DynamoDB records with generation status and timestamps
4. Return summary of successes and failures

### 4. Update Project Status

**Endpoint**: `PUT /project-status/{project_id}`

**Description**: Update project status and Acta document availability.

**Request Body**:
```json
{
  "project_status": "completed",
  "has_acta_document": true,
  "acta_last_generated": "2025-06-27T15:45:00Z"
}
```

**Response**:
```json
{
  "message": "Project status updated successfully",
  "project_id": "1000000064013473",
  "updated_fields": ["project_status", "has_acta_document", "acta_last_generated"]
}
```

## Implementation Examples

### Lambda Function for PM Projects

```python
import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

def lambda_handler(event, context):
    """Get projects by PM email"""
    
    # Extract PM email from path parameters
    pm_email = event['pathParameters']['pm_email']
    
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table = dynamodb.Table('ProjectPlace_DataExtrator_landing_table_v2')
    
    try:
        # Query projects by PM email
        response = table.query(
            KeyConditionExpression=Key('pm_email').eq(pm_email)
        )
        
        # Convert Decimal types to standard types for JSON serialization
        items = []
        for item in response['Items']:
            converted_item = convert_decimals(item)
            items.append(converted_item)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(items)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Failed to retrieve projects',
                'details': str(e)
            })
        }

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
```

### SAM Template Addition

```yaml
PMProjectsFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: src/
    Handler: pm_projects.lambda_handler
    Runtime: python3.9
    Policies:
      - DynamoDBReadPolicy:
          TableName: ProjectPlace_DataExtrator_landing_table_v2
    Events:
      GetPMProjects:
        Type: Api
        Properties:
          Path: /projects-by-pm/{pm_email}
          Method: get
          RestApiId: !Ref YourApiGateway

BulkGenerateFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: src/
    Handler: bulk_generate.lambda_handler
    Runtime: python3.9
    Timeout: 900  # 15 minutes for bulk operations
    Policies:
      - DynamoDBCrudPolicy:
          TableName: ProjectPlace_DataExtrator_landing_table_v2
      - S3FullAccessPolicy:
          BucketName: projectplace-dv-2025-x9a7b
    Events:
      BulkGenerate:
        Type: Api
        Properties:
          Path: /bulk-generate-summaries
          Method: post
          RestApiId: !Ref YourApiGateway
```

## Frontend Integration

The enhanced UI automatically:

1. **Detects PM users** by email and switches to PM mode
2. **Loads assigned projects** from DynamoDB on dashboard load
3. **Shows project status** including Acta document availability
4. **Enables bulk operations** for all PM projects
5. **Provides individual project management** with enhanced context

## Testing

Use the enhanced testing utilities:

```javascript
// Test PM project loading
testPMProjectManager()

// Test DynamoDB connectivity
testDynamoDBIntegration()

// Test complete PM workflow
testCompleteWorkflow()
```

## Security Considerations

1. **IAM Permissions**: Lambda functions need read/write access to DynamoDB table
2. **Email Validation**: Verify PM email matches authenticated user
3. **Rate Limiting**: Implement throttling for bulk operations
4. **Error Handling**: Graceful degradation when DynamoDB is unavailable
5. **Audit Logging**: Log all PM project management actions

## Migration Strategy

1. **Phase 1**: Implement read-only PM project listing
2. **Phase 2**: Add individual project management with DynamoDB updates
3. **Phase 3**: Implement bulk operations for PM efficiency
4. **Phase 4**: Add advanced features like project status tracking and notifications

This specification provides a complete roadmap for implementing PM project management with DynamoDB integration while maintaining backward compatibility with manual project entry.
