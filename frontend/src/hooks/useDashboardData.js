import { useCallback, useMemo, useState } from 'react'
import { fetchAnalysis, fetchRanking, parsePercent } from '../utils/api'
import {
  classifySignal,
  formatExpectedChange,
  normalizeReason,
} from '../utils/decision'

function normalizeAnalysis(raw) {
  const predictedReturn = Number(raw?.predicted_return ?? parsePercent(raw?.expected_change, 0))
  const rawConfidence = Number(raw?.confidence ?? 65)
  const boundedConfidence = Math.max(50, Math.min(80, Number.isFinite(rawConfidence) ? rawConfidence : 65))
  const base = {
    ...raw,
    company: raw?.company,
    predicted_return: predictedReturn,
    confidence: Number(boundedConfidence.toFixed(1)),
    signal: raw?.signal,
    expected_change: raw?.expected_change ?? `${predictedReturn.toFixed(2)}%`,
  }

  const expected = formatExpectedChange(base.expected_change)
  const computedSignal = base.signal || classifySignal(base.predicted_return)
  const computedTemp = Number(base.current_temp ?? 28)
  const climateBadge =
    base.climate_alert_badge ||
    (computedTemp >= 35 ? 'Heatwave' : computedTemp <= 24 ? 'Cool' : 'Normal')

  const whatIfReturn = Number(base?.what_if_35?.predicted_return)
  const whatIfExpected = formatExpectedChange(
    Number.isFinite(whatIfReturn) ? `${whatIfReturn.toFixed(2)}%` : '0%'
  )

  return {
    ...base,
    current_temp: computedTemp,
    signal: computedSignal,
    timeframe: base.timeframe ?? 'Next 1 week',
    reason: base.reason || base.explanation || normalizeReason('', computedTemp),
    expected,
    climate_impact: base.climate_impact || (computedTemp >= 35 ? 'High' : computedTemp >= 30 ? 'Medium' : 'Low'),
    climate_alert_badge: climateBadge,
    market_trend: base.market_trend || 'Neutral',
    demand_impact: base.demand_impact || 'Stable demand',
    temp_change: Number(base.temp_change ?? 0),
    updated_at: base.updated_at || '',
    what_if_35: Number.isFinite(whatIfReturn)
      ? {
          ...base.what_if_35,
          expected: whatIfExpected,
        }
      : null,
  }
}

function normalizeRanking(rawRanking, referenceTemp) {
  return rawRanking
    .map((item) => {
      const predictedReturn = Number(item.predicted_return ?? parsePercent(item.expected_change, 0))
      const confidence = Number(item.confidence ?? 50)
      const expected = formatExpectedChange(
        item.expected_change ?? `${predictedReturn.toFixed(2)}%`
      )
      const tempHint = Number.isFinite(referenceTemp) ? referenceTemp : 28

      return {
        ...item,
        predicted_return: Number(predictedReturn.toFixed(2)),
        confidence: Number(Math.max(50, Math.min(80, confidence)).toFixed(1)),
        signal: item.signal || classifySignal(predictedReturn),
        expected_change: `${parsePercent(item.expected_change, expected.value).toFixed(2)}%`,
        expected,
        reason: normalizeReason(item.reason, tempHint),
      }
    })
    .sort((a, b) => b.predicted_return - a.predicted_return)
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
      const normalizedRanking = normalizeRanking(rankingResult, normalizedAnalysis.current_temp)

      setAnalysis(normalizedAnalysis)
      setRanking(normalizedRanking)
      setLastUpdated(
        normalizedAnalysis.updated_at || new Date().toLocaleString('en-IN', { hour12: true })
      )
    } catch (error) {
      setAnalysisError(error.message || 'Failed to load analysis data.')
      setRankingError(error.message || 'Failed to load ranking data.')
      setRanking([])
    } finally {
      setLoadingAnalysis(false)
      setLoadingRanking(false)
    }
  }, [])

  const confidenceLevel = useMemo(() => {
    if (!ranking.length) return '--'
    const average = ranking.reduce((total, item) => total + item.confidence, 0) / ranking.length
    return `${average.toFixed(1)}%`
  }, [ranking])

  return {
    analysis,
    ranking,
    confidenceLevel,
    loadingAnalysis,
    loadingRanking,
    analysisError,
    rankingError,
    analyzeStock,
    lastUpdated,
  }
}
