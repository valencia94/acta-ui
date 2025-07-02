#!/usr/bin/env python3

"""
ACTA-UI Cognito Custom Domain Deployment Script (Python)
=======================================================
This script deploys a custom domain for the existing Cognito User Pool
using boto3 and updates the application configuration accordingly.
"""

import json
import os
import sys
import time
import subprocess
from datetime import datetime

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
except ImportError:
    print("❌ boto3 not found. Installing...")
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'boto3'])
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError

# Configuration
STACK_NAME = "acta-ui-cognito-domain"
TEMPLATE_FILE = "infra/cognito-custom-domain.yaml"
REGION = "us-east-2"
USER_POOL_ID = "us-east-2_FyHLtOhiY"
DOMAIN_NAME = "acta-ui-prod"
CLOUDWATCH_POLICY_ID = "WDnzkPmx3dKaEAQgFKx2jj"

def log_info(message):
    print(f"ℹ️  {message}")

def log_success(message):
    print(f"✅ {message}")

def log_warning(message):
    print(f"⚠️  {message}")

def log_error(message):
    print(f"❌ {message}")

def main():
    print("🚀 ACTA-UI Cognito Custom Domain Deployment")
    print("============================================")
    
    try:
        # Initialize AWS clients
        log_info("Initializing AWS clients...")
        cf_client = boto3.client('cloudformation', region_name=REGION)
        sts_client = boto3.client('sts', region_name=REGION)
        
        # Check AWS credentials
        log_info("Checking AWS credentials...")
        identity = sts_client.get_caller_identity()
        aws_account = identity['Account']
        log_success(f"AWS Account: {aws_account}, Region: {REGION}")
        
        # Read template
        log_info("Reading CloudFormation template...")
        with open(TEMPLATE_FILE, 'r') as f:
            template_body = f.read()
        
        # Validate template
        log_info("Validating CloudFormation template...")
        cf_client.validate_template(TemplateBody=template_body)
        log_success("Template is valid")
        
        # Check if stack exists
        log_info("Checking if stack exists...")
        stack_exists = False
        try:
            cf_client.describe_stacks(StackName=STACK_NAME)
            stack_exists = True
            log_info("Stack exists, updating...")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ValidationError':
                log_info("Stack does not exist, creating...")
            else:
                raise
        
        # Deploy the stack
        log_info("Deploying Cognito custom domain...")
        parameters = [
            {
                'ParameterKey': 'CognitoUserPoolId',
                'ParameterValue': USER_POOL_ID
            },
            {
                'ParameterKey': 'DomainName',
                'ParameterValue': DOMAIN_NAME
            },
            {
                'ParameterKey': 'CloudWatchLogsPolicyId',
                'ParameterValue': CLOUDWATCH_POLICY_ID
            }
        ]
        
        if stack_exists:
            response = cf_client.update_stack(
                StackName=STACK_NAME,
                TemplateBody=template_body,
                Parameters=parameters,
                Capabilities=['CAPABILITY_IAM']
            )
        else:
            response = cf_client.create_stack(
                StackName=STACK_NAME,
                TemplateBody=template_body,
                Parameters=parameters,
                Capabilities=['CAPABILITY_IAM'],
                OnFailure='DELETE'
            )
        
        log_success("CloudFormation deployment initiated")
        
        # Wait for stack completion
        log_info("Waiting for stack deployment to complete...")
        waiter = cf_client.get_waiter('stack_create_complete' if not stack_exists else 'stack_update_complete')
        
        try:
            waiter.wait(
                StackName=STACK_NAME,
                WaiterConfig={
                    'Delay': 30,
                    'MaxAttempts': 60
                }
            )
            log_success("Stack deployment completed successfully")
        except Exception as e:
            log_error(f"Stack deployment failed or timed out: {e}")
            return False
        
        # Get stack outputs
        log_info("Retrieving stack outputs...")
        response = cf_client.describe_stacks(StackName=STACK_NAME)
        outputs = response['Stacks'][0].get('Outputs', [])
        
        # Save outputs to file
        with open('cognito-domain-outputs.json', 'w') as f:
            json.dump(outputs, f, indent=2)
        log_success("Stack outputs saved to cognito-domain-outputs.json")
        
        # Extract key values
        domain_url = None
        client_id = None
        login_url = None
        
        for output in outputs:
            if output['OutputKey'] == 'CognitoDomainURL':
                domain_url = output['OutputValue']
            elif output['OutputKey'] == 'CognitoUserPoolClientId':
                client_id = output['OutputValue']
            elif output['OutputKey'] == 'CognitoLoginURL':
                login_url = output['OutputValue']
        
        print()
        log_success("🎉 DEPLOYMENT COMPLETE!")
        print("========================")
        print(f"Domain URL: {domain_url}")
        print(f"Client ID: {client_id}")
        print(f"Login URL: {login_url}")
        print(f"Policy ID: {CLOUDWATCH_POLICY_ID}")
        print()
        
        # Update aws-exports.js
        if domain_url and client_id:
            log_info("Updating aws-exports.js configuration...")
            domain_only = domain_url.replace('https://', '').rstrip('/')
            
            # Create backup
            subprocess.run(['cp', 'src/aws-exports.js', 'src/aws-exports.js.backup'])
            
            # Read current file
            with open('src/aws-exports.js', 'r') as f:
                content = f.read()
            
            # Update domain and client ID
            import re
            content = re.sub(r"domain: '[^']*'", f"domain: '{domain_only}'", content)
            content = re.sub(r"aws_user_pools_web_client_id: '[^']*'", f"aws_user_pools_web_client_id: '{client_id}'", content)
            
            # Write updated file
            with open('src/aws-exports.js', 'w') as f:
                f.write(content)
            
            log_success("aws-exports.js updated successfully")
            log_info("Backup saved as src/aws-exports.js.backup")
        
        # Test the domain
        log_info("Testing custom domain accessibility...")
        import requests
        try:
            openid_config_url = f"{domain_url}/.well-known/openid_configuration"
            response = requests.get(openid_config_url, timeout=10)
            if response.status_code == 200:
                log_success("Custom domain is accessible")
            else:
                log_warning("Custom domain may not be ready yet (DNS propagation can take up to 60 minutes)")
        except Exception:
            log_warning("Custom domain may not be ready yet (DNS propagation can take up to 60 minutes)")
        
        # Summary
        print()
        log_success("🎯 DEPLOYMENT SUMMARY")
        print("=====================")
        print(f"✅ Custom domain deployed: {domain_url}")
        print(f"✅ Client ID updated: {client_id}")
        print(f"✅ CloudWatch Policy ID: {CLOUDWATCH_POLICY_ID}")
        print("✅ Configuration files updated")
        print()
        print("📋 Next Steps:")
        print("1. Wait for DNS propagation (up to 60 minutes)")
        print("2. Test authentication flow")
        print("3. Deploy frontend changes")
        print()
        print(f"🔗 Login URL: {login_url}")
        
        return True
        
    except NoCredentialsError:
        log_error("AWS credentials not found. Please configure AWS credentials.")
        return False
    except Exception as e:
        log_error(f"Deployment failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
