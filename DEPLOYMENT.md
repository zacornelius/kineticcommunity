# Deployment Guide

This guide covers multiple deployment options for the Kinetic Community app.

## Prerequisites

- Node.js 20+
- PostgreSQL database
- AWS S3 bucket (for file storage)
- AWS SES (for email)
- VAPID keys (for push notifications)

## Option 1: Docker on EC2 (Recommended for Full Control)

### 1. Set up EC2 Instance

1. Launch an EC2 instance (Ubuntu 22.04 LTS recommended)
2. Configure security groups:
   - Port 22 (SSH)
   - Port 3002 (HTTP)
   - Port 80/443 (if using a reverse proxy)
3. Connect via SSH

### 2. Install Docker on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Clone and Deploy

```bash
# Clone repository
git clone https://github.com/zacornelius/kineticcommunity.git
cd kineticcommunity

# Create .env file with all required variables
nano .env

# Build and run with Docker Compose
docker compose up -d --build

# View logs
docker compose logs -f
```

### 4. Set up Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/kineticcommunity
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kineticcommunity /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 5. Set up PM2 (Alternative to Docker)

If you prefer PM2 for process management:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Build the app
npm install
npm run build

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start npm --name "kinetic-community" -- start
pm2 save
pm2 startup
```

## Option 2: Vercel (Easiest for Next.js)

**Pros:**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Easy CI/CD

**Cons:**
- Requires external PostgreSQL (Neon, Supabase, etc.)
- Service workers might need special configuration
- Serverless functions have execution time limits

### Steps:

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Note:** You'll need to use an external PostgreSQL database (like Neon, Supabase, or Railway).

## Option 3: Railway (Easy Platform)

**Pros:**
- Simple deployment
- Built-in PostgreSQL
- Automatic HTTPS
- Good for small to medium apps

**Steps:**

1. Sign up at [railway.app](https://railway.app)
2. Create new project from GitHub
3. Add PostgreSQL service
4. Set environment variables
5. Deploy

## Option 4: AWS ECS/Fargate (Scalable)

**Pros:**
- Fully managed containers
- Auto-scaling
- Integrated with AWS services
- Production-ready

**Cons:**
- More complex setup
- Higher cost for small apps

## Environment Variables

Make sure to set all these in your deployment:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
SHADOW_DATABASE_URL=postgresql://user:password@host:5432/shadow_db

# NextAuth
AUTH_SECRET=your-secret-key
URL=https://your-domain.com

# AWS S3
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_CANONICAL_USER_ID=your-canonical-user-id

# AWS SES
SES_ACCESS_KEY_ID=your-access-key
SES_SECRET_ACCESS_KEY=your-secret-key

# Push Notifications
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_EMAIL=mailto:your-email@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key

# OAuth (if using)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
# ... etc for other providers
```

## Database Migrations

After deployment, run migrations:

```bash
# With Docker
docker compose exec app npx prisma migrate deploy

# Without Docker
npx prisma migrate deploy
```

## Monitoring

### With PM2:
```bash
pm2 monit
pm2 logs
```

### With Docker:
```bash
docker compose logs -f app
```

## Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose up -d --build

# Or with PM2
npm run build
pm2 restart kinetic-community
```

## Database Persistence & Backups

### How Persistence Works

The PostgreSQL database uses a Docker volume (`postgres_data`) that persists data even when containers are stopped or removed. The data is stored on the host machine in Docker's volume directory.

### Backup Database

```bash
# Create a backup
docker compose exec db pg_dump -U postgres kineticcommunity > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using docker directly
docker exec $(docker compose ps -q db) pg_dump -U postgres kineticcommunity > backup.sql
```

### Restore Database

```bash
# Restore from backup
docker compose exec -T db psql -U postgres kineticcommunity < backup.sql

# Or using docker directly
docker exec -i $(docker compose ps -q db) psql -U postgres kineticcommunity < backup.sql
```

### View Volume Location

```bash
# Find where the volume is stored
docker volume inspect kineticcommunity_postgres_data
```

### Backup Volume Directly

```bash
# Stop the database
docker compose stop db

# Backup the volume
docker run --rm -v kineticcommunity_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Start the database
docker compose start db
```

### Restore Volume

```bash
# Stop the database
docker compose stop db

# Remove old volume (WARNING: This deletes data!)
docker compose down -v

# Restore from backup
docker run --rm -v kineticcommunity_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /

# Start services
docker compose up -d
```

### Production Recommendation

For production, consider using a managed PostgreSQL service instead of Docker:

- **AWS RDS** - Fully managed, automated backups, high availability
- **Neon** - Serverless PostgreSQL with branching
- **Supabase** - PostgreSQL with additional features
- **Railway PostgreSQL** - Simple managed database

To use an external database, simply:
1. Remove the `db` service from docker-compose.yml
2. Update `DATABASE_URL` to point to your external database
3. Run migrations: `npx prisma migrate deploy`

## Troubleshooting

1. **Port already in use**: Change the port in docker-compose.yml or use a different port
2. **Database connection errors**: Check DATABASE_URL and ensure database is accessible
3. **S3 upload errors**: Verify AWS credentials and bucket permissions
4. **Push notifications not working**: Ensure VAPID keys are set correctly and service worker is registered
5. **Data loss after container removal**: Make sure you're using volumes (which we are) - data only lost if you run `docker compose down -v`

