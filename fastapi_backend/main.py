from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import requests
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.ensemble import RandomForestRegressor

try:
    from xgboost import XGBRegressor
except Exception:
    XGBRegressor = None

try:
    from lightgbm import LGBMRegressor
except Exception:
    LGBMRegressor = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stocks = ["NTPC.NS", "TATAPOWER.NS", "ADANIPOWER.NS", "JSWENERGY.NS", "NHPC.NS"]

LATITUDE = 20.2961
LONGITUDE = 85.8245
RETURN_SIGNAL_BUY = 1.0
RETURN_SIGNAL_SELL = -1.0
CONFIDENCE_MIN = 50.0
CONFIDENCE_MAX = 80.0


def _extract_close_weekly(df: pd.DataFrame, column_name: str) -> pd.DataFrame:
    if df.empty:
        raise ValueError("No market data returned")

    close = df["Close"]
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]

    weekly = close.resample("W").last().dropna().to_frame(name=column_name).reset_index()
    weekly.rename(columns={weekly.columns[0]: "Date"}, inplace=True)
    weekly["Date"] = pd.to_datetime(weekly["Date"])
    return weekly


def _signal_from_return(predicted_return_pct: float) -> str:
    if predicted_return_pct > RETURN_SIGNAL_BUY:
        return "BUY"
    if predicted_return_pct < RETURN_SIGNAL_SELL:
        return "SELL"
    return "HOLD"


def _confidence_from_model_variance(model_predictions: list[float]) -> float:
    std = float(np.std(model_predictions))
    confidence = 80.0 - min(30.0, std * 15.0)
    return max(CONFIDENCE_MIN, min(CONFIDENCE_MAX, confidence))


def _classify_trend(last_price: float, ma_price: float, return_pct: float) -> str:
    if last_price > ma_price and return_pct > 1.0:
        return "Bullish"
    if last_price < ma_price and return_pct < -1.0:
        return "Bearish"
    return "Neutral"


def _market_trend_from_nifty(merged_df: pd.DataFrame) -> tuple[str, float]:
    nifty = merged_df["Nifty"].dropna()
    if len(nifty) < 6:
        return "Neutral", 0.0

    last_price = float(nifty.iloc[-1])
    ma_price = float(nifty.tail(6).mean())
    return_pct_4w = float(((last_price / float(nifty.iloc[-5])) - 1.0) * 100.0)
    return _classify_trend(last_price, ma_price, return_pct_4w), return_pct_4w


def _stock_trend_from_close(merged_df: pd.DataFrame) -> tuple[str, float]:
    close = merged_df["Close"].dropna()
    if len(close) < 6:
        return "Neutral", 0.0

    last_price = float(close.iloc[-1])
    ma_price = float(close.tail(6).mean())
    return_pct_4w = float(((last_price / float(close.iloc[-5])) - 1.0) * 100.0)
    return _classify_trend(last_price, ma_price, return_pct_4w), return_pct_4w


def _climate_impact_level(temp: float) -> str:
    if temp >= 35.0:
        return "High"
    if temp >= 30.0:
        return "Medium"
    return "Low"


def _climate_alert_badge(temp: float) -> str:
    if temp >= 35.0:
        return "Heatwave"
    if temp <= 24.0:
        return "Cool"
    return "Normal"


def _demand_impact_text(temp: float) -> str:
    if temp >= 35.0:
        return "High cooling demand"
    if temp >= 30.0:
        return "Moderate cooling demand"
    if temp <= 24.0:
        return "Lower cooling demand"
    return "Stable demand"


def _build_ensemble_models():
    models = [
        RandomForestRegressor(
            n_estimators=300,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
    ]

    if XGBRegressor is not None:
        models.append(
            XGBRegressor(
                objective="reg:squarederror",
                n_estimators=300,
                learning_rate=0.05,
                max_depth=4,
                subsample=0.9,
                colsample_bytree=0.9,
                random_state=42,
            )
        )

    if LGBMRegressor is not None:
        models.append(
            LGBMRegressor(
                objective="regression",
                n_estimators=300,
                learning_rate=0.05,
                subsample=0.9,
                colsample_bytree=0.9,
                random_state=42,
                verbose=-1,
            )
        )

    return models


def get_live_current_temperature():
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "current_weather": "true",
        "timezone": "auto",
    }
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    payload = response.json()
    live_temp = payload.get("current_weather", {}).get("temperature")
    if live_temp is None:
        raise ValueError("No live current weather temperature returned by Open-Meteo")
    return float(live_temp)


