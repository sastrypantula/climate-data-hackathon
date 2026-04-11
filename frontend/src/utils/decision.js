import { parsePercent } from './api'

export function normalizeReason(reason, temperature) {
  const text = String(reason || '').toLowerCase()

  if (text.includes('heatwave') || temperature >= 34) {
    return 'Heatwave conditions -> AC usage surge -> electricity demand spike -> positive revenue impact'
  }

  if (text.includes('low temperature') || text.includes('cold') || temperature <= 24) {
    return 'Low temperatures -> reduced electricity demand -> weaker revenue outlook'
  }

  return 'Moderate climate -> no demand spike -> stable or weak stock movement'
}

export function classifySignal(predictedReturnPct) {
  if (predictedReturnPct > 1) return 'BUY'
  if (predictedReturnPct < -1) return 'SELL'
  return 'HOLD'
}

export function formatExpectedChange(changeValue) {
  const numeric = parsePercent(changeValue, 0)
  const absolute = Math.abs(numeric)

  if (numeric < 0) {
    return {
      value: numeric,
      label: `Expected Return: -${absolute.toFixed(2)}%`,
      shortLabel: `Return -${absolute.toFixed(1)}%`,
      tone: 'drop',
    }
  }

  if (numeric > 0) {
    return {
      value: numeric,
      label: `Expected Return: +${absolute.toFixed(2)}%`,
      shortLabel: `Return +${absolute.toFixed(1)}%`,
      tone: 'gain',
    }
  }

  return {
    value: 0,
    label: 'Expected Return: 0.00%',
    shortLabel: 'Flat 0.0%',
    tone: 'neutral',
  }
}
