import { useCallback, useMemo, useState } from 'react'
import { fetchAnalysis, fetchRanking } from '../utils/api'

function normalizeAnalysis(raw) {
  const temp = Number(raw?.current_temp ?? 28)
  const rain = Number(raw?.current_rain ?? 0)
  const confidence = Number(raw?.confidence ?? 60)
  const signal = raw?.signal ?? 'HOLD'
  const forecastTemps = Array.isArray(raw?.forecast_temps) ? raw.forecast_temps : []
  const forecastRain = Array.isArray(raw?.forecast_rain) ? raw.forecast_rain : []

  // Determine climate badge
  let climateBadge = 'Normal'
  if (temp >= 35) climateBadge = 'Heatwave'
  else if (temp >= 33) climateBadge = 'Hot'
  else if (temp <= 20) climateBadge = 'Cold'

  // Determine climate impact
  let climateImpact = 'Low'
  if (temp >= 35 || rain > 30) climateImpact = 'High'
  else if (temp >= 30 || rain > 20) climateImpact = 'Medium'

  return {
    ...raw,
    company: raw?.company ?? 'NTPC.NS',
    current_price: Number(raw?.current_price ?? 0),
    current_temp: temp,
    current_rain: rain,
    signal,
    confidence: Math.min(99, Math.max(50, confidence)),
    forecast_temps: forecastTemps,
    forecast_rain: forecastRain,
    climate_alert_badge: climateBadge,
    climate_impact: climateImpact,
    updated_at: raw?.updated_at || new Date().toLocaleTimeString('en-IN', { hour12: true }),
  }
}

function normalizeRanking(rawRanking) {
  return (Array.isArray(rawRanking) ? rawRanking : [])
    .map((item) => {
      const score = Number(item.score ?? 0)
      let signal = 'HOLD'
      if (score > 0.5) signal = 'BUY'
      else if (score < -0.5) signal = 'SELL'

      return {
        company: item.company,
        score: Number(score.toFixed(2)),
        signal,
      }
    })
    .sort((a, b) => b.score - a.score)
}

export function useDashboardData() {
  const [analysis, setAnalysis] = useState(null)
  const [ranking, setRanking] = useState([])
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [loadingRanking, setLoadingRanking] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [rankingError, setRankingError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  const analyzeStock = useCallback(async (company) => {
    setLoadingAnalysis(true)
    setLoadingRanking(true)
    setAnalysisError('')
    setRankingError('')

    try {
      const [analysisResult, rankingResult] = await Promise.all([
        fetchAnalysis(company),
        fetchRanking(),
      ])

      const normalizedAnalysis = normalizeAnalysis(analysisResult)
      const normalizedRanking = normalizeRanking(rankingResult)

      setAnalysis(normalizedAnalysis)
      setRanking(normalizedRanking)
      setLastUpdated(normalizedAnalysis.updated_at)
    } catch (error) {
      setAnalysisError(error.message || 'Failed to load analysis data.')
      setRankingError(error.message || 'Failed to load ranking data.')
      setRanking([])
    } finally {
      setLoadingAnalysis(false)
      setLoadingRanking(false)
    }
  }, [])

  return {
    analysis,
    ranking,
    loadingAnalysis,
    loadingRanking,
    analysisError,
    rankingError,
    analyzeStock,
    lastUpdated,
  }
}
