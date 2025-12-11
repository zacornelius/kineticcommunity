#!/bin/bash

# Setup script for GitHub Actions CI/CD
# Run this to create the IAM user and get credentials for GitHub

set -e

echo "🚀 Setting up GitHub Actions for Kinetic Community"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured"
echo ""

# Create IAM user
echo "📝 Creating IAM user 'github-actions-kinetic'..."
if aws iam get-user --user-name github-actions-kinetic &> /dev/null; then
    echo "⚠️  User already exists, skipping creation"
else
    aws iam create-user --user-name github-actions-kinetic
    echo "✅ User created"
fi
echo ""

# Attach policies
echo "🔐 Attaching IAM policies..."
aws iam attach-user-policy --user-name github-actions-kinetic \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser 2>/dev/null || true
aws iam attach-user-policy --user-name github-actions-kinetic \
    --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess 2>/dev/null || true
echo "✅ Policies attached"
echo ""

# Create access key
echo "🔑 Creating access key..."
ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name github-actions-kinetic 2>&1)

if echo "$ACCESS_KEY_OUTPUT" | grep -q "EntityAlreadyExists"; then
    echo "⚠️  Access key already exists. Delete old keys first if you need new ones:"
    echo "   aws iam list-access-keys --user-name github-actions-kinetic"
    echo "   aws iam delete-access-key --user-name github-actions-kinetic --access-key-id <KEY_ID>"
    exit 1
fi

ACCESS_KEY_ID=$(echo "$ACCESS_KEY_OUTPUT" | jq -r '.AccessKey.AccessKeyId')
SECRET_ACCESS_KEY=$(echo "$ACCESS_KEY_OUTPUT" | jq -r '.AccessKey.SecretAccessKey')

echo "✅ Access key created"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 ADD THESE SECRETS TO GITHUB:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo ""
echo "2. Click 'New repository secret' and add:"
echo ""
echo "   Name: AWS_ACCESS_KEY_ID"
echo "   Value: $ACCESS_KEY_ID"
echo ""
echo "   Name: AWS_SECRET_ACCESS_KEY"
echo "   Value: $SECRET_ACCESS_KEY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  SAVE THESE CREDENTIALS NOW - They won't be shown again!"
echo ""
echo "After adding secrets to GitHub, push to main branch to trigger deployment:"
echo "  git add .github/"
echo "  git commit -m 'Add GitHub Actions CI/CD'"
echo "  git push origin main"
echo ""
echo "✅ Setup complete!"

