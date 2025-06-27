# PM Project Management - Metadata Enricher Integration

## 🎯 **Revised Architecture Using projectMetadataEnricher**

Instead of direct DynamoDB queries, we'll leverage the existing `projectMetadataEnricher` Lambda function to provide structured PM project data.

**Lambda Function**: `arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher`

## 🔄 **New Integration Pattern**

### 1. **Metadata Enricher Enhancement**

Enhance the existing `projectMetadataEnricher` to accept PM email as a parameter and return filtered, enriched project data:

```python
# Enhanced projectMetadataEnricher function
def lambda_handler(event, context):
    """
    Enhanced metadata enricher that can filter by PM email
    and return structured project data
    """

    # Extract parameters
    pm_email = event.get('pm_email')
    project_id = event.get('project_id')  # For individual project lookups

    if pm_email:
        # Return all projects for this PM
        return get_projects_for_pm(pm_email)
    elif project_id:
        # Return enriched data for specific project
        return get_enriched_project_data(project_id)
    else:
        # Original functionality
        return original_enricher_logic(event)

def get_projects_for_pm(pm_email):
    """Get all projects assigned to a PM with enriched metadata"""

    # Query DynamoDB for projects by PM email
    projects = query_dynamodb_by_pm(pm_email)

    # Enrich each project with additional metadata
    enriched_projects = []
    for project in projects:
        enriched = {
            'project_id': project['project_id'],
            'project_name': project.get('project_name', f"Project {project['project_id']}"),
            'pm_email': project['pm_email'],
            'project_status': project.get('project_status', 'active'),
            'last_updated': project.get('last_updated'),

            # Enriched metadata
            'has_acta_document': check_acta_exists(project['project_id']),
            'acta_last_generated': get_acta_timestamp(project['project_id']),
            'external_project_data': fetch_external_data(project['project_id']),
            'timeline_summary': get_timeline_summary(project['project_id']),

            # Additional computed fields
            'days_since_update': calculate_days_since_update(project.get('last_updated')),
            'acta_status': determine_acta_status(project['project_id']),
            'priority_level': calculate_priority(project),
        }
        enriched_projects.append(enriched)

    return {
        'statusCode': 200,
        'body': {
            'pm_email': pm_email,
            'total_projects': len(enriched_projects),
            'projects': enriched_projects,
            'summary': {
                'with_acta': len([p for p in enriched_projects if p['has_acta_document']]),
                'without_acta': len([p for p in enriched_projects if not p['has_acta_document']]),
                'recently_updated': len([p for p in enriched_projects if p['days_since_update'] <= 7])
            }
        }
    }
```

### 2. **Updated API Endpoints**

#### **GET /pm-projects/{pm_email}**

Calls the enhanced `projectMetadataEnricher` with PM email filter:

```python
# API Gateway Lambda
def get_pm_projects(event, context):
    pm_email = event['pathParameters']['pm_email']

    # Invoke the enhanced metadata enricher
    enricher_response = invoke_lambda(
        'projectMetadataEnricher',
        {
            'pm_email': pm_email,
            'include_metadata': True,
            'include_acta_status': True
        }
    )

    return {
        'statusCode': 200,
        'headers': cors_headers(),
        'body': json.dumps(enricher_response['body'])
    }
```

#### **POST /bulk-enrich-projects**

Bulk processing using the metadata enricher:

```python
def bulk_enrich_projects(event, context):
    body = json.loads(event['body'])
    pm_email = body['pm_email']

    # Get projects from enricher
    projects_response = invoke_lambda(
        'projectMetadataEnricher',
        {'pm_email': pm_email}
    )

    projects = projects_response['body']['projects']

    # Process each project for Acta generation
    results = {'success': [], 'failed': [], 'total': len(projects)}

    for project in projects:
        try:
            # Use existing Acta generation logic
            generate_acta_for_project(project['project_id'])
            results['success'].append(project['project_id'])
        except Exception as e:
            results['failed'].append({
                'project_id': project['project_id'],
                'error': str(e)
            })

    return {
        'statusCode': 200,
        'headers': cors_headers(),
        'body': json.dumps(results)
    }
```

### 3. **Enhanced Project Data Structure**

The metadata enricher will return enriched project data:

```json
{
  "pm_email": "john.pm@company.com",
  "total_projects": 5,
  "projects": [
    {
      "project_id": "1000000064013473",
      "project_name": "Customer Portal Upgrade",
      "pm_email": "john.pm@company.com",
      "project_status": "active",
      "last_updated": "2025-06-27T10:30:00Z",

      // Enriched by metadata enricher
      "has_acta_document": true,
      "acta_last_generated": "2025-06-26T14:22:00Z",
      "external_project_data": {
        "timeline_events": 15,
        "completion_percentage": 75,
        "budget_status": "on_track"
      },
      "timeline_summary": {
        "total_milestones": 8,
        "completed": 6,
        "upcoming": 2
      },

      // Computed fields
      "days_since_update": 1,
      "acta_status": "current",
      "priority_level": "high"
    }
  ],
  "summary": {
    "with_acta": 4,
    "without_acta": 1,
    "recently_updated": 3
  }
}
```

## 🔧 **Implementation Steps**

### **Phase 1: Enhance Metadata Enricher**

1. Add PM email filtering capability
2. Add Acta document status checking
3. Add computed fields for dashboard display
4. Return structured project lists

### **Phase 2: Update API Gateway**

1. Create lightweight endpoints that call the enricher
2. Add error handling and response formatting
3. Maintain existing endpoint compatibility

### **Phase 3: Frontend Integration**

The frontend is already ready! It will automatically work with the new endpoints.

## 🎯 **Benefits of This Approach**

1. **Leverage Existing Infrastructure**: Use the proven `projectMetadataEnricher`
2. **Consistent Data Format**: All project data flows through the same enricher
3. **Centralized Logic**: All metadata enhancement happens in one place
4. **Easier Maintenance**: Single function to update for project data changes
5. **Better Performance**: Enricher can cache and optimize data fetching

## 🧪 **Testing Strategy**

```javascript
// Test the enhanced metadata enricher integration
testMetadataEnricherIntegration();

// Test PM project loading via enricher
testPMProjectsViaEnricher();

// Test bulk operations
testBulkOperationsWithEnricher();
```

## 🚀 **Deployment Plan**

1. **Enhance `projectMetadataEnricher`** with PM filtering
2. **Deploy API Gateway endpoints** that call the enricher
3. **Frontend automatically works** with the new data structure
4. **Test end-to-end** using the built-in testing utilities

This approach is much cleaner and leverages your existing investment in the `projectMetadataEnricher` function!

Would you like me to help you enhance the metadata enricher function, or shall we start with the API Gateway endpoints that call it?
