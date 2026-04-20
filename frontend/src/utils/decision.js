/**
 * Generate climate-based explanation for stock signal
 * @param {number} temp - Current temperature in Celsius
 * @param {number} rain - Current rainfall in mm
 * @param {string} company - Stock symbol (e.g., "NTPC.NS")
 * @param {string} signal - Buy/Hold signal
 */
export function generateClimateExplanation(temp, rain, company, signal) {
  const companyName = company.replace('.NS', '').replace(/([A-Z])/g, ' $1').trim()
  const insights = []
  
  // Temperature impact
  if (temp > 33) {
    insights.push(
      `High temperature (${temp.toFixed(1)}°C) increases AC & cooling demand, boosting electricity sales.`
    )
    if (company === 'NTPC.NS' || company === 'ADANIPOWER.NS') {
      insights.push('Thermal power companies benefit from increased peak demand periods.')
    }
    if (company === 'NHPC.NS') {
      insights.push('Hydro power demand may decline due to reduced water flow during extreme heat.')
    }
  } else if (temp < 24) {
    insights.push(
      `Cold temperature (${temp.toFixed(1)}°C) increases heating demand, raising electricity consumption.`
    )
  } else {
    insights.push(
      `Moderate temperature (${temp.toFixed(1)}°C) suggests stable baseline electricity demand.`
    )
  }
  
  // Rainfall impact
  if (rain > 20) {
    insights.push(
      `Heavy rainfall (${rain.toFixed(1)}mm) boosts hydro-electric generation capacity.`
    )
    if (company === 'NHPC.NS') {
      insights.push('NHPC benefits significantly from increased water availability for generation.')
    } else {
      insights.push('Increased renewable supply may lower overall energy prices.')
    }
  } else if (rain < 5) {
    insights.push(
      `Low rainfall (${rain.toFixed(1)}mm) reduces hydro capacity, favoring thermal generators.`
    )
    if (company === 'NTPC.NS' || company === 'ADANIPOWER.NS') {
      insights.push('Thermal plants become more critical to meet base load demand.')
    }
  } else {
    insights.push(`Normal rainfall (${rain.toFixed(1)}mm) maintains steady hydro supply.`)
  }
  
  // Signal interpretation
  if (signal === 'BUY') {
    insights.push(`\n✅ BUY signal: Current climate conditions favor ${companyName} growth.`)
  } else {
    insights.push(`\n⏸️ HOLD signal: Climate conditions are neutral—monitor for entry points.`)
  }
  
  return insights
}

export function getExpectedTrendEmoji(signal) {
  return signal === 'BUY' ? '📈' : '➖'
}

export function getExpectedTrendLabel(signal) {
  return signal === 'BUY' ? 'Upward Trend' : 'Neutral Trend'
}
