import boto3
import json
import sys

ROLE_NAME = "GitHubActionsDeployRole"
ACCOUNT_ID = "703671891952"
REPO = "valencia94/acta-ui"
REGION = "us-east-2"
CODEBUILD_PROJECT = "acta-ui-deployment"


def role_exists(iam_client, name):
    try:
        iam_client.get_role(RoleName=name)
        return True
    except iam_client.exceptions.NoSuchEntityException:
        return False


def create_role(iam_client):
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Federated": f"arn:aws:iam::{ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
                },
                "Action": "sts:AssumeRoleWithWebIdentity",
                "Condition": {
                    "StringLike": {
                        "token.actions.githubusercontent.com:sub": f"repo:{REPO}:*"
                    },
                    "StringEquals": {
                        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                    }
                }
            }
        ]
    }

    response = iam_client.create_role(
        RoleName=ROLE_NAME,
        AssumeRolePolicyDocument=json.dumps(trust_policy),
        Description="Role for GitHub Actions deployments via CodeBuild",
    )
    return response["Role"]


def attach_policy(iam_client):
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "codebuild:StartBuild",
                "Resource": f"arn:aws:codebuild:{REGION}:{ACCOUNT_ID}:project/{CODEBUILD_PROJECT}",
            }
        ],
    }

    iam_client.put_role_policy(
        RoleName=ROLE_NAME,
        PolicyName="CodeBuildTriggerPolicy",
        PolicyDocument=json.dumps(policy_document),
    )


def main():
    iam_client = boto3.client("iam")

    if role_exists(iam_client, ROLE_NAME):
        print(f"IAM role '{ROLE_NAME}' already exists. Skipping creation.")
    else:
        role = create_role(iam_client)
        print(f"Created role: {role['Arn']}")

    attach_policy(iam_client)
    print(
        f"Role ready for use: arn:aws:iam::{ACCOUNT_ID}:role/{ROLE_NAME}\n"
        "Add this ARN to your GitHub Actions secrets."
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}")
        sys.exit(1)

