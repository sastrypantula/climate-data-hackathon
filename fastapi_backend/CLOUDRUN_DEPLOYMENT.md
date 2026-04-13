# Cloud Run Deployment Guide (Backend)

Deploy the FastAPI backend in this folder to Google Cloud Run.

## Prerequisites

1. gcloud CLI installed and authenticated
2. A GCP project with Cloud Run and Cloud Build APIs enabled
3. Permission to deploy Cloud Run services

## Deploy (Source-Based)

```bash
cd fastapi_backend

export PROJECT_ID="your-project-id"
export SERVICE_NAME="climate-backend"
export REGION="us-central1"

gcloud auth login
gcloud config set project $PROJECT_ID

gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1
```

## Deploy (Prebuilt Image)

```bash
cd fastapi_backend

export PROJECT_ID="your-project-id"
export SERVICE_NAME="climate-backend"
export REGION="us-central1"
export IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/climate-backend/${SERVICE_NAME}:latest"

gcloud builds submit --tag $IMAGE_NAME .

gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated
```

## Verify Service

```bash
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

curl $SERVICE_URL/health
curl "$SERVICE_URL/analyze?company=NTPC.NS"
curl "$SERVICE_URL/ranking"
```

## Frontend Integration

Set frontend environment variable:

```env
VITE_API_URL=https://your-cloud-run-url
```

Then rebuild frontend.

## Runtime Notes

- App listens on 0.0.0.0 and reads PORT env var.
- CORS is enabled in backend.
- Optional libraries (xgboost/lightgbm) are auto-detected if installed.

## Troubleshooting

1. 404 from frontend calls:
- Confirm frontend is calling /analyze and /ranking, not legacy /predict.

2. Slow cold start:
- Increase memory or keep minimum instances > 0.

3. External data errors:
- Check outbound internet access and API availability for weather/yfinance sources.

4. Deployment failures:
- Check logs: gcloud run logs read $SERVICE_NAME --region $REGION
