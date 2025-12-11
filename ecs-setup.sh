#!/bin/bash

# ECS Setup Script - Run this once to set up ECS infrastructure

set -e

REGION="us-east-2"
CLUSTER_NAME="kinetic-community-cluster"
LOG_GROUP="/ecs/kinetic-community"

echo "🔧 Setting up ECS infrastructure..."

# Step 1: Create ECS Cluster
echo "📦 Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name $CLUSTER_NAME \
  --region $REGION \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1

# Step 2: Create CloudWatch Log Group
echo "📝 Creating CloudWatch log group..."
aws logs create-log-group \
  --log-group-name $LOG_GROUP \
  --region $REGION \
  2>/dev/null || echo "Log group already exists"

echo "✅ ECS infrastructure setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up AWS Secrets Manager with your environment variables"
echo "2. Create IAM roles for ECS task execution and task roles"
echo "3. Set up RDS database (recommended) or use existing database"
echo "4. Run deploy-ecs.sh to deploy your application"





