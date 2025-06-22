# SAM Deployment (Codex)

Use AWS SAM to attach the Acta Lambda functions to the existing REST API Gateway.
Credentials are provided via OIDC, so you do not need to manually configure AWS keys.

## 1. Deploy the core stack

Run `bash deploy-core.sh` or execute the command below. Replace
`<YOUR_OIDC_ROLE>` with the value of either the `AWS_ROLE_ARN` or
`OIDC_AWS_ROLE_ARN` environment variable.

```bash
sam deploy \
  --template-file infra/template-core.yaml \
  --stack-name acta-api-core-stack \
  --capabilities CAPABILITY_IAM \
  --region us-east-2 \
  --role-arn arn:aws:iam::703671891952:role/<YOUR_OIDC_ROLE>
```

After the stack finishes, note the `ActaApiId` and `ActaApiRootResourceId` outputs.
Export them so the wiring stack can reference the existing API.

```bash
export ACTA_API_ID=<copied-from-output>
export ACTA_API_ROOT_ID=<copied-from-output>
```

## 2. Deploy the wiring stack

After exporting `ACTA_API_ID` and `ACTA_API_ROOT_ID`, run `bash deploy-wiring.sh` or use the command below. Again replace `<YOUR_OIDC_ROLE>` with `AWS_ROLE_ARN` or `OIDC_AWS_ROLE_ARN`.

```bash
sam deploy \
  --template-file infra/template-wiring.yaml \
  --stack-name acta-api-wiring-stack \
  --capabilities CAPABILITY_IAM \
  --region us-east-2 \
  --role-arn arn:aws:iam::703671891952:role/<YOUR_OIDC_ROLE> \
  --parameter-overrides \
    ExistingApiId=$ACTA_API_ID \
    ExistingApiRootResourceId=$ACTA_API_ROOT_ID \
    GetTimelineArn=arn:aws:lambda:us-east-2:703671891952:function:GetTimeline \
    GetDownloadActaArn=arn:aws:lambda:us-east-2:703671891952:function:GetDownloadActa \
    GetProjectSummaryArn=arn:aws:lambda:us-east-2:703671891952:function:GetProjectSummary \
    SendApprovalEmailArn=arn:aws:lambda:us-east-2:703671891952:function:SendApprovalEmail \
    ProjectPlaceDataExtractorArn=arn:aws:lambda:us-east-2:703671891952:function:ProjectPlaceDataExtractor \
    HealthCheckArn=arn:aws:lambda:us-east-2:703671891952:function:HealthCheck
```

The API Gateway stack (`template-core.yaml`) should only be deployed once. GitHub
Actions will deploy `template-wiring.yaml` whenever the infrastructure needs to be
updated. This prevents accidental deletion of the REST API.
