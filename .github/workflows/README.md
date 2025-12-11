# GitHub Actions CI/CD Pipeline

This directory contains automated deployment workflows for the Kinetic Community app.

## Workflows

### 1. `deploy-production.yml`
**Triggers:** Push to `main` branch  
**Deploys to:** Production ECS cluster  
**Build time:** ~2-3 minutes (native AMD64)

### 2. `deploy-dev.yml`
**Triggers:** Push to `dev` branch  
**Deploys to:** Dev ECS cluster (currently same as prod)  
**Build time:** ~2-3 minutes (native AMD64)

## Setup Instructions

### 1. Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

### 2. Create IAM User for GitHub Actions

```bash
# Create IAM user
aws iam create-user --user-name github-actions-kinetic

# Attach policies (ECR, ECS, IAM for task definitions)
aws iam attach-user-policy --user-name github-actions-kinetic \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-user-policy --user-name github-actions-kinetic \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

# Create access key
aws iam create-access-key --user-name github-actions-kinetic
```

Copy the AccessKeyId and SecretAccessKey to GitHub secrets.

### 3. Create Dev Branch (Optional)

```bash
git checkout -b dev
git push -u origin dev
```

## Usage

### Deploy to Production
```bash
git checkout main
git add .
git commit -m "Your changes"
git push origin main
# GitHub Actions automatically builds and deploys!
```

### Deploy to Dev
```bash
git checkout dev
git add .
git commit -m "Testing feature"
git push origin dev
# GitHub Actions automatically builds and deploys to dev!
```

### Test Locally
```bash
npm run dev
# Test at http://localhost:3002
```

## Benefits

✅ **Fast builds** - 2-3 minutes (vs 10-30 min locally)  
✅ **Automatic** - Just push to git  
✅ **Native AMD64** - No cross-platform issues  
✅ **Free** - GitHub Actions is free for public repos  
✅ **Rollback** - Easy to revert to previous commit  
✅ **Logs** - See build logs in GitHub UI  

## Workflow Steps

1. **Checkout code** - Gets your latest code
2. **Configure AWS** - Authenticates with your AWS account
3. **Login to ECR** - Authenticates with your Docker registry
4. **Build & Push** - Builds Docker image and pushes to ECR
5. **Update task definition** - Creates new ECS task definition
6. **Deploy** - Updates ECS service with new image
7. **Wait for stability** - Ensures deployment succeeded

## Troubleshooting

### Build fails?
- Check GitHub Actions logs in the "Actions" tab
- Verify AWS credentials are correct
- Check ECR repository exists

### Deployment fails?
- Check ECS service events in AWS console
- Verify task definition is valid
- Check CloudWatch logs for container errors

### Need to rollback?
```bash
# Find previous working commit
git log

# Revert to that commit
git revert <commit-hash>
git push

# Or force push previous commit (careful!)
git reset --hard <commit-hash>
git push --force
```

## Next Steps

1. **Create separate dev cluster** - For true dev/prod isolation
2. **Add tests** - Run `npm test` before deploying
3. **Add Slack notifications** - Get notified when deploys finish
4. **Add preview environments** - Deploy PRs to temporary environments

