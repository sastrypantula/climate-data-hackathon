# Climate Finance Dashboard Frontend

React frontend for visualizing climate-aware stock signals from the FastAPI backend.

## Current UI Modules

- App shell: src/App.jsx
- Header summary: src/components/HeroHeader.jsx
- Single company decision card: src/components/UpdatedAnalysisCard.jsx
- Multi-company ranking list: src/components/EnhancedRanking.jsx
- Ranking chart: src/components/ProbabilityChartPanel.jsx
- Data state + API orchestration: src/hooks/useDashboardData.js
- API utilities: src/utils/api.js
- Decision formatting: src/utils/decision.js

## API Expectations

The frontend expects backend routes:
- GET /health
- GET /analyze?company=...
- GET /ranking

If endpoints differ, update src/utils/api.js.

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment

Create .env with:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Use deployed backend URL in production.

## Build

```bash
npm run build
npm run preview
```

## Notes

- Charts and ranking are driven by predicted_return values from /ranking.
- Company analysis card shows signal, expected return, confidence, and reason from /analyze.
- The current UI is optimized for quick decision support for the five NSE power stocks in scope.
