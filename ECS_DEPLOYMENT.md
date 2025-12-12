# ECS Deployment Guide for Kinetic Community

This guide covers deploying the Kinetic Community app to AWS ECS (Elastic Container Service) using Fargate.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Docker installed (for building images)
- An ECR repository (already exists: `kinetic/community`)
- RDS PostgreSQL database (recommended) or existing database
- AWS Secrets Manager for storing sensitive environment variables

## Step 1: Set Up ECS Infrastructure

Run the setup script to create the ECS cluster and CloudWatch log group:

```bash
chmod +x ecs-setup.sh
./ecs-setup.sh
```

This will create:
- ECS cluster: `kinetic-community-cluster`
- CloudWatch log group: `/ecs/kinetic-community`

## Step 2: Create IAM Roles

ECS requires two IAM roles:

### Task Execution Role
This role allows ECS to pull images from ECR and write logs to CloudWatch.

```bash
# Create the role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach the managed policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Allow access to Secrets Manager
aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name SecretsManagerAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-2:885629328744:secret:kinetic-community/*"
    }]
  }'
```

### Task Role (Optional)
For tasks that need to access AWS services (S3, SES, etc.):

```bash
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policies for S3 and SES access
aws iam attach-role-policy \
  --role-name ecsTaskRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name ecsTaskRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess
```

## Step 3: Set Up AWS Secrets Manager

Store your environment variables in AWS Secrets Manager. You can create secrets individually or use a JSON secret:

```bash
# Create secrets (replace values with your actual credentials)
aws secretsmanager create-secret \
  --name kinetic-community/database-url \
  --secret-string "postgresql://user:password@your-rds-endpoint:5432/kineticcommunity" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/shadow-database-url \
  --secret-string "postgresql://user:password@your-rds-endpoint:5432/kineticcommunity_shadow" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/auth-secret \
  --secret-string "your-nextauth-secret" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/url \
  --secret-string "https://yourdomain.com" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/aws-region \
  --secret-string "us-east-2" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/s3-bucket-name \
  --secret-string "your-s3-bucket-name" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/s3-access-key-id \
  --secret-string "your-s3-access-key-id" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/s3-secret-access-key \
  --secret-string "your-s3-secret-access-key" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/s3-canonical-user-id \
  --secret-string "your-s3-canonical-user-id" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/ses-access-key-id \
  --secret-string "your-ses-access-key-id" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/ses-secret-access-key \
  --secret-string "your-ses-secret-access-key" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/vapid-public-key \
  --secret-string "your-vapid-public-key" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/vapid-private-key \
  --secret-string "your-vapid-private-key" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/vapid-email \
  --secret-string "mailto:notifications@yourdomain.com" \
  --region us-east-2

aws secretsmanager create-secret \
  --name kinetic-community/next-public-vapid-public-key \
  --secret-string "your-vapid-public-key" \
  --region us-east-2
```

**Note:** Update the ARNs in `ecs-task-definition.json` if your account ID or region differs.

## Step 4: Set Up RDS Database (Recommended)

If you don't have an RDS instance yet:

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier kinetic-community-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password YourSecurePassword \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-0635a9f3add95bc45 \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --region us-east-2
```

Wait for the instance to be available, then update your Secrets Manager secrets with the RDS endpoint.

## Step 5: Update Task Definition

Before deploying, update `ecs-task-definition.json`:

1. Verify the ECR image URI matches your repository
2. Update Secret ARNs if your account ID or region differs
3. Adjust CPU/memory if needed (512 CPU units = 0.5 vCPU, 1024 MB = 1 GB RAM)

## Step 6: Deploy to ECS

Make the deployment script executable and run it:

```bash
chmod +x deploy-ecs.sh
./deploy-ecs.sh
```

This script will:
1. Build the Docker image
2. Push it to ECR
3. Register a new task definition
4. Create or update the ECS service

## Step 7: Set Up Application Load Balancer (Optional but Recommended)

For production, set up an ALB to handle traffic:

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name kinetic-community-alb \
  --subnets subnet-067c8520d11b3ef70 subnet-0f0ebb52075184de5 \
  --security-groups sg-0635a9f3add95bc45 \
  --region us-east-2

# Create target group
aws elbv2 create-target-group \
  --name kinetic-community-tg \
  --protocol HTTP \
  --port 3002 \
  --vpc-id vpc-0414543f4020ba06c \
  --target-type ip \
  --health-check-path /api/health \
  --region us-east-2

# Create listener (replace ALB_ARN and TARGET_GROUP_ARN)
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<TARGET_GROUP_ARN> \
  --region us-east-2
```

Then update your ECS service to use the target group:

```bash
aws ecs update-service \
  --cluster kinetic-community-cluster \
  --service kinetic-community-service \
  --load-balancers targetGroupArn=<TARGET_GROUP_ARN>,containerName=kinetic-community-app,containerPort=3002 \
  --region us-east-2
```

## Step 8: Create Health Check Endpoint

Add a health check endpoint to your Next.js app:

Create `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

## Monitoring and Logs

View logs:
```bash
aws logs tail /ecs/kinetic-community --follow --region us-east-2
```

Check service status:
```bash
aws ecs describe-services \
  --cluster kinetic-community-cluster \
  --services kinetic-community-service \
  --region us-east-2
```

## Updating the Application

To update your application:

1. Make code changes
2. Run `./deploy-ecs.sh` again
3. ECS will perform a rolling update with zero downtime

## Scaling

Scale your service:

```bash
aws ecs update-service \
  --cluster kinetic-community-cluster \
  --service kinetic-community-service \
  --desired-count 2 \
  --region us-east-2
```

## Cost Optimization

- Use Fargate Spot for non-production environments (50-70% cost savings)
- Right-size CPU and memory based on actual usage
- Use CloudWatch metrics to monitor resource utilization

## Troubleshooting

- **Task fails to start**: Check CloudWatch logs and IAM role permissions
- **Cannot pull image**: Verify ECR repository permissions and task execution role
- **Database connection fails**: Check security group rules and RDS endpoint
- **Secrets not loading**: Verify Secrets Manager ARNs and task execution role permissions