def get_historical_temperature_daily():
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=365)

    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily": "temperature_2m_mean",
        "timezone": "auto",
    }

    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    payload = response.json()

    daily_payload = payload.get("daily", {})
    dates = daily_payload.get("time", [])
    temps = daily_payload.get("temperature_2m_mean", [])

    if not dates or not temps:
        raise ValueError("No historical temperature data returned by Open-Meteo")

    daily = pd.DataFrame({"Date": pd.to_datetime(dates), "Temp": temps}).sort_values("Date")
    daily["rolling_temp_mean"] = daily["Temp"].rolling(7, min_periods=3).mean()
    daily["rolling_temp_std"] = daily["Temp"].rolling(7, min_periods=3).std().fillna(0.0)
    daily["temp_change"] = daily["Temp"] - daily["rolling_temp_mean"]
    daily["heatwave_flag"] = (daily["Temp"] > 35).astype(int)
    return daily


def get_historical_temperature_weekly():
    daily = get_historical_temperature_daily()
    weekly = (
        daily.set_index("Date")
        .resample("W")
        .agg(
            {
                "Temp": "mean",
                "rolling_temp_mean": "last",
                "rolling_temp_std": "last",
                "temp_change": "last",
                "heatwave_flag": "max",
            }
        )
        .dropna()
        .reset_index()
    )

    # Inject latest live temperature so the most recent row is truly current.
    try:
        live_temp = get_live_current_temperature()
        if not weekly.empty:
            weekly.loc[weekly.index[-1], "Temp"] = live_temp
            weekly.loc[weekly.index[-1], "temp_change"] = (
                live_temp - float(weekly.loc[weekly.index[-1], "rolling_temp_mean"])
            )
            weekly.loc[weekly.index[-1], "heatwave_flag"] = int(live_temp > 35)
    except Exception:
        # Fall back to archive-only temperature if live API fails.
        pass

    return weekly


def get_stock_data(ticker):
    raw = yf.download(ticker, period="1y", interval="1d", progress=False)
    return _extract_close_weekly(raw, "Close")


def get_nifty():
    raw = yf.download("^NSEI", period="1y", interval="1d", progress=False)
    return _extract_close_weekly(raw, "Nifty")


def merge_market_data(stock_df, temp_df_weekly, nifty_df):
    merged = stock_df.merge(temp_df_weekly, on="Date", how="inner")
    merged = merged.merge(nifty_df, on="Date", how="inner")
    merged = merged.sort_values("Date").reset_index(drop=True)
    return merged


def build_regression_dataset(df):
    if df.empty:
        raise ValueError("Merged input dataframe is empty")

    engineered = df.copy()
    engineered["return_pct"] = engineered["Close"].pct_change() * 100
    engineered["lag_return_1"] = engineered["return_pct"].shift(1)
    engineered["lag_return_2"] = engineered["return_pct"].shift(2)
    engineered["lag_return_3"] = engineered["return_pct"].shift(3)
    engineered["market_return"] = engineered["Nifty"].pct_change() * 100
    engineered["volatility"] = engineered["return_pct"].rolling(4).std()
    engineered["momentum"] = engineered["Close"].pct_change(periods=3) * 100
    engineered["target_return_pct"] = engineered["return_pct"].shift(-1)

    feature_cols = [
        "temp_change",
        "heatwave_flag",
        "rolling_temp_mean",
        "rolling_temp_std",
        "lag_return_1",
        "lag_return_2",
        "lag_return_3",
        "market_return",
        "volatility",
        "momentum",
    ]

    train_df = engineered.dropna(subset=feature_cols + ["target_return_pct"]).copy()
    infer_df = engineered.dropna(subset=feature_cols).copy()

    if train_df.empty or infer_df.empty:
        raise ValueError("Not enough rows after feature engineering for regression")

    return train_df, infer_df, feature_cols


def predict_return_ensemble(merged_df):
    train_df, infer_df, feature_cols = build_regression_dataset(merged_df)

    X_train = train_df[feature_cols]
    y_train = train_df["target_return_pct"]
    latest_X = infer_df[feature_cols].iloc[[-1]]

    model_predictions = []
    for model in _build_ensemble_models():
        model.fit(X_train, y_train)
        model_predictions.append(float(model.predict(latest_X)[0]))

    if not model_predictions:
        raise ValueError("No regression models available for prediction")

    ensemble_pred = float(np.mean(model_predictions))
    latest_row = infer_df.iloc[-1]

    # Add mild relative-strength adjustment for cross-company variation realism.
    recent_relative_strength = float(
        infer_df["return_pct"].tail(4).mean() - infer_df["market_return"].tail(4).mean()
    )
    climate_boost = float(latest_row["temp_change"]) * 0.2
    adjusted_pred = ensemble_pred + 0.35 * recent_relative_strength + climate_boost

    confidence = _confidence_from_model_variance(model_predictions)
    signal = _signal_from_return(adjusted_pred)

    return adjusted_pred, signal, confidence, latest_row


def explain_from_context(temp, temp_change, demand_impact, stock_trend, market_trend, predicted_return):
    direction = "upside" if predicted_return >= 0 else "downside"
    return (
        f"Temperature {temp:.1f}C ({temp_change:+.1f}C vs weekly baseline) suggests {demand_impact.lower()}. "
        f"Stock trend is {stock_trend} and NIFTY trend is {market_trend}, indicating {direction} pressure "
        f"with expected return around {predicted_return:+.2f}% next week."
    )


