# Climate Finance Dashboard

A full-stack project for Problem Statement 3:
Rising Temperatures' Effect on India's Energy Stocks.

Goal:
Link temperature trends with NSE energy stock performance (minimum 5 companies) and build prediction models to support weekly BUY/HOLD/SELL decisions.

This repository currently analyzes:
- NTPC.NS
- TATAPOWER.NS
- ADANIPOWER.NS
- JSWENERGY.NS
- NHPC.NS

## Problem Statement Alignment

Required:
- Relate temperature rise signals to stock behavior for Indian power companies.
- Build prediction models and compare/score companies.

Current implementation:
- Backend combines live + historical weather signals with stock and market features.
- Ensemble regression predicts next-week return percentage.
- API exposes single-company analysis and multi-company ranking.
- Frontend displays actionable outputs (signal, expected return, confidence, ranking).

Note:
- Current weather source is Open-Meteo in code.
- You can replace this data layer with IMD data feeds while keeping model and UI layers intact.

## Architecture

- Frontend: React + Vite + Tailwind + Recharts
- Backend: FastAPI + pandas + scikit-learn + yfinance + requests
- Modeling: On-demand ensemble (RandomForest required, XGBoost/LightGBM optional)
- Deployment: Docker + Cloud Run friendly runtime

## Repository Structure

```text
climate-finance-dashboard/
  README.md
  .env.example
  fastapi_backend/
    main.py
    requirements.txt
    Dockerfile
    CLOUDRUN_DEPLOYMENT.md
    start.sh
    climatedatahackathon.ipynb
  frontend/
    index.html
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
    src/
      App.jsx
      main.jsx
      index.css
      components/
        HeroHeader.jsx
        UpdatedAnalysisCard.jsx
        EnhancedRanking.jsx
        ProbabilityChartPanel.jsx
      hooks/
        useDashboardData.js
      utils/
        api.js
        decision.js
```

## API (Current)

Base URL local: http://127.0.0.1:8000

1) Health
- GET /health

2) Analyze one company
- GET /analyze?company=NTPC.NS
- Returns company-level prediction, climate context, confidence, and explanation.

3) Rank all supported companies
- GET /ranking
- Returns sorted list by predicted_return descending.

## Local Setup

Prerequisites:
- Python 3.10+
- Node.js 18+

Backend:
```bash
cd fastapi_backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Then open: http://localhost:5173

## Environment Variables

Root template:
- .env.example contains VITE_API_URL reference

Frontend runtime:
- VITE_API_URL=http://127.0.0.1:8000 (local)
- VITE_API_URL=https://your-backend-url (deployed)

## Model and Decision Logic Summary

Feature families used in prediction include:
- Temperature level and deviation from weekly baseline
- Heatwave flag
- Lagged stock returns
- Market return (NIFTY proxy)
- Volatility and momentum

Output includes:
- predicted_return (next 1 week)
- signal (BUY/HOLD/SELL)
- confidence (bounded score)
- reason/explanation text
- what_if_35 scenario

## Deployment

Backend is containerized with Dockerfile and designed for Cloud Run style PORT injection.
See fastapi_backend/CLOUDRUN_DEPLOYMENT.md for command-by-command deployment.

## Suggested Next Improvements

1. Replace Open-Meteo fetchers with IMD ingestion/adapters.
2. Add persistent training artifacts and backtest reports.
3. Add model evaluation endpoint (MAE/RMSE/MAPE over rolling windows).
4. Add feature importance panel in frontend.
5. Add caching and rate-limit handling for external APIs.
