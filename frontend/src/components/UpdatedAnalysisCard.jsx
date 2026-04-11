const companyOptions = [
  { label: 'NTPC', value: 'NTPC.NS' },
  { label: 'Tata Power', value: 'TATAPOWER.NS' },
  { label: 'Adani Power', value: 'ADANIPOWER.NS' },
  { label: 'JSW Energy', value: 'JSWENERGY.NS' },
  { label: 'NHPC', value: 'NHPC.NS' },
]

function signalClass(signal) {
  if (signal === 'BUY') return 'signal-buy'
  if (signal === 'SELL') return 'signal-sell'
  return 'signal-hold'
}

function decisionClass(signal) {
  if (signal === 'BUY') return 'bg-emerald-500/20 text-emerald-300 ring-emerald-300/40'
  if (signal === 'SELL') return 'bg-red-500/20 text-red-300 ring-red-300/40'
  return 'bg-amber-500/20 text-amber-200 ring-amber-300/40'
}

function expectedClass(tone) {
  if (tone === 'gain') return 'text-emerald-300'
  if (tone === 'drop') return 'text-red-300'
  return 'text-amber-200'
}

function compactDecisionReason(analysis) {
  if (!analysis) return ''

  const temp = Number.isFinite(Number(analysis.current_temp)) ? Number(analysis.current_temp).toFixed(1) : '--'
  const tempDelta = Number.isFinite(Number(analysis.temp_change))
    ? `${Number(analysis.temp_change) >= 0 ? '+' : ''}${Number(analysis.temp_change).toFixed(1)}`
    : '--'

  const demand = analysis.demand_impact || 'Stable demand'
  const stock = analysis.stock_trend || 'Neutral'
  const market = analysis.market_trend || 'Neutral'

  return `${temp}°C (${tempDelta}°C vs baseline) drives ${demand.toLowerCase()}; stock trend ${stock}, NIFTY trend ${market}.`
}

export default function UpdatedAnalysisCard({ company, setCompany, onAnalyze, loading, error, analysis }) {
  const compactReason = compactDecisionReason(analysis)

  return (
    <section className="glass-panel p-6 sm:p-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">Company Analysis</h2>
          <p className="section-subtitle">Fast climate-driven decision for one stock.</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <label className="flex-1 sm:min-w-[210px]">
            <span className="mb-2 block text-xs uppercase tracking-wider text-slate-400">Company</span>
            <select
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="w-full rounded-xl border border-slate-600/70 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/30"
            >
              {companyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={onAnalyze}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Analyzing...' : 'Analyze Stock'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="rounded-xl border border-dashed border-slate-600/80 bg-slate-900/35 p-6 text-center text-sm text-slate-300">
          Select a company and click Analyze Stock to run the decision engine.
        </div>
      )}

      {analysis && (
        <article className="staggered space-y-4">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/55 p-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Primary Decision</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{analysis.company}</p>
              <p className={`mx-auto mt-3 inline-flex rounded-2xl px-8 py-3 text-6xl font-bold ring-1 sm:text-7xl ${decisionClass(analysis.signal)}`}>
                {analysis.signal}
              </p>
              <p className="mt-2 text-sm text-slate-300">Act on this signal for the next week window.</p>
              <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                <span className={`font-semibold ${expectedClass(analysis.expected?.tone)}`}>{analysis.expected?.label || 'Expected Return: --'}</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-200">Confidence {analysis.confidence}%</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="metric-chip">
              <p className="text-xs text-slate-400">Expected Return</p>
              <p className={`mt-1 text-lg font-semibold ${expectedClass(analysis.expected?.tone)}`}>
                {analysis.expected?.label || 'Expected Return: --'}
              </p>
            </div>
            <div className="metric-chip">
              <p className="text-xs text-slate-400">Timeframe</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{analysis.timeframe}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/80 bg-slate-950/40 p-3">
            <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">Why this decision</p>
            <p className="text-sm text-slate-300">{compactReason || analysis.reason}</p>
          </div>

          {analysis.what_if_35 && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
              <p className="text-xs uppercase tracking-wider text-cyan-200">What-if at {analysis.what_if_35.temp}°C</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className={`rounded-lg px-2 py-1 text-xs font-medium ${decisionClass(analysis.what_if_35.signal)}`}>
                  {analysis.what_if_35.signal}
                </span>
                <span className={`font-semibold ${expectedClass(analysis.what_if_35.expected?.tone)}`}>
                  {analysis.what_if_35.expected?.label}
                </span>
              </div>
            </div>
          )}

        </article>
      )}
    </section>
  )
}
