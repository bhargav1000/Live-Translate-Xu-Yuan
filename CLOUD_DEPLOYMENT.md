# Cloud Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cloud Setup                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (Amplify)                   Backend (ECS)        │
│  ┌─────────────────┐                  ┌──────────────┐    │
│  │ React App       │◄────────────────►│ Express API  │    │
│  │ Speech-to-Text  │   HTTPS          │ Translation  │    │
│  │ (Web Speech API)│                  │              │    │
│  └─────────────────┘                  └──────────────┘    │
│       │                                      │             │
│       │ Hosted on Amplify                    │ Calls       │
│       │ (Static + CI/CD)                     │ Ollama      │
│       │                                      │             │
│       └──────────────────────────────────────┘             │
│                                                             │
│  Ollama Model Server (Separate Service)                   │
│  ┌────────────────────────────────────┐                   │
│  │ Ollama / Model Serving             │                   │
│  │ - Mistral or other LLM             │                   │
│  │ - Can run on GPU instance          │                   │
│  │ - Port 11434                       │                   │
│  └────────────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Frontend - AWS Amplify
- Static React app hosted on Amplify
- Automatic CI/CD deployment
- Global CDN distribution
- Environment-based API endpoints

### 2. Backend - AWS ECS
- Docker container running Express.js
- Auto-scaling capabilities
- Environment variables for Ollama endpoint
- Your custom Docker configuration

### 3. Model Server - Ollama
- Can run on a separate EC2 instance or within ECS
- Handles all LLM inference
- Isolated from main API for performance

---

## Deployment Steps

### Frontend Deployment (Amplify)

1. **Push code to GitHub/CodeCommit**
   ```bash
   git add .
   git commit -m "Live Translator App"
   git push origin main
   ```

2. **Connect to Amplify**
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Select your Git repository
   - Configure build settings:

   ```yaml
   # amplify.yml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd client
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: client/build
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Set Environment Variables in Amplify**
   - Backend API URL: `https://your-backend-domain.com`
   - Update `client/src/App.js` to use: `process.env.REACT_APP_API_URL`

### Backend Deployment (ECS)

1. **Create Dockerfile** (you have custom config, so structure your app)
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY server/package*.json ./
   RUN npm ci --only=production
   COPY server .
   EXPOSE 5001
   CMD ["npm", "start"]
   ```

2. **Build and push to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URI
   docker build -t live-translator ./server
   docker tag live-translator:latest YOUR_ECR_URI/live-translator:latest
   docker push YOUR_ECR_URI/live-translator:latest
   ```

3. **ECS Task Definition** (reference your container)
   ```json
   {
     "name": "live-translator",
     "image": "YOUR_ECR_URI/live-translator:latest",
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
         "name": "OLLAMA_API",
         "value": "http://ollama-service:11434"
       },
       {
         "name": "FRONTEND_URL",
         "value": "https://your-amplify-domain.com"
       },
       {
         "name": "NODE_ENV",
         "value": "production"
       }
     ]
   }
   ```

4. **Create ECS Service**
   - Launch Type: Fargate or EC2
   - Number of tasks: 2+ (for redundancy)
   - Load Balancer: Application Load Balancer
   - Expose port 5001

### Model Server Setup (Ollama)

**Option A: Separate EC2 Instance**

```bash
# SSH into EC2 instance
ssh ec2-user@your-ec2-ip

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama with specific port
OLLAMA_HOST=0.0.0.0:11434 ollama serve

# Pull model
ollama pull mistral
```

**Option B: Within ECS (GPU instance)**

Add Ollama as a separate service in ECS cluster, expose internally.

---

## Environment Variables Setup

### Backend (.env for ECS)

```env
PORT=5001
NODE_ENV=production

# Ollama Model Server (internal DNS or IP)
OLLAMA_API=http://ollama-service:11434
OLLAMA_MODEL=mistral

# Frontend domain (Amplify)
FRONTEND_URL=https://your-app.amplifyapp.com

# Optional: CloudWatch logging
AWS_REGION=us-east-1
```

### Frontend (.env for Amplify)

In `client/.env.production`:
```env
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_OLLAMA_STATUS_URL=https://your-backend-domain.com/api/ollama-status
```

Update `client/src/App.js`:
```javascript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Use it in axios calls:
await axios.post(`${API_BASE}/api/translate`, { ... })
```

---

## Network Configuration

### Security Group Setup

**Backend ECS Security Group:**
- Inbound: Port 5001 from ALB
- Inbound: Port 5001 from Ollama service
- Outbound: All traffic

**Ollama Security Group:**
- Inbound: Port 11434 from Backend service
- Outbound: All traffic

**ALB Security Group:**
- Inbound: Port 443/80 from anywhere
- Outbound: Port 5001 to Backend

---

## CORS Configuration

Backend already handles CORS based on `FRONTEND_URL` env variable:

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));
```

---

## Monitoring & Logging

### CloudWatch Logs
```javascript
// Add to backend/index.js for production
console.log(`[${new Date().toISOString()}] Request to /api/translate`);
```

### Health Check Endpoint
Backend includes `/health` endpoint for load balancer:
```bash
curl https://your-backend-domain.com/health
```

---

## Scaling Considerations

1. **Frontend (Amplify)**
   - Automatically scales via CloudFront CDN
   - No action needed

2. **Backend (ECS)**
   - Set up Auto Scaling based on CPU/Memory
   - Target: 70% CPU utilization
   - Min tasks: 2, Max tasks: 10

3. **Model Server (Ollama)**
   - Resource intensive (4-8GB RAM minimum)
   - Consider dedicated GPU instance
   - Monitor inference latency

---

## Development vs Production

### Local Development
```bash
./dev-start.sh
# Frontend: http://localhost:3000
# Backend: http://localhost:5001
# Ollama: http://localhost:11434
```

### Production
- Frontend: `https://your-app.amplifyapp.com`
- Backend: `https://api.your-domain.com` (via ALB)
- Ollama: Internal service (not exposed publicly)

---

## Troubleshooting

**"Connection refused" when calling Ollama from ECS?**
- Check service discovery / internal DNS
- Verify security groups allow port 11434
- Use service name instead of localhost

**Frontend can't reach backend?**
- Verify `FRONTEND_URL` is set in ECS env vars
- Check CORS headers in backend response
- Verify ALB is pointing to correct target group

**High latency on translations?**
- Check Ollama service CPU/memory
- Consider upgrading instance type
- Monitor network between services

---

## Cost Optimization

- **Amplify**: Pay per build + data transfer
- **ECS**: Use Fargate Spot for cost savings (25-70% cheaper)
- **Ollama**: Dedicate smaller EC2 instance if not GPU needed
- **Data Transfer**: Keep services in same region to reduce egress costs

---

## Next Steps

1. ✅ Verify local dev setup with `./dev-start.sh`
2. ⬜ Set up AWS IAM permissions
3. ⬜ Create Amplify app and connect GitHub
4. ⬜ Build and push Docker image to ECR
5. ⬜ Create ECS cluster and services
6. ⬜ Deploy Ollama on separate instance
7. ⬜ Configure DNS and SSL/TLS
8. ⬜ Set up CI/CD pipeline
