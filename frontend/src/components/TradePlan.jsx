export default function TradePlan({ tradePlan, bestDay, darkMode = true }) {
  const entry = tradePlan?.entry || 'Next trading session'
  const holding = tradePlan?.holding || '3-5 days'

  return (
    <section className={`rounded-2xl border p-6 shadow-[0_0_35px_rgba(2,132,199,0.08)] ${darkMode ? 'border-slate-700/70 bg-slate-900/60' : 'border-slate-200 bg-white/90'}`}>
      <p className={`mb-4 text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Trade Plan</p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className={`rounded-xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>📅 Entry</p>
          <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{entry}</p>
        </div>
        <div className={`rounded-xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>⏳ Holding</p>
          <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{holding}</p>
        </div>
        <div className={`rounded-xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>⭐ Best Entry Day</p>
          <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Day {Math.max(1, Number(bestDay) || 1)}</p>
        </div>
      </div>
    </section>
  )
}
