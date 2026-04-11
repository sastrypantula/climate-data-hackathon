import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function barColor(signal) {
  if (signal === 'BUY') return '#34d399'
  if (signal === 'SELL') return '#f87171'
  return '#fbbf24'
}

export default function ProbabilityChartPanel({ data, loading, lowOpportunity }) {

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Companies vs Expected Return</h3>
        {lowOpportunity && <span className="text-xs text-amber-200">Low opportunity market</span>}
      </div>

      <div className="h-[220px] w-full rounded-xl border border-slate-700/60 bg-slate-950/35 p-2">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-sky-300" />
              Loading chart data...
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 10, left: -14, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#2d3748" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
                tick={{ fill: '#cbd5e1', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeOpacity={0.5} />
              <Tooltip
                cursor={{ fill: 'rgba(147, 197, 253, 0.08)' }}
                contentStyle={{
                  background: 'rgba(2, 6, 23, 0.95)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                }}
                formatter={(value, _, payload) => {
                  const expectedReturn = `${Number(value).toFixed(2)}%`
                  return [expectedReturn, `${payload.payload.signal} expected return`]
                }}
              />
              <Bar dataKey="predicted_return" radius={[8, 8, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.company} fill={barColor(entry.signal)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
