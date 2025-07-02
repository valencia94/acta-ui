#!/usr/bin/env bash
set -euo pipefail

ROLE="${AWS_ROLE_ARN:-${OIDC_AWS_ROLE_ARN:-}}"
[ -n "$ROLE" ] || { echo "AWS_ROLE_ARN or OIDC_AWS_ROLE_ARN must be set" >&2; exit 1; }

STACK_NAME="acta-api-core-stack"

sam deploy \
  --template-file infra/template-core.yaml \
  --stack-name "$STACK_NAME" \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset \
  --region us-east-2 \
  --role-arn "$ROLE"

aws cloudformation describe-stacks \
  --region us-east-2 \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ActaApiInvokeURL'].OutputValue" \
  --output text
