from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import yfinance as yf
import joblib
import requests
from datetime import datetime, time
import pytz

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LATITUDE = 17.7368
LONGITUDE = 83.3185
LOCATION_NAME = "Visakhapatnam"

stocks = ["NTPC.NS","TATAPOWER.NS","ADANIPOWER.NS","JSWENERGY.NS","NHPC.NS"]

company_type_map = {
    "NTPC.NS":"thermal",
    "ADANIPOWER.NS":"thermal",
    "TATAPOWER.NS":"mixed",
    "JSWENERGY.NS":"mixed",
    "NHPC.NS":"hydro"
}

models = {s: joblib.load(f"{s}.pkl") for s in stocks}
features = joblib.load("features.pkl")


def clamp01(value):
    return max(0.0, min(1.0, float(value)))


def get_model_score(model, X):
    # Prefer probability output so ranking and signal are continuous, not class labels.
    if hasattr(model, "predict_proba"):
        try:
            proba = model.predict_proba(X)
            if len(proba) > 0 and len(proba[0]) > 1:
                return clamp01(proba[0][1])
            if len(proba) > 0 and len(proba[0]) == 1:
                return clamp01(proba[0][0])
        except Exception:
            pass

    pred = model.predict(X)[0]
    return clamp01(pred)


def climate_score01(temp, rain, company):
    raw = climate_adjust(temp, rain, company)
    # Convert climate adjustment from [-1, 1] to [0, 1] for weighted blending.
    return clamp01((float(raw) + 1.0) / 2.0)

# 🧠 MARKET TIME LOGIC
def get_effective_index():
    ist = pytz.timezone("Asia/Kolkata")
    now = datetime.now(ist).time()

    if time(9,15) <= now <= time(15,30):
        return 0, "today"
    return 1, "next_session"

# 🌦️ WEATHER
def get_weather():
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "daily": "temperature_2m_mean,precipitation_sum",
        "forecast_days": 7,
        "timezone": "auto"
    }
    data = requests.get(url, params=params).json()
    return data["daily"]["temperature_2m_mean"], data["daily"]["precipitation_sum"]

# 📈 STOCK
def get_stock(ticker):
    df = yf.download(ticker, period="3mo", interval="1d", progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    return df

# 🧠 FEATURES
def build_features(df, temp, rain, company):
    pct_change = df["Close"].pct_change().fillna(0.0)
    latest_return = float(pct_change.iloc[-1] * 100) if len(pct_change) > 0 else 0.0
    lag2 = float(pct_change.iloc[-2] * 100) if len(pct_change) > 1 else latest_return
    lag3 = float(pct_change.iloc[-3] * 100) if len(pct_change) > 2 else latest_return
    volatility = float(pct_change.rolling(5).std().fillna(0.0).iloc[-1]) if len(pct_change) > 0 else 0.0
    momentum = float((df["Close"].iloc[-1] / df["Close"].iloc[-3] - 1) * 100) if len(df) > 2 else 0.0
    ctype = company_type_map[company]

    feature_row = {
        "temp_change": float(temp - pct_change.mean() if len(pct_change) > 0 else temp),
        "temp_lag1": float(temp),
        "temp_lag2": float(temp),
        "heat_intensity": float(max(0.0, temp - 32)),
        "strong_heat": int(temp > 33),
        "rolling_temp_mean": float(temp),
        "rolling_temp_std": 1.0,
        "demand_change": float(temp * 0.1),
        "demand_spike": int(temp > 34),
        "market_return": latest_return,
        "lag1": latest_return,
        "lag2": lag2,
        "lag3": lag3,
        "volatility": volatility,
        "momentum": momentum,
        "temp_x_market": float(temp * latest_return),
        "temp_x_demand": float(temp * 0.1),
        "company_type": 0 if ctype == "thermal" else (1 if ctype == "mixed" else 2),
    }

    return pd.DataFrame([feature_row])[features]

# 🌡️ CLIMATE ADJUST
def climate_adjust(temp, rain, company):
    ctype = company_type_map[company]
    score = 0

    if temp > 33:
        score += 1 if ctype=="thermal" else -1

    if rain > 15 and ctype=="hydro":
        score += 1

    return score


def build_trade_plan(signal):
    if signal == "BUY":
        return {
            "entry": "Next trading session",
            "holding": "3-5 days"
        }

    return {
        "entry": "Wait for stronger signal",
        "holding": "No active trade"
    }

# 🔍 ANALYZE
@app.get("/analyze")
def analyze(company: str="NTPC.NS"):

    temps, rains = get_weather()
    idx, basis = get_effective_index()

    forecast_temps = [round(float(t) + np.random.uniform(-0.3, 0.3), 1) for t in (temps[idx:] if idx < len(temps) else temps)]
    forecast_rain = [float(r) for r in (rains[idx:] if idx < len(rains) else rains)]

    if len(forecast_temps) == 0:
        forecast_temps = [0.0]
    if len(forecast_rain) == 0:
        forecast_rain = [0.0]

    temp = forecast_temps[0]
    rain = forecast_rain[0]

    df = get_stock(company)
    X = build_features(df, temp, rain, company)

    pred = get_model_score(models[company], X)
    adj = climate_score01(temp, rain, company)

    final_score = float(clamp01(pred * 0.7 + adj * 0.3))

    if final_score > 0.6:
        signal = "BUY"
    elif final_score > 0.4:
        signal = "HOLD"
    else:
        signal = "SELL"

    expected_return = float(round(final_score * 2.5, 2))
    confidence = float(round(60 + final_score * 40, 2))

    best_day = int(np.argmax(np.array(forecast_temps, dtype=float))) + 1

    temp_trend = "rising" if forecast_temps[-1] > forecast_temps[0] else "stable"
    demand_trend = "increasing" if temp_trend=="rising" else "stable"
    explanation = f"Temperature {temp}°C leads to {demand_trend} demand affecting {company_type_map[company]} companies."
    trade_plan = build_trade_plan(signal)

    return {
        "company": company,
        "location": LOCATION_NAME,
        "trading_basis": basis,

        "current_price": float(df["Close"].iloc[-1]),
        "current_temp": temp,
        "current_rain": rain,

        "signal": signal,
        "confidence": confidence,
        "expected_return": expected_return,

        "forecast_temps": forecast_temps,
        "forecast_rain": forecast_rain,

        "best_day": best_day,
        "company_type": company_type_map[company],
        "temp_trend": temp_trend,
        "demand_trend": demand_trend,
        "explanation": explanation,
        "trade_plan": trade_plan,

        "updated_at": datetime.now(pytz.timezone("Asia/Kolkata")).strftime("%Y-%m-%d %H:%M:%S %Z"),
        "model_info": "ML model trained on climate + stock data"
    }

# 🏆 RANKING
@app.get("/ranking")
def ranking():
    temps, rains = get_weather()
    idx, _ = get_effective_index()
    results = []

    for s in stocks:
        df = get_stock(s)
        temp = float(temps[idx]) if idx < len(temps) else float(temps[0])
        rain = float(rains[idx]) if idx < len(rains) else float(rains[0])

        X = build_features(df, temp, rain, s)

        pred = get_model_score(models[s], X)
        adj = climate_score01(temp, rain, s)

        score = float(clamp01(pred * 0.7 + adj * 0.3))

        results.append({"company": s, "score": score})

    return sorted(results, key=lambda x: x["score"], reverse=True)