#!/bin/bash

# Add missing endpoints and permissions to template-conflict-free.yaml
# This fixes the 502 Lambda errors we identified in the system test

echo "🔧 Fixing CloudFormation template to add missing endpoints..."

TEMPLATE_FILE="infra/template-conflict-free.yaml"

# Create backup
cp "$TEMPLATE_FILE" "${TEMPLATE_FILE}.backup"

# Add missing resources and permissions
cat >> "$TEMPLATE_FILE" << 'EOF'

  ###############################################################################
  # MISSING ENDPOINTS - Adding to fix 502 errors
  ###############################################################################

  # /pm-manager (corrected endpoint paths)
  PMManagerResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref ExistingApiRootResourceId
      PathPart: pm-manager

  PMManagerAllProjectsResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref PMManagerResource
      PathPart: all-projects

  PMManagerAllProjectsGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ExistingApiId
      ResourceId: !Ref PMManagerAllProjectsResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ProjectMetadataEnricherArn}/invocations

  PMManagerByEmailResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref PMManagerResource
      PathPart: '{pmEmail}'

  PMManagerByEmailGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ExistingApiId
      ResourceId: !Ref PMManagerByEmailResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ProjectMetadataEnricherArn}/invocations

  # /document-validator (corrected endpoint paths)
  DocumentValidatorResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref ExistingApiRootResourceId
      PathPart: document-validator

  DocumentValidatorIdResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref DocumentValidatorResource
      PathPart: '{projectId}'

  DocumentValidatorGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ExistingApiId
      ResourceId: !Ref DocumentValidatorIdResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ProjectMetadataEnricherArn}/invocations

  DocumentValidatorHeadMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ExistingApiId
      ResourceId: !Ref DocumentValidatorIdResource
      HttpMethod: HEAD
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ProjectMetadataEnricherArn}/invocations

  # /project-summary (502 error endpoint)
  ProjectSummaryResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref ExistingApiRootResourceId
      PathPart: project-summary

  ProjectSummaryIdResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref ProjectSummaryResource
      PathPart: '{projectId}'

  ProjectSummaryGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ExistingApiId
      ResourceId: !Ref ProjectSummaryIdResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:703671891952:function:getProjectSummary/invocations

  # /timeline (502 error endpoint)
  TimelineResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref ExistingApiRootResourceId
      PathPart: timeline

  TimelineIdResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref TimelineResource
      PathPart: '{projectId}'

  TimelineGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ExistingApiId
      ResourceId: !Ref TimelineIdResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:703671891952:function:getTimeline/invocations

  # /download-acta (502 error endpoint)
  DownloadActaResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref ExistingApiRootResourceId
      PathPart: download-acta

  DownloadActaIdResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref DownloadActaResource
      PathPart: '{projectId}'

  DownloadActaGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ExistingApiId
      ResourceId: !Ref DownloadActaIdResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:703671891952:function:getDownloadActa/invocations

  # /send-approval-email (400 error endpoint)
  SendApprovalEmailResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ExistingApiId
      ParentId: !Ref ExistingApiRootResourceId
      PathPart: send-approval-email

  SendApprovalEmailPostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ExistingApiId
      ResourceId: !Ref SendApprovalEmailResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:703671891952:function:sendApprovalEmail/invocations

  ###############################################################################
  # MISSING PERMISSIONS - Adding to fix test failures
  ###############################################################################

  PMManagerAllProjectsPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProjectMetadataEnricherFunctionName
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/GET/pm-manager/all-projects

  PMManagerByEmailPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProjectMetadataEnricherFunctionName
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/GET/pm-manager/*

  ProjectsManagerPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProjectMetadataEnricherFunctionName
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/GET/projects

  DocumentValidatorGetPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProjectMetadataEnricherFunctionName
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/GET/document-validator/*

  DocumentValidatorHeadPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProjectMetadataEnricherFunctionName
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/HEAD/document-validator/*

  ProjectMetadataEnricherPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProjectMetadataEnricherFunctionName
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/*

  # Alias permissions (for the test script)
  ProjectsAliasPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProjectMetadataEnricherFunctionName
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/GET/projects

  PMProjectsAllAliasPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProjectMetadataEnricherFunctionName
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/GET/pm-projects/all-projects

  PMProjectsByEmailAliasPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProjectMetadataEnricherFunctionName
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/GET/pm-projects/*

  CheckDocGetAliasPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProjectMetadataEnricherFunctionName
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/GET/check-document/*

  CheckDocHeadAliasPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProjectMetadataEnricherFunctionName
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/HEAD/check-document/*

  # Permissions for the new Lambda functions (502 error fixes)
  ProjectSummaryPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: getProjectSummary
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/GET/project-summary/*

  TimelinePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: getTimeline
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/GET/timeline/*

  DownloadActaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: getDownloadActa
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/GET/download-acta/*

  SendApprovalEmailPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: sendApprovalEmail
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ExistingApiId}/*/POST/send-approval-email

EOF

echo "✅ Added missing endpoints and permissions to $TEMPLATE_FILE"
echo "📋 Updated ConflictFreeApiGatewayDeployment dependencies..."

# Update the deployment dependencies to include new methods
sed -i '/DependsOn:/,/Properties:/{
/DependsOn:/a\
      - PMManagerAllProjectsGetMethod\
      - PMManagerByEmailGetMethod\
      - DocumentValidatorGetMethod\
      - DocumentValidatorHeadMethod\
      - ProjectSummaryGetMethod\
      - TimelineGetMethod\
      - DownloadActaGetMethod\
      - SendApprovalEmailPostMethod
}' "$TEMPLATE_FILE"

echo "✅ CloudFormation template fixed!"
echo "🔍 Run test-backend-proactive.sh to verify the fixes"