def climate_alert(temp):
    if temp > 35:
        return "Heatwave Alert: High demand expected"
    if temp > 30:
        return "Warm conditions: Moderate demand"
    return "Normal climate"


def _what_if_at_35c(predicted_return: float, current_temp: float):
    scenario_temp = 35.0
    if current_temp >= scenario_temp:
        scenario_temp = float(current_temp)

    # Keep consistent with climate sensitivity used in adjusted prediction.
    climate_delta = (scenario_temp - current_temp) * 0.2
    scenario_return = predicted_return + climate_delta
    scenario_signal = _signal_from_return(scenario_return)
    return {
        "temp": round(float(scenario_temp), 1),
        "predicted_return": round(float(scenario_return), 2),
        "signal": scenario_signal,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/analyze")
def analyze(company: str = "NTPC.NS"):
    if company not in stocks:
        raise HTTPException(status_code=400, detail=f"Unsupported company: {company}")

    stock_df = get_stock_data(company)
    temp_df = get_historical_temperature_weekly()
    nifty_df = get_nifty()
    merged_df = merge_market_data(stock_df, temp_df, nifty_df)

    if merged_df.empty:
        raise HTTPException(status_code=500, detail="No aligned market/climate data available")

    predicted_return, signal, confidence, row = predict_return_ensemble(merged_df)
    temp = float(row["Temp"])
    try:
        temp = get_live_current_temperature()
    except Exception:
        pass

    stock_trend, stock_return_4w = _stock_trend_from_close(merged_df)
    market_trend, market_return_4w = _market_trend_from_nifty(merged_df)
    demand_impact = _demand_impact_text(temp)
    climate_impact = _climate_impact_level(temp)
    climate_badge = _climate_alert_badge(temp)
    temp_change = float(temp - float(row["rolling_temp_mean"]))
    reason = explain_from_context(
        temp=temp,
        temp_change=temp_change,
        demand_impact=demand_impact,
        stock_trend=stock_trend,
        market_trend=market_trend,
        predicted_return=predicted_return,
    )
    what_if_35 = _what_if_at_35c(predicted_return, temp)
    updated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    return {
        "company": company,
        "current_temp": round(temp, 2),
        "timeframe": "Next 1 week",
        "predicted_return": round(float(predicted_return), 2),
        "expected_change": f"{round(float(predicted_return), 2)}%",
        "signal": signal,
        "confidence": round(float(confidence), 1),
        "alert": climate_alert(temp),
        "climate_alert_badge": climate_badge,
        "climate_impact": climate_impact,
        "demand_impact": demand_impact,
        "market_trend": market_trend,
        "market_return_4w": round(float(market_return_4w), 2),
        "stock_trend": stock_trend,
        "stock_return_4w": round(float(stock_return_4w), 2),
        "temp_change": round(float(temp_change), 2),
        "what_if_35": what_if_35,
        "updated_at": updated_at,
        "reason": reason,
        "explanation": reason,
    }


@app.get("/ranking")
def ranking():
    temp_df = get_historical_temperature_weekly()
    nifty_df = get_nifty()

    results = []
    for stock in stocks:
        stock_df = get_stock_data(stock)
        merged_df = merge_market_data(stock_df, temp_df, nifty_df)
        if merged_df.empty:
            continue

        predicted_return, signal, confidence, row = predict_return_ensemble(merged_df)
        temp = float(row["Temp"])
        market_trend, market_return_4w = _market_trend_from_nifty(merged_df)
        stock_trend, stock_return_4w = _stock_trend_from_close(merged_df)
        demand_impact = _demand_impact_text(temp)
        temp_change = float(temp - float(row["rolling_temp_mean"]))
        reason = explain_from_context(
            temp=temp,
            temp_change=temp_change,
            demand_impact=demand_impact,
            stock_trend=stock_trend,
            market_trend=market_trend,
            predicted_return=predicted_return,
        )

        results.append(
            {
                "company": stock,
                "predicted_return": round(float(predicted_return), 2),
                "expected_change": f"{round(float(predicted_return), 2)}%",
                "signal": signal,
                "confidence": round(float(confidence), 1),
                "climate_impact": _climate_impact_level(temp),
                "market_trend": market_trend,
                "market_return_4w": round(float(market_return_4w), 2),
                "stock_trend": stock_trend,
                "stock_return_4w": round(float(stock_return_4w), 2),
                "what_if_35": _what_if_at_35c(predicted_return, temp),
                "reason": reason,
            }
        )

    results = sorted(results, key=lambda item: item["predicted_return"], reverse=True)

    if not results:
        raise HTTPException(status_code=500, detail="No ranking data available")

    return results
