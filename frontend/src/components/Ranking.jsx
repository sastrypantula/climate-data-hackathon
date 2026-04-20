export default function Ranking({ items, topCompany, toPercent, darkMode = true }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null
  }

  return (
    <div className="mt-4 space-y-3">
      {items.map((item, index) => {
        const isTop = item.company === topCompany
        return (
          <div
            key={item.company}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 transition hover:-translate-y-0.5 ${isTop
              ? darkMode
                ? 'border-emerald-300/60 bg-emerald-500/15'
                : 'border-emerald-300 bg-emerald-50'
              : darkMode
                ? 'border-slate-700 bg-slate-900/70'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>#{index + 1} {item.company}</p>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.company}</p>
            </div>
            <p className={`text-lg font-bold mono-numbers ${isTop ? darkMode ? 'text-emerald-300' : 'text-emerald-700' : darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              {toPercent(item.score)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
