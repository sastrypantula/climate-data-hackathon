import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ForecastChart({ temps = [], rains = [], darkMode = true }) {
  const maxPoints = Math.max(temps.length, rains.length)
  const data = Array.from({ length: maxPoints }, (_, i) => {
    return {
      day: `Day ${i + 1}`,
      temperature: Number(temps[i]),
      rainfall: Number(rains[i]),
    }
  }).filter((item) => Number.isFinite(item.temperature) || Number.isFinite(item.rainfall))

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>📊 7-Day Trading Temperature Outlook</h3>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Represents expected average temperature during trading hours</p>
      </div>

      <div className={`rounded-xl border p-4 ${darkMode ? 'border-slate-700/60 bg-slate-950/40' : 'border-slate-200 bg-white/90'}`}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={darkMode ? '#2d3748' : '#d1d5db'} vertical={false} />
            <XAxis 
              dataKey="day" 
              tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              label={{ value: '°C', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'mm', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              contentStyle={{
                background: darkMode ? 'rgba(2, 6, 23, 0.95)' : 'rgba(255,255,255,0.98)',
                border: darkMode ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '12px',
                color: darkMode ? '#e2e8f0' : '#0f172a',
              }}
              formatter={(value, name) => {
                if (name === 'temperature') return [`${Number(value).toFixed(1)}°C`, 'Trading Day Temperature']
                if (name === 'rainfall') return [`${value.toFixed(1)}mm`, 'Rainfall']
                return value
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => {
                if (value === 'temperature') return 'Trading Day Temperature (°C)'
                if (value === 'rainfall') return 'Rainfall (mm)'
                return value
              }}
            />
            <Line 
              yAxisId="left"
              type="linear" 
              dataKey="temperature" 
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ fill: '#06b6d4', r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={true}
            />
            <Line 
              yAxisId="right"
              type="linear" 
              dataKey="rainfall" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
