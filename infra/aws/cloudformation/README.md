# AWS CloudFormation

This stack provisions the AWS infrastructure for the project.

## What It Creates

- A versioned S3 bucket (for web assets/backups)
- An IAM user with `bedrock:InvokeModel` permission for Claude Haiku

**Note:** The database is hosted on Supabase (free tier) — no AWS RDS is needed.

## Prerequisites

1. Install and authenticate AWS CLI.
2. Set your default region and verify identity:

```powershell
aws configure
aws sts get-caller-identity
```

## Deploy

```powershell
aws cloudformation create-stack `
  --stack-name path-of-function-dev `
  --template-body file://infra/aws/cloudformation/template.yaml `
  --parameters file://infra/aws/cloudformation/deployment.dev.parameters.json `
  --capabilities CAPABILITY_IAM
aws cloudformation wait stack-create-complete --stack-name path-of-function-dev
```

## Update

```powershell
aws cloudformation update-stack `
  --stack-name path-of-function-dev `
  --template-body file://infra/aws/cloudformation/template.yaml `
  --parameters file://infra/aws/cloudformation/deployment.dev.parameters.json `
  --capabilities CAPABILITY_IAM
aws cloudformation wait stack-update-complete --stack-name path-of-function-dev
```

## Destroy

```powershell
aws cloudformation delete-stack --stack-name path-of-function-dev
aws cloudformation wait stack-delete-complete --stack-name path-of-function-dev
```

## Get Outputs (access key for Vercel env vars)

```powershell
aws cloudformation describe-stacks --stack-name path-of-function-dev --query "Stacks[0].Outputs" --output table
```

Copy `BedrockAccessKeyId` and `BedrockSecretAccessKey` into Vercel environment variables:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION=us-east-1`
- `BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0`

## Notes

- The `--capabilities CAPABILITY_IAM` flag is required because the stack creates an IAM user.
- The Bedrock IAM policy restricts invocation to Claude Haiku models only.
- For production, consider using IAM roles instead of long-lived access keys.
