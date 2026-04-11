function signalClass(signal) {
  if (signal === 'BUY') return 'signal-buy'
  if (signal === 'SELL') return 'signal-sell'
  return 'signal-hold'
}

export default function EnhancedRanking({ ranking, loading, error, chart }) {
  return (
    <section className="glass-panel p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Ranking</h2>
          <p className="section-subtitle">Sorted by highest expected return.</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-100">{error}</div>}

      {!error && ranking.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-600/80 bg-slate-900/35 p-6 text-center text-sm text-slate-300">
          No ranking data available. Run Analyze Stock to load leaderboard.
        </div>
      )}

      <div className="staggered space-y-3">
        {ranking.map((item, index) => {
          const displayCompany = item.company.replace('.NS', '')
          const isPositive = Number(item.predicted_return) > 0
          const isNegative = Number(item.predicted_return) < 0
          const rowClass = isPositive
            ? 'border-emerald-400/30 bg-emerald-500/5'
            : isNegative
              ? 'border-red-400/30 bg-red-500/5'
              : 'border-slate-700/80 bg-slate-900/55'
          return (
            <article key={item.company} className={`rounded-xl border p-4 ${rowClass}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">#{index + 1} {displayCompany}</h3>
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${signalClass(item.signal)}`}>{item.signal}</span>
                  <span className={`text-sm font-bold ${item.expected?.tone === 'gain' ? 'text-emerald-300' : item.expected?.tone === 'drop' ? 'text-red-300' : 'text-amber-200'}`}>
                    {item.expected?.label}
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-6">
        {chart}
      </div>
    </section>
  )
}
