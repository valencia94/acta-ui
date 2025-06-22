#!/usr/bin/env bash
set -euo pipefail

ROLE="${AWS_ROLE_ARN:-${OIDC_AWS_ROLE_ARN:-}}"
[ -n "$ROLE" ] || { echo "AWS_ROLE_ARN or OIDC_AWS_ROLE_ARN must be set" >&2; exit 1; }
: "${ACTA_API_ID:?ACTA_API_ID not set}"
: "${ACTA_API_ROOT_ID:?ACTA_API_ROOT_ID not set}"

STACK_NAME="acta-api-wiring-stack"

sam deploy \
  --template-file infra/template-wiring.yaml \
  --stack-name "$STACK_NAME" \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset \
  --region us-east-2 \
  --role-arn "$ROLE" \
  --parameter-overrides \
    ExistingApiId="$ACTA_API_ID" \
    ExistingApiRootResourceId="$ACTA_API_ROOT_ID" \
    GetTimelineArn=arn:aws:lambda:us-east-2:703671891952:function:GetTimeline \
    GetDownloadActaArn=arn:aws:lambda:us-east-2:703671891952:function:GetDownloadActa \
    GetProjectSummaryArn=arn:aws:lambda:us-east-2:703671891952:function:GetProjectSummary \
    SendApprovalEmailArn=arn:aws:lambda:us-east-2:703671891952:function:SendApprovalEmail \
    ProjectPlaceDataExtractorArn=arn:aws:lambda:us-east-2:703671891952:function:ProjectPlaceDataExtractor \
    HealthCheckArn=arn:aws:lambda:us-east-2:703671891952:function:HealthCheck

aws cloudformation describe-stacks \
  --region us-east-2 \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ActaApiInvokeURL'].OutputValue" \
  --output text
