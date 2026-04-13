# Climate Finance Dashboard Backend

FastAPI backend for climate-driven prediction of NSE energy stock performance.

## Scope

Supports Problem Statement 3 by linking weather behavior with stock return signals for:
- NTPC.NS
- TATAPOWER.NS
- ADANIPOWER.NS
- JSWENERGY.NS
- NHPC.NS

## Tech Stack

- FastAPI
- pandas, numpy
- scikit-learn (RandomForestRegressor)
- yfinance (market data)
- requests (weather API calls)
- Optional: xgboost, lightgbm (auto-used if installed)

## Endpoints

1. GET /health
- Basic service health check.
- Response: {"status": "ok"}

2. GET /analyze?company=NTPC.NS
- Runs analysis for one company.
- Returns predicted next-week return and context fields:
  - signal
  - confidence
  - climate_impact
  - climate_alert_badge
  - demand_impact
  - market_trend, stock_trend
  - reason/explanation
  - what_if_35 scenario

3. GET /ranking
- Runs analysis for all supported companies.
- Returns sorted list by predicted_return descending.

## Modeling Approach

The pipeline:
1. Fetch 1-year stock and index data.
2. Fetch historical temperature + live current temperature.
3. Align weekly time series.
4. Engineer lag, momentum, volatility, and climate features.
5. Train ensemble regressors on available history.
6. Predict next-week return and derive BUY/HOLD/SELL.

Confidence is estimated from ensemble prediction dispersion and bounded.

## Local Run

```bash
cd fastapi_backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Docs:
- Swagger: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Example Calls

```bash
curl http://127.0.0.1:8000/health
curl "http://127.0.0.1:8000/analyze?company=NTPC.NS"
curl "http://127.0.0.1:8000/ranking"
```

## Files

- main.py: API + feature engineering + modeling logic
- requirements.txt: Python dependencies
- Dockerfile: container runtime
- CLOUDRUN_DEPLOYMENT.md: deployment instructions
- start.sh: helper command

## Deployment Notes

- Container listens on 0.0.0.0 and reads PORT env var.
- CORS currently open for frontend integration.
- Use Cloud Run guide in this folder for production deployment.

## IMD Integration Note

Current weather provider in code is Open-Meteo.
To align strictly with IMD data requirement, replace weather fetch functions in main.py with IMD ingestion while preserving endpoint contracts.
