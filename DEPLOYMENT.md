# Startup & Deployment Guide

## Quick Start (Single Command)

```bash
./dev-start.sh
```

This single script:
- ✅ Checks Node.js installation
- ✅ Frees up ports 3000 & 5001 (if in use)
- ✅ Installs dependencies (if needed)
- ✅ Starts backend on port 5001
- ✅ Starts frontend on port 3000
- ✅ Verifies both services are ready
- ✅ Shows status and endpoints

**Output:**
```
✓ Frontend:  http://localhost:3000
✓ Backend:   http://localhost:5001
```

Press `Ctrl+C` to stop all services.

---

## Development Setup

### Prerequisites
- Node.js 14+ ([Download](https://nodejs.org))
- Ollama (optional, for real translations)

### Option A: One-Command Startup (Recommended)
```bash
cd /Users/bhargav/Desktop/Live-Translate-Xu-Yuan
./dev-start.sh
```

### Option B: Manual Startup
**Terminal 1 - Backend:**
```bash
cd server
npm install  # Only needed first time
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm install  # Only needed first time
npm start
```

---

## Production Deployment Architecture

```
AWS Amplify (Frontend)          AWS ECS (Backend)         Ollama Server
    ↓                               ↓                          ↓
React App Bundle          →    Express API          →    LLM Inference
(Static hosting)          (Docker container)             (Model serving)
     ↑                           ↑                          ↑
CDN Cache            ALB + Auto-scaling          Dedicated EC2/GPU
```

### Component Breakdown

#### 1. Frontend - AWS Amplify
- **What it does:** Hosts your React app globally
- **Configuration:** `amplify.yml`
- **Environment:** Build-time API URL injection
- **Benefits:** 
  - Automatic CI/CD from Git
  - Global CDN with edge locations
  - HTTPS by default
  - Zero-config scalability

#### 2. Backend - AWS ECS
- **What it does:** Runs Express API in Docker containers
- **Configuration:** `server/Dockerfile`, ECS task definition
- **Environment:** Runtime variables (OLLAMA_API, FRONTEND_URL)
- **Benefits:**
  - Auto-scaling based on demand
  - Load balancing across multiple containers
  - Easy blue-green deployments
  - CloudWatch logging built-in

#### 3. Model Server - Ollama
- **What it does:** Handles LLM translation inference
- **Options:**
  - Standalone EC2 instance (separate from backend)
  - Within ECS cluster (requires GPU)
  - Separate Ollama service with internal networking
- **Benefits:**
  - Isolated resource consumption
  - Can scale independently
  - GPU acceleration (optional)

---

## Deployment Steps

### Phase 1: Prepare Code

1. **Create GitHub Repository**
   ```bash
   cd /Users/bhargav/Desktop/Live-Translate-Xu-Yuan
   git init
   git add .
   git commit -m "Initial commit: Live Translator"
   git remote add origin https://github.com/YOUR_USER/live-translator.git
   git push -u origin main
   ```

2. **Update Frontend Config**
   - Edit `client/.env.production`:
     ```env
     REACT_APP_API_URL=https://your-backend-domain.com
     ```

3. **Update Backend Config**
   - Create ECS environment variables (see below)

### Phase 2: Frontend Deployment (Amplify)

1. **Connect Repository to Amplify**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
   - Click "New app" → "Host web app"
   - Select GitHub and your repository
   - Select `main` branch

2. **Configure Build Settings**
   - Amplify will auto-detect `amplify.yml`
   - Review build commands (should be correct)
   - Click "Save and deploy"

3. **Set Environment Variables**
   - In Amplify Console: "Environment variables"
   - Add: `REACT_APP_API_URL` = `https://your-backend-domain.com`
   - Redeploy to apply

4. **Result**
   - Frontend available at: `https://your-app.amplifyapp.com`

### Phase 3: Backend Deployment (ECS)

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name live-translator --region us-east-1
   ```

2. **Build and Push Docker Image**
   ```bash
   # Get login token
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

   # Build image
   cd server
   docker build -t live-translator:latest .

   # Tag and push
   docker tag live-translator:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/live-translator:latest
   docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/live-translator:latest
   ```

3. **Create ECS Cluster**
   - Go to AWS ECS Console
   - Click "Create cluster"
   - Name: `live-translator-cluster`
   - Infrastructure: Fargate (simpler) or EC2 (more control)

4. **Create Task Definition**
   ```json
   {
     "family": "live-translator",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "containerDefinitions": [
       {
         "name": "live-translator",
         "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/live-translator:latest",
         "portMappings": [
           {
             "containerPort": 5001,
             "hostPort": 5001,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "PORT",
             "value": "5001"
           },
           {
             "name": "NODE_ENV",
             "value": "production"
           },
           {
             "name": "OLLAMA_API",
             "value": "http://ollama-internal:11434"
           },
           {
             "name": "OLLAMA_MODEL",
             "value": "mistral"
           },
           {
             "name": "FRONTEND_URL",
             "value": "https://your-app.amplifyapp.com"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/live-translator",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

5. **Create Service**
   - Cluster: `live-translator-cluster`
   - Task definition: `live-translator`
   - Service name: `live-translator-service`
   - Number of tasks: 2-3 (for redundancy)
   - Load balancer: Application Load Balancer
   - Target group port: 5001

6. **Configure ALB**
   - Listener: Port 443 (HTTPS)
   - Target group: Port 5001 to ECS tasks
   - Health check: `/health` endpoint
   - SSL certificate: Use ACM

7. **Result**
   - Backend available at: `https://api.your-domain.com` (via ALB)

### Phase 4: Model Server (Ollama)

**Option A: Standalone EC2 Instance**

```bash
# Launch t3.medium EC2 (or larger based on model)
# Ubuntu 22.04 AMI

# SSH into instance
ssh ubuntu@your-ec2-ip

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull model
ollama pull mistral

# Start Ollama (runs on port 11434)
OLLAMA_HOST=0.0.0.0:11434 ollama serve &

# Keep running in background with tmux or nohup
```

**Option B: ECS Service (Recommended for managed setup)**

Create separate ECS service for Ollama:
- Task: `ollama`
- Image: `ollama/ollama:latest`
- Memory: 8GB minimum
- CPU: 2-4 cores minimum
- Port: 11434
- Environment: `OLLAMA_MODEL=mistral`
- Service discovery: Internal DNS name `ollama-internal`

---

## Environment Variables Reference

### Backend (ECS Task Definition)

| Variable | Value | Example |
|----------|-------|---------|
| `PORT` | App port | `5001` |
| `NODE_ENV` | Environment | `production` |
| `OLLAMA_API` | Model server URL | `http://ollama-internal:11434` |
| `OLLAMA_MODEL` | Model name | `mistral` |
| `FRONTEND_URL` | Frontend domain | `https://app.amplifyapp.com` |

### Frontend (Amplify Environment Variables)

| Variable | Value | Example |
|----------|-------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://api.your-domain.com` |
| `NODE_ENV` | Environment | `production` |

---

## DNS & SSL Configuration

### Custom Domain Setup

1. **Purchase domain** (Route 53 or external registrar)

2. **Create Route 53 hosted zone** (if not using Route 53)

3. **Configure DNS records:**
   ```
   example.com          ALIAS  → Amplify custom domain
   api.example.com      ALIAS  → ALB DNS name
   ```

4. **SSL Certificates:**
   - Amplify: Automatic via AWS Certificate Manager
   - ALB: Create ACM certificate for `api.example.com`
   - Both: Auto-renewal enabled

---

## Monitoring & Logs

### CloudWatch Logs

**Backend logs:**
```bash
aws logs tail /ecs/live-translator --follow
```

**Access logs:**
```bash
# ALB access logs (S3 bucket)
aws s3 ls s3://your-alb-logs-bucket/
```

### Health Checks

**Test backend:**
```bash
curl https://api.your-domain.com/health
# Response: {"status":"Server is running"}
```

**Test Ollama connectivity:**
```bash
curl https://api.your-domain.com/api/ollama-status
# Add this endpoint to backend for debugging
```

---

## Cost Estimation (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| **Amplify** | 1GB data transfer | $1 |
| **ECS Fargate** | 256 CPU, 512 MB RAM, 2 tasks | $15-30 |
| **ALB** | 1 LB, minimal traffic | $20 |
| **EC2 (Ollama)** | t3.large, 730 hrs | $60-80 |
| **Data Transfer** | ~10GB | $1 |
| **CloudWatch** | Logs & monitoring | $5-10 |
| **Total** | | ~$100-150/month |

**Cost Optimization:**
- Use Fargate Spot (70% cheaper): $5-10/month
- Combine Ollama with backend on same instance
- Use NAT Gateway minimally to reduce data transfer

---

## Troubleshooting

### Frontend can't reach backend
```bash
# Check CORS settings
curl -H "Origin: https://your-app.amplifyapp.com" \
     -H "Access-Control-Request-Method: POST" \
     https://api.your-domain.com/health

# Check backend logs
aws logs tail /ecs/live-translator --follow
```

### Ollama connection fails
```bash
# Test from backend container
docker exec CONTAINER_ID curl http://ollama-internal:11434/api/tags

# Update OLLAMA_API env var in ECS task
```

### High latency
```bash
# Check task CPU/memory usage
aws ecs describe-tasks --cluster live-translator-cluster --tasks TASK_ARN

# Scale up: Increase task count or resource allocation
```

### SSL/TLS errors
```bash
# Check certificate
aws acm describe-certificate --certificate-arn ARN

# Renew manually if needed
aws acm request-certificate --domain-name api.your-domain.com
```

---

## Next Steps

1. ✅ Test locally with `./dev-start.sh`
2. ⬜ Push code to GitHub
3. ⬜ Set up Amplify (5 mins)
4. ⬜ Build Docker image (5 mins)
5. ⬜ Deploy to ECS (10 mins)
6. ⬜ Set up Ollama (10 mins)
7. ⬜ Configure DNS & SSL (15 mins)
8. ⬜ Test end-to-end (5 mins)

**Total deployment time: ~1 hour** (including waiting for builds)

---

## Additional Resources

- [Amplify Docs](https://docs.aws.amazon.com/amplify/)
- [ECS Docs](https://docs.aws.amazon.com/ecs/)
- [Ollama Docs](https://github.com/ollama/ollama)
- [CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md) - Detailed cloud architecture
