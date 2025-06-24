$RoleArn = "arn:aws:iam::703671891952:role/ProjectplaceLambdaRole"
$Region = "us-east-2"
$StackName = "acta-backend-staging"
$TemplateFile = "infra/template-core.yaml"

Write-Host "Assuming role: $RoleArn..."

$session = aws sts assume-role `
    --role-arn $RoleArn `
    --role-session-name "ActaDeploySession" | ConvertFrom-Json

$env:AWS_ACCESS_KEY_ID = $session.Credentials.AccessKeyId
$env:AWS_SECRET_ACCESS_KEY = $session.Credentials.SecretAccessKey
$env:AWS_SESSION_TOKEN = $session.Credentials.SessionToken

Write-Host "Deploying SAM stack..."

sam deploy `
    --template-file $TemplateFile `
    --stack-name $StackName `
    --capabilities CAPABILITY_IAM `
    --no-fail-on-empty-changeset `
    --region $Region

Write-Host "Fetching API URL from stack outputs..."

$invokeUrl = aws cloudformation describe-stacks `
    --region $Region `
    --stack-name $StackName `
    --query "Stacks[0].Outputs[?OutputKey=='ActaApiInvokeURL'].OutputValue" `
    --output text

Write-Host ""
Write-Host "Acta API URL:"
Write-Host $invokeUrl
