import { useEffect, useMemo, useState } from 'react'
import { fetchAnalysis, fetchRanking } from '../utils/api'
import ForecastChart from './ForecastChart'
import Ranking from './Ranking'
import TradePlan from './TradePlan'

function Spinner({ label }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />
      <span>{label}</span>
    </div>
  )
}

function toPercent(score) {
  return `${(Number(score) * 100).toFixed(2)}%`
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function capitalize(value) {
  if (value === null || value === undefined) return '--'
  const text = String(value)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function buildExplanation(analysis) {
  if (analysis?.explanation) return analysis.explanation

  const temp = safeNumber(analysis?.current_temp, 0).toFixed(1)
  const demandTrend = capitalize(analysis?.demand_trend || 'stable').toLowerCase()
  const companyType = capitalize(analysis?.company_type || 'mixed').toLowerCase()
  const signal = analysis?.signal || 'HOLD'

  return `Temperature ${temp}°C suggests ${demandTrend} electricity demand. ${companyType} companies are expected to respond accordingly, leading to a ${signal} signal.`
}

export default function Dashboard() {
  const [company, setCompany] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [ranking, setRanking] = useState([])
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [loadingRanking, setLoadingRanking] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    let ignore = false

    async function loadRanking() {
      setError('')
      setLoadingRanking(true)

      try {
        const rankingRes = await fetchRanking()

        if (ignore) return

        const sortedRanking = (Array.isArray(rankingRes) ? rankingRes : [])
          .slice()
          .sort((a, b) => Number(b.score) - Number(a.score))

        setRanking(sortedRanking)

        if (!company && sortedRanking.length > 0) {
          setCompany(sortedRanking[0].company)
        }
      } catch (e) {
        if (!ignore) {
          setError(e.message || 'Unable to load data from backend.')
        }
      } finally {
        if (!ignore) {
          setLoadingRanking(false)
        }
      }
    }

    loadRanking()

    return () => {
      ignore = true
    }
  }, [company])

  useEffect(() => {
    if (!company) return

    let ignore = false

    async function loadAnalysis() {
      setError('')
      setLoadingAnalysis(true)

      try {
        const analysisRes = await fetchAnalysis(company)
        if (!ignore) {
          setAnalysis(analysisRes)
        }
      } catch (e) {
        if (!ignore) {
          setError(e.message || 'Unable to load analysis from backend.')
          setAnalysis(null)
        }
      } finally {
        if (!ignore) {
          setLoadingAnalysis(false)
        }
      }
    }

    loadAnalysis()

    return () => {
      ignore = true
    }
  }, [company])

  const isBusy = loadingAnalysis || loadingRanking

  const signalLabel = analysis?.signal
  const signalTone = signalLabel === 'BUY'
    ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300'
    : signalLabel === 'HOLD'
      ? 'border-orange-400/50 bg-orange-500/10 text-orange-200'
      : 'border-rose-400/50 bg-rose-500/10 text-rose-200'

  const basedOnLabel = analysis?.trading_basis === 'next_session'
    ? '📅 Based On: Next Trading Session'
    : '📅 Based On: Today\'s Market Conditions'

  const sortedRanking = useMemo(
    () => ranking.slice().sort((a, b) => Number(b.score) - Number(a.score)),
    [ranking]
  )

  const topCompany = sortedRanking.length > 0 ? sortedRanking[0].company : ''
  const darkMode = theme === 'dark'
  const appShellClass = darkMode
    ? 'min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(16,185,129,0.08),transparent),radial-gradient(900px_500px_at_80%_-10%,rgba(56,189,248,0.10),transparent),linear-gradient(180deg,#050816,#030711)] text-slate-100'
    : 'min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(59,130,246,0.10),transparent),radial-gradient(900px_500px_at_80%_-10%,rgba(34,197,94,0.08),transparent),linear-gradient(180deg,#f8fafc,#e2e8f0)] text-slate-900'
  const surfaceClass = darkMode ? 'bg-slate-900/60 border-slate-700/70' : 'bg-white/80 border-slate-200/80 shadow-sm'
  const surfaceSoftClass = darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'
  const mutedText = darkMode ? 'text-slate-300' : 'text-slate-600'
  const mutedText2 = darkMode ? 'text-slate-400' : 'text-slate-500'
  const titleText = darkMode ? 'text-white' : 'text-slate-900'

  return (
    <div className={appShellClass}>
      <header className={`border-b ${darkMode ? 'border-slate-800/80 bg-slate-950/70' : 'border-slate-200/80 bg-white/70'} backdrop-blur`}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className={`text-4xl font-bold tracking-tight ${titleText}`}>ClimateAlpha</h1>
              <p className={`mt-2 ${mutedText}`}>Predicting energy stocks using temperature & rainfall intelligence</p>
              {/* {analysis?.location ? (
                <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm ${darkMode ? 'border-cyan-300/30 bg-cyan-500/10 text-cyan-200' : 'border-cyan-200 bg-cyan-50 text-cyan-800'}`}>📍 Location: {analysis.location}</p>
              ) : null} */}
            </div>
            <button
              type="button"
              onClick={() => setTheme(darkMode ? 'light' : 'dark')}
              aria-label="Toggle light and dark mode"
              className={`mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 ${darkMode ? 'border-slate-700 bg-slate-900 text-amber-300' : 'border-slate-300 bg-white text-slate-700'}`}
            >
              {darkMode ? '☀' : '☾'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className={`rounded-2xl border p-6 transition ${surfaceClass} ${isBusy ? 'opacity-80' : ''}`}>
          <label className={`mb-3 block text-sm font-semibold ${mutedText}`}>Select Company to Analyze</label>
          <select
            disabled={isBusy}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={`w-full max-w-sm rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-60 ${darkMode ? 'border-slate-600 bg-slate-800 text-white focus:border-cyan-400' : 'border-slate-300 bg-white text-slate-900 focus:border-cyan-500'}`}
          >
            {sortedRanking.map((item) => (
              <option key={item.company} value={item.company}>{item.company}</option>
            ))}
          </select>
          {analysis ? <p className={`mt-3 text-sm ${mutedText}`}>{basedOnLabel}</p> : null}
        </section>

        {error ? (
          <section className={`rounded-2xl border p-4 ${darkMode ? 'border-red-400/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>{error}</section>
        ) : null}

        {loadingAnalysis ? <Spinner label="Loading live climate and stock analysis..." /> : null}

        {analysis ? (
          <>
            <section className={`rounded-2xl border p-6 shadow-[0_0_50px_rgba(2,132,199,0.08)] ${surfaceClass}`}>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Main Decision Card</p>

              <div className="grid gap-4 md:grid-cols-3">
                <div className={`rounded-xl border p-4 ${surfaceSoftClass}`}>
                  <p className={`text-sm ${mutedText2}`}>Current Price</p>
                  <p className={`mt-2 text-3xl font-bold mono-numbers ${titleText}`}>₹{Number(analysis.current_price).toFixed(2)}</p>
                </div>
                <div className={`rounded-xl border p-4 ${surfaceSoftClass}`}>
                  <p className={`text-sm ${mutedText2}`}>Trading Day Temperature</p>
                  <p className={`mt-2 text-3xl font-bold mono-numbers ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>{Number(analysis.current_temp).toFixed(1)}°C</p>
                  <p className={`mt-2 text-xs ${mutedText2}`}>Based on average temperature during market hours (10 AM – 3 PM)</p>
                </div>
                <div className={`rounded-xl border p-4 ${surfaceSoftClass}`}>
                  <p className={`text-sm ${mutedText2}`}>Rainfall</p>
                  <p className={`mt-2 text-3xl font-bold mono-numbers ${darkMode ? 'text-sky-300' : 'text-sky-600'}`}>{Number(analysis.current_rain).toFixed(1)} mm</p>
                </div>
              </div>

              <div className={`mt-6 rounded-2xl border p-5 text-center transition hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(14,165,233,0.16)] ${signalTone}`}>
                <p className={`text-xs uppercase tracking-[0.2em] ${mutedText}`}>Signal</p>
                <p className="mt-2 text-5xl font-extrabold leading-none">{signalLabel}</p>
              </div>

              <div className="mt-5">
                <div className={`mb-2 flex items-center justify-between text-sm ${mutedText}`}>
                  <span>📊 Confidence</span>
                  <span className="mono-numbers">{safeNumber(analysis.confidence, 0).toFixed(1)}%</span>
                </div>
                <div className={`h-2 w-full rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, safeNumber(analysis.confidence, 0)))}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className={`rounded-xl border p-4 ${surfaceSoftClass}`}>
                  <p className={`text-sm ${mutedText2}`}>📈 Expected Return</p>
                  <p className={`mt-2 text-2xl font-bold mono-numbers ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    {safeNumber(analysis.expected_return, 0).toFixed(2)}%
                  </p>
                </div>
                <div className={`rounded-xl border p-4 ${surfaceSoftClass}`}>
                  <p className={`text-sm ${mutedText2}`}>📅 Best Entry Day</p>
                  <p className={`mt-2 text-2xl font-bold mono-numbers ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                    Day {Math.max(1, Number(analysis.best_day) || 1)}
                  </p>
                </div>
              </div>
            </section>

            <TradePlan tradePlan={analysis.trade_plan} bestDay={Math.max(1, Number(analysis.best_day) || 1)} darkMode={darkMode} />

            <section className={`rounded-2xl border p-6 ${surfaceClass}`}>
              <p className={`mb-4 text-xl font-bold ${titleText}`}>🧠 Why this prediction?</p>
              <p className={`leading-7 ${mutedText}`}>
                {buildExplanation(analysis)}
              </p>
            </section>

            <section className={`rounded-2xl border p-6 shadow-[0_0_35px_rgba(14,165,233,0.08)] ${surfaceClass}`}>
              <p className={`mb-4 text-xl font-bold ${titleText}`}>Climate Impact Panel</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className={`rounded-xl border p-4 ${surfaceSoftClass}`}>
                  <p className={`text-sm ${mutedText2}`}>🌡 Temp Trend</p>
                  <p className={`mt-2 text-lg font-semibold ${titleText}`}>{capitalize(analysis.temp_trend)}</p>
                </div>
                <div className={`rounded-xl border p-4 ${surfaceSoftClass}`}>
                  <p className={`text-sm ${mutedText2}`}>⚡ Demand Trend</p>
                  <p className={`mt-2 text-lg font-semibold ${titleText}`}>{capitalize(analysis.demand_trend)}</p>
                </div>
                <div className={`rounded-xl border p-4 ${surfaceSoftClass}`}>
                  <p className={`text-sm ${mutedText2}`}>🏭 Company Type</p>
                  <p className={`mt-2 text-lg font-semibold ${titleText}`}>{capitalize(analysis.company_type)}</p>
                </div>
              </div>
            </section>

            <section className={`rounded-2xl border p-6 shadow-[0_0_40px_rgba(56,189,248,0.08)] ${surfaceClass}`}>
              <p className={`mb-2 text-xl font-bold ${titleText}`}>📊 7-Day Trading Temperature Outlook</p>
              <p className={`mb-4 text-sm ${mutedText}`}>Represents expected average temperature during trading hours</p>
              <ForecastChart
                temps={Array.isArray(analysis.forecast_temps) ? analysis.forecast_temps : []}
                rains={Array.isArray(analysis.forecast_rain) ? analysis.forecast_rain : []}
                darkMode={darkMode}
              />
            </section>

            <section className={`rounded-2xl border p-6 ${surfaceClass}`}>
              <p className={`text-xl font-bold ${titleText}`}>🏆 Climate Advantage Ranking</p>
              {loadingRanking ? <div className="mt-4"><Spinner label="Loading ranking..." /></div> : <Ranking items={sortedRanking} topCompany={topCompany} toPercent={toPercent} darkMode={darkMode} />}
              {sortedRanking.length > 0 ? (
                <p className={`mt-4 rounded-xl border p-3 text-sm ${darkMode ? 'border-sky-300/30 bg-sky-500/10 text-sky-100' : 'border-sky-200 bg-sky-50 text-sky-800'}`}>
                  Top ranked due to stronger climate-driven demand advantage.
                </p>
              ) : null}
            </section>

            <section className={`rounded-2xl border p-5 ${darkMode ? 'border-cyan-300/30 bg-cyan-500/10 text-cyan-100' : 'border-cyan-200 bg-cyan-50 text-cyan-900'}`}>
              <p>Powered by ML model trained on climate + stock data</p>
              <p className="mt-2">Last updated: {analysis.updated_at}</p>
              <p className="mt-2 text-sm">Model info: {analysis.model_info}</p>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}
