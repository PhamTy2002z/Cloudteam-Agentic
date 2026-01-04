# Deployment Guide - AI Toolkit Sync Platform

**Last Updated:** 2026-01-03
**Version:** 0.1.0
**Status:** Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Management](#database-management)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)
10. [Security Checklist](#security-checklist)

---

## Overview

AI Toolkit Sync Platform is a full-stack TypeScript application with separate backend (NestJS) and frontend (Next.js) components. This guide covers deployment strategies for development, staging, and production environments.

### Architecture Overview
- **Backend:** NestJS 10 API server (Port 3001)
- **Frontend:** Next.js 14 web application (Port 3000)
- **Database:** PostgreSQL 16
- **Real-time:** WebSocket via NestJS Gateway
- **Containerization:** Docker & Docker Compose

---

## Prerequisites

### System Requirements
- Node.js 20+ (LTS recommended)
- pnpm 9.0+ (package manager)
- Docker 20.10+ (for containerization)
- Docker Compose 2.0+ (for orchestration)
- Git 2.30+ (for version control)

### Required Credentials
- GitHub Personal Access Token (for repository integration)
- Database credentials (PostgreSQL)
- Encryption key (32-byte hex string for AES-256-GCM)
- API keys for external services (if applicable)

### Network Requirements
- Port 3000 (frontend) - accessible to users
- Port 3001 (backend) - accessible to frontend
- Port 5432 (PostgreSQL) - accessible to backend
- Port 5555 (Prisma Studio) - accessible for development only

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/ai-toolkit-sync-platform.git
cd ai-toolkit-sync-platform
```

### 2. Install Dependencies

```bash
# Install all dependencies for monorepo
pnpm install

# Verify installation
pnpm --version
node --version
```

### 3. Configure Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL=postgresql://aitoolkit:aitoolkit_dev@localhost:5432/aitoolkit?schema=public

# Backend
PORT=3001
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# GitHub Integration
GITHUB_TOKEN=ghp_your_token_here

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-key-here
```

### 4. Start PostgreSQL

```bash
# Start PostgreSQL container
docker-compose up -d

# Verify container is running
docker-compose ps

# Check database health
docker-compose exec postgres pg_isready
```

### 5. Initialize Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed
```

### 6. Start Development Servers

```bash
# Start both backend and frontend in parallel
pnpm dev

# Or start individually
pnpm dev:backend    # Terminal 1
pnpm dev:frontend   # Terminal 2
```

### 7. Verify Setup

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Prisma Studio: http://localhost:5555 (run `pnpm db:studio`)

---

## Production Deployment

### Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Cloudflare CDN / CDN             │
│    (Static assets, DDoS protection)      │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Load Balancer (NGINX/HAProxy)      │
│   (Round-robin, health checks, SSL)     │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   ┌────▼─────┐      ┌────▼─────┐
   │ Backend  │      │ Backend  │
   │Instance 1│      │Instance 2│
   └────┬─────┘      └────┬─────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  PostgreSQL     │
        │  Primary (RDS)  │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  PostgreSQL     │
        │  Replica (RO)   │
        └─────────────────┘
```

### 1. Build Docker Images

```bash
# Build backend image
docker build -t ai-toolkit-backend:0.1.0 ./apps/backend

# Build frontend image
docker build -t ai-toolkit-frontend:0.1.0 ./apps/frontend

# Tag for registry
docker tag ai-toolkit-backend:0.1.0 your-registry/ai-toolkit-backend:0.1.0
docker tag ai-toolkit-frontend:0.1.0 your-registry/ai-toolkit-frontend:0.1.0

# Push to registry
docker push your-registry/ai-toolkit-backend:0.1.0
docker push your-registry/ai-toolkit-frontend:0.1.0
```

### 2. Production Environment Configuration

Create `.env.production`:

```bash
# Database (RDS)
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/aitoolkit?schema=public

# Backend
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# GitHub Integration
GITHUB_TOKEN=ghp_production_token

# Encryption
ENCRYPTION_KEY=your-production-32-byte-hex-key

# Security
CORS_ORIGIN=https://yourdomain.com
API_RATE_LIMIT=100

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

### 3. Database Migration (Production)

```bash
# Run migrations on production database
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/aitoolkit \
  pnpm db:migrate:deploy

# Verify migration status
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/aitoolkit \
  pnpm db:migrate:status
```

### 4. Deploy Backend

#### Option A: Docker Compose (Small Scale)

```bash
# Create docker-compose.prod.yml
version: '3.8'
services:
  backend:
    image: your-registry/ai-toolkit-backend:0.1.0
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NODE_ENV: production
      PORT: 3001
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: your-registry/ai-toolkit-frontend:0.1.0
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    restart: always
    depends_on:
      - backend

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

#### Option B: Kubernetes (Large Scale)

```bash
# Create deployment manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/ingress.yaml

# Verify deployment
kubectl get pods -n ai-toolkit
kubectl get services -n ai-toolkit
```

### 5. Deploy Frontend

```bash
# Build static export
cd apps/frontend
pnpm build

# Deploy to CDN or static hosting
# Option 1: Vercel
vercel deploy --prod

# Option 2: AWS S3 + CloudFront
aws s3 sync .next/static s3://your-bucket/static/
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"

# Option 3: Netlify
netlify deploy --prod --dir=.next
```

### 6. Configure Load Balancer

```nginx
# NGINX configuration
upstream backend {
    server backend1:3001;
    server backend2:3001;
}

upstream frontend {
    server frontend1:3000;
    server frontend2:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Environment Configuration

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `PORT` | No | 3001 | Backend server port |
| `NODE_ENV` | No | development | Environment (development, staging, production) |
| `CORS_ORIGIN` | No | http://localhost:3000 | CORS allowed origins |
| `GITHUB_TOKEN` | No | - | GitHub Personal Access Token |
| `ENCRYPTION_KEY` | Yes | - | 32-byte hex key for AES-256-GCM |
| `LOG_LEVEL` | No | info | Logging level (error, warn, info, debug) |
| `API_RATE_LIMIT` | No | 100 | Requests per minute per API key |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | http://localhost:3001 | Backend API URL |
| `NEXT_PUBLIC_ENV` | No | development | Environment (development, staging, production) |

### Encryption Key Generation

```bash
# Generate 32-byte hex key
openssl rand -hex 32

# Output example:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## Database Management

### Backup Strategy

```bash
# Manual backup
pg_dump -h localhost -U aitoolkit aitoolkit > backup-$(date +%Y%m%d-%H%M%S).sql

# Automated backup (cron job)
0 2 * * * pg_dump -h localhost -U aitoolkit aitoolkit | gzip > /backups/aitoolkit-$(date +\%Y\%m\%d).sql.gz

# AWS RDS backup
aws rds create-db-snapshot \
  --db-instance-identifier aitoolkit-prod \
  --db-snapshot-identifier aitoolkit-backup-$(date +%Y%m%d-%H%M%S)
```

### Restore from Backup

```bash
# Restore from SQL dump
psql -h localhost -U aitoolkit aitoolkit < backup-20260103-120000.sql

# Restore from AWS RDS snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier aitoolkit-restored \
  --db-snapshot-identifier aitoolkit-backup-20260103-120000
```

### Database Maintenance

```bash
# Analyze query performance
ANALYZE;

# Vacuum and analyze
VACUUM ANALYZE;

# Reindex tables
REINDEX DATABASE aitoolkit;

# Check database size
SELECT pg_size_pretty(pg_database_size('aitoolkit'));
```

---

## Monitoring & Logging

### Application Monitoring

```bash
# Health check endpoint
curl http://localhost:3001/api/health

# Response:
# {
#   "status": "ok",
#   "timestamp": "2026-01-03T22:00:00Z",
#   "uptime": 3600,
#   "database": "connected"
# }
```

### Logging Configuration

```typescript
// Backend logging (Winston)
import { Logger } from '@nestjs/common';

const logger = new Logger('AppModule');
logger.log('Application started');
logger.warn('Warning message');
logger.error('Error message', error.stack);
```

### Monitoring Stack

```bash
# Prometheus metrics
curl http://localhost:3001/metrics

# Grafana dashboards
# Access: http://localhost:3000/grafana

# ELK Stack (Elasticsearch, Logstash, Kibana)
# Logs: http://localhost:5601
```

### Alert Configuration

```yaml
# Prometheus alerts
groups:
  - name: ai-toolkit
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseConnectionPoolExhausted
        expr: db_connection_pool_available < 2
        for: 1m
        annotations:
          summary: "Database connection pool exhausted"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.5
        for: 5m
        annotations:
          summary: "High API response time"
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check PostgreSQL status
docker-compose ps postgres

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# View logs
docker-compose logs postgres
```

#### 2. Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Verify environment variables
env | grep DATABASE_URL

# Check port availability
lsof -i :3001

# Restart service
docker-compose restart backend
```

#### 3. Frontend Build Fails

```bash
# Clear cache
rm -rf .next node_modules
pnpm install

# Rebuild
pnpm build

# Check for TypeScript errors
pnpm type-check
```

#### 4. WebSocket Connection Issues

```bash
# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:3001/socket.io

# Check CORS configuration
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  http://localhost:3001/api/health
```

### Debug Mode

```bash
# Backend debug mode
DEBUG=* pnpm dev:backend

# Frontend debug mode
NODE_OPTIONS='--inspect' pnpm dev:frontend

# Database query logging
DATABASE_LOG=query pnpm dev:backend
```

---

## Rollback Procedures

### Application Rollback

```bash
# Rollback to previous Docker image
docker-compose down
docker-compose -f docker-compose.prod.yml up -d \
  --image your-registry/ai-toolkit-backend:0.0.9

# Verify rollback
curl http://localhost:3001/api/health
```

### Database Rollback

```bash
# List migrations
pnpm db:migrate:status

# Rollback last migration
pnpm db:migrate:resolve --rolled-back 20260103120000_add_feature

# Restore from backup
psql -h localhost -U aitoolkit aitoolkit < backup-20260102-120000.sql
```

### Zero-Downtime Deployment

```bash
# 1. Deploy new backend instance
docker-compose up -d backend-v2

# 2. Run database migrations
docker-compose exec backend-v2 pnpm db:migrate:deploy

# 3. Update load balancer to route to new instance
# (Update NGINX/HAProxy configuration)

# 4. Verify new instance is healthy
curl http://localhost:3001/api/health

# 5. Drain connections from old instance
# (Set max_connections to 0)

# 6. Stop old instance
docker-compose stop backend-v1

# 7. Remove old instance
docker-compose rm backend-v1
```

---

## Security Checklist

### Pre-Deployment Security Review

- [ ] All secrets stored in environment variables (not in code)
- [ ] HTTPS/TLS enabled for all endpoints
- [ ] CORS configured with specific origins
- [ ] API rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified (Prisma parameterization)
- [ ] XSS prevention verified (React escaping)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization implemented
- [ ] Audit logging enabled
- [ ] Database backups configured
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Security headers configured

### Security Headers

```nginx
# NGINX security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" always;
```

### SSL/TLS Configuration

```bash
# Generate self-signed certificate (development only)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Generate certificate signing request (production)
openssl req -new -newkey rsa:4096 -keyout private.key -out request.csr

# Verify certificate
openssl x509 -in cert.pem -text -noout
```

---

## Performance Optimization

### Backend Optimization

```bash
# Enable compression
NODE_ENV=production pnpm build

# Configure connection pooling
DATABASE_POOL_SIZE=20

# Enable caching
REDIS_URL=redis://localhost:6379
```

### Frontend Optimization

```bash
# Build static export
pnpm build

# Analyze bundle size
pnpm analyze

# Enable compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

---

## Maintenance Schedule

### Daily
- Monitor application logs
- Check system health metrics
- Verify backup completion

### Weekly
- Review security logs
- Analyze performance metrics
- Update dependencies (if needed)

### Monthly
- Full system backup
- Security audit
- Performance review
- Capacity planning

### Quarterly
- Disaster recovery drill
- Security penetration testing
- Architecture review

---

## Support & Escalation

### Support Channels
- Email: support@yourdomain.com
- Slack: #ai-toolkit-support
- GitHub Issues: https://github.com/your-org/ai-toolkit-sync-platform/issues

### Escalation Path
1. Level 1: Support team (response time: 1 hour)
2. Level 2: Engineering team (response time: 30 minutes)
3. Level 3: On-call engineer (response time: 15 minutes)

---

## References

- System Architecture: `docs/system-architecture.md`
- Code Standards: `docs/code-standards.md`
- Project Overview: `docs/project-overview-pdr.md`
- Testing Guide: `TESTING.md`
