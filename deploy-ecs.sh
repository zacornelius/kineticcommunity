#!/bin/bash

# ECS Deployment Script for Kinetic Community
# This script builds, pushes, and deploys the application to ECS

set -e

REGION="us-east-2"
ECR_REPO="885629328744.dkr.ecr.us-east-2.amazonaws.com/kinetic/community"
CLUSTER_NAME="kinetic-community-cluster"
SERVICE_NAME="kinetic-community-service"
TASK_FAMILY="kinetic-community"

# Generate version tag
VERSION_TAG=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="$ECR_REPO:$VERSION_TAG"

echo "🚀 Starting ECS deployment..."
echo "📌 Using image tag: $VERSION_TAG"

# Step 1: Login to ECR
echo "📦 Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO

# Step 2: Build Docker image for Linux/AMD64 (ECS Fargate requirement)
echo "🔨 Building Docker image for Linux/AMD64..."
docker buildx build --platform linux/amd64 -t $IMAGE_TAG --load .

# Step 3: Push to ECR
echo "⬆️  Pushing image to ECR..."
docker push $IMAGE_TAG

# Also tag as latest for convenience
docker tag $IMAGE_TAG $ECR_REPO:latest
docker push $ECR_REPO:latest || echo "⚠️  Could not push latest tag (may be immutable)"

# Step 4: Update task definition with new image
echo "📝 Updating task definition with new image..."
# Create temporary task definition file with new image
TEMP_TASK_DEF=$(mktemp)
cat ecs-task-definition.json | sed "s|885629328744.dkr.ecr.us-east-2.amazonaws.com/kinetic/community:latest|$IMAGE_TAG|g" > $TEMP_TASK_DEF

# Register new task definition
aws ecs register-task-definition \
  --cli-input-json file://$TEMP_TASK_DEF \
  --region $REGION

rm $TEMP_TASK_DEF

# Step 5: Update service (or create if it doesn't exist)
echo "🔄 Updating ECS service..."
TASK_DEFINITION=$(aws ecs describe-task-definition \
  --task-definition $TASK_FAMILY \
  --region $REGION \
  --query 'taskDefinition.revision' \
  --output text)

# Check if service exists
SERVICE_EXISTS=$(aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION \
  --query 'services[0].status' \
  --output text 2>/dev/null || echo "MISSING")

if [ "$SERVICE_EXISTS" = "MISSING" ] || [ "$SERVICE_EXISTS" = "None" ]; then
  echo "✨ Creating new ECS service..."
  # You'll need to provide subnets and security groups
  # Get default subnets
  SUBNET_IDS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=vpc-0414543f4020ba06c" \
    --query 'Subnets[0:2].SubnetId' \
    --output text \
    --region $REGION | tr '\t' ',')

  # Get default security group
  SECURITY_GROUP=$(aws ec2 describe-security-groups \
    --filters "Name=vpc-id,Values=vpc-0414543f4020ba06c" "Name=group-name,Values=default" \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --region $REGION)

  aws ecs create-service \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --task-definition $TASK_FAMILY:$TASK_DEFINITION \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP],assignPublicIp=ENABLED}" \
    --region $REGION
else
  echo "🔄 Updating existing service..."
  aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition $TASK_FAMILY:$TASK_DEFINITION \
    --force-new-deployment \
    --region $REGION
fi

echo "✅ Deployment complete!"
echo "📊 Check service status with:"
echo "   aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION"

