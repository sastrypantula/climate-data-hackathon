import { generateClimateExplanation } from '../utils/decision'

export default function ClimateExplanation({ temp, rain, company, signal }) {
  const insights = generateClimateExplanation(temp, rain, company, signal)

  return (
    <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">💡</span>
        <h3 className="text-sm font-semibold text-cyan-200">Climate Insight</h3>
      </div>
      
      <div className="space-y-2">
        {insights.map((insight, idx) => (
          <p key={idx} className="text-sm leading-relaxed text-slate-200">
            {insight}
          </p>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-slate-900/40 px-3 py-2">
        <p className="text-xs text-slate-400">
          📊 <span className="ml-1">Current conditions:</span> <span className="font-semibold text-cyan-300">{temp.toFixed(1)}°C</span> • 
          <span className="ml-1">Rainfall:</span> <span className="font-semibold text-purple-300">{rain.toFixed(1)}mm</span>
        </p>
      </div>
    </div>
  )
}
