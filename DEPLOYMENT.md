# Ecco Studio - Unified Docker Deployment

The Ecco Studio platform deploys as a **single Docker container** containing:
- **React UI** (apps/ui) - Served by nginx on `/`
- **API Backend** (services/api-edge) - Proxied through nginx at `/api`

## Architecture

```
┌─────────────────────────────────────┐
│       Docker Container (Port 8080)   │
│                                      │
│  ┌──────────┐        ┌────────────┐ │
│  │  nginx   │◄──────►│  api-edge  │ │
│  │  :8080   │        │  :8085     │ │
│  └──────────┘        └────────────┘ │
│       │                              │
│   Serves UI         Handles API      │
│   Proxies /api      requests         │
└─────────────────────────────────────┘
         │
         ▼
    External Traffic
    - / → React SPA
    - /api/* → Backend API
```

## Project Structure

```
apps/ui/                  # React frontend
  ├── src/
  ├── dist/              # Built output (production)
  ├── .env.local         # Local dev config
  └── .env.production    # Production config

services/api-edge/       # Backend API service
  ├── src/
  └── dist/             # Built output

infra/
  ├── nginx.conf        # nginx configuration
  └── supervisord.conf  # Process manager config

Dockerfile              # Production build
Dockerfile.dev          # Development build
```

## Local Development

The UI and API run separately for hot-reload:

```bash
# Terminal 1: Start backend services
docker-compose -f docker-compose.dev.yml --profile watch up api-edge-watch libs-ts-watch

# Terminal 2: Start UI dev server
cd apps/ui && npm run dev
```

Access at:
- **UI**: http://localhost:5173
- **API**: http://localhost:8085

## Production Build

Build the unified Docker image:

```bash
docker build -t ecco-studio:latest .
```

This creates a single container with:
1. Built React app (static files in /usr/share/nginx/html)
2. Compiled api-edge service (/srv/app/services/api-edge/dist)
3. nginx serving UI and proxying API
4. supervisord managing both processes

## Running Production Image Locally

```bash
docker run -p 8080:8080 \
  -e DATA_BUCKET=ecco-studio-data \
  -e STORAGE_BACKEND=fs \
  -e VITE_API_URL=/api \
  ecco-studio:latest
```

Access at: http://localhost:8080

## Cloud Run Deployment

The unified container deploys to Cloud Run as a single service:

```bash
# Build and push to Artifact Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/ecco-studio

# Deploy to Cloud Run
gcloud run deploy ecco-studio \
  --image gcr.io/PROJECT_ID/ecco-studio \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="DATA_BUCKET=ecco-studio-prod-data,STORAGE_BACKEND=gcs"
```

### Environment Variables

**Required:**
- `DATA_BUCKET` - GCS bucket name
- `STORAGE_BACKEND` - `gcs` or `fs`
- `PORT` - Always 8080 (nginx listens here)

**Optional:**
- `VITE_FIREBASE_API_KEY` - Firebase auth
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`

## API Routing

nginx proxies API requests:

| Request Path | Proxies To | Backend Route |
|--------------|------------|---------------|
| `/api/venture?env=dev` | `http://localhost:8085` | `/v1/venture?env=dev` |
| `/api/idea` | `http://localhost:8085` | `/v1/idea` |
| `/api/portfolio/summary` | `http://localhost:8085` | `/v1/portfolio/summary` |

The frontend code uses `VITE_API_URL=/api` in production.

## Health Check

```bash
curl http://localhost:8080/health
# Returns: healthy
```

## Logs

Both nginx and api-edge logs go to stdout/stderr:

```bash
# Local Docker
docker logs <container-id>

# Cloud Run
gcloud run logs read ecco-studio --region us-central1
```

## Cost Estimates

**Cloud Run Pricing (us-central1):**
- **Idle**: $0 (scales to zero)
- **1,000 requests/day**: ~$0.40/month
- **10,000 requests/day**: ~$4/month
- **100,000 requests/day**: ~$40/month

**Includes:**
- 180,000 vCPU-seconds free per month
- 360,000 GiB-seconds free per month
- 2M requests free per month

## Next Steps

1. **Add to Terraform**: Create `google_cloud_run_service` for unified deployment
2. **Set up Cloud Build**: Auto-deploy on push to main
3. **Configure CDN**: Add Cloud CDN for static assets
4. **Add Firebase Auth**: Enable real authentication

## Troubleshooting

**UI not loading:**
```bash
# Check nginx is serving files
docker exec <container> ls /usr/share/nginx/html
```

**API not responding:**
```bash
# Check api-edge is running
docker exec <container> ps aux | grep node
curl http://localhost:8085/health
```

**CORS errors:**
- Check `infra/nginx.conf` has correct CORS headers
- Verify API_URL is set to `/api` in production
