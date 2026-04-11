const badgeClassMap = {
  Heatwave: 'bg-red-500/20 text-red-200 ring-red-300/40',
  Cool: 'bg-cyan-500/20 text-cyan-100 ring-cyan-300/40',
  Normal: 'bg-sky-500/20 text-sky-100 ring-sky-300/40',
}

const marketTrendClassMap = {
  Bullish: 'text-emerald-300',
  Bearish: 'text-red-300',
  Neutral: 'text-amber-200',
}

const impactBars = {
  Low: 1,
  Medium: 2,
  High: 3,
}

export default function HeroHeader({
  currentTemp,
  alert,
  climateImpact,
  climateAlertBadge,
  marketTrend,
  opportunity,
  lastUpdated,
}) {
  const normalizedBadge = climateAlertBadge || (alert?.includes('Heatwave') ? 'Heatwave' : 'Normal')
  const badgeClass = badgeClassMap[normalizedBadge] || badgeClassMap.Normal
  const normalizedImpact = climateImpact || 'Low'
  const activeBars = impactBars[normalizedImpact] || 1
  const normalizedMarketTrend = marketTrend || 'Neutral'
  const marketClass = marketTrendClassMap[normalizedMarketTrend] || marketTrendClassMap.Neutral

  const best = opportunity?.best
  const worst = opportunity?.worst
  const recommendation = opportunity?.recommendation || 'Run analysis to surface today\'s best setup.'

  return (
    <section className="glass-panel overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-600/12 via-sky-500/10 to-cyan-500/10" />

      <div className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200">Today&apos;s Opportunity</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-slate-300">
            Best:{' '}
            <span className="font-semibold text-emerald-300">
              {best ? `${best.company.replace('.NS', '')} (${best.predicted_return > 0 ? '+' : ''}${best.predicted_return.toFixed(2)}%)` : '--'}
            </span>
          </span>
          <span className="text-slate-300">
            Worst:{' '}
            <span className="font-semibold text-red-300">
              {worst ? `${worst.company.replace('.NS', '')} (${worst.predicted_return > 0 ? '+' : ''}${worst.predicted_return.toFixed(2)}%)` : '--'}
            </span>
          </span>
        </div>
        <p className="mt-1 text-xs text-cyan-100">{recommendation}</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl">
          Climate Intelligence for Energy Stocks
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <div className="metric-chip px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-400">Temperature</p>
            <p className="mono-numbers mt-1 text-3xl font-semibold text-cyan-200">{currentTemp?.toFixed?.(1) ?? '--'}°C</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${badgeClass}`}>
                {normalizedBadge}
              </span>
              <span className="text-xs text-slate-300">Impact {normalizedImpact}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5" aria-label="Climate impact meter">
              {[1, 2, 3].map((value) => (
                <span
                  key={value}
                  className={`h-1.5 w-6 rounded-full ${value <= activeBars ? 'bg-cyan-300' : 'bg-slate-700'}`}
                />
              ))}
            </div>
          </div>

          <div className="metric-chip px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-400">Market Trend</p>
            <p className={`mt-1 text-lg font-semibold ${marketClass}`}>{normalizedMarketTrend}</p>
            <p className="mt-1 text-[11px] text-slate-500">Last updated {lastUpdated || '--'}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
