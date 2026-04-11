import { Suspense, lazy, useMemo, useState } from 'react'
import HeroHeader from './components/HeroHeader'
import UpdatedAnalysisCard from './components/UpdatedAnalysisCard'
import EnhancedRanking from './components/EnhancedRanking'
import { useDashboardData } from './hooks/useDashboardData'

const ProbabilityChartPanel = lazy(() => import('./components/ProbabilityChartPanel'))

export default function App() {
  const [company, setCompany] = useState('NTPC.NS')

  const {
    analysis,
    ranking,
    loadingAnalysis,
    loadingRanking,
    analysisError,
    rankingError,
    analyzeStock,
    lastUpdated,
  } = useDashboardData()

  const handleAnalyzeClick = () => {
    analyzeStock(company)
  }

  const currentTemp = analysis?.current_temp
  const alert = analysis?.alert || 'Normal climate'
  const climateImpact = analysis?.climate_impact || 'Low'
  const climateAlertBadge = analysis?.climate_alert_badge || 'Normal'
  const marketTrend = analysis?.market_trend || 'Neutral'

  const chartData = useMemo(
    () =>
      ranking.map((item) => ({
        ...item,
        label: item.company.replace('.NS', ''),
      })),
    [ranking]
  )

  const lowOpportunity = useMemo(
    () => ranking.length > 0 && ranking.every((item) => item.signal !== 'BUY'),
    [ranking]
  )

  const opportunity = useMemo(() => {
    if (!ranking.length) {
      return {
        best: null,
        worst: null,
        recommendation: 'Run analysis to surface today\'s best setup.',
      }
    }

    const best = ranking[0]
    const worst = ranking[ranking.length - 1]

    let recommendation = 'Mixed setup. Prioritize selective entries.'
    if (best.predicted_return > 1) {
      recommendation = `Focus on ${best.company.replace('.NS', '')} for highest upside.`
    } else if (worst.predicted_return < -1 && best.predicted_return <= 1) {
      recommendation = `Risk elevated. Avoid ${worst.company.replace('.NS', '')} for now.`
    }

    return { best, worst, recommendation }
  }, [ranking])

  return (
    <div className="min-h-screen dashboard-bg text-slate-100">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-14 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <HeroHeader
          currentTemp={currentTemp}
          alert={alert}
          climateImpact={climateImpact}
          climateAlertBadge={climateAlertBadge}
          marketTrend={marketTrend}
          opportunity={opportunity}
          lastUpdated={lastUpdated}
        />

        <section className="mx-auto w-full max-w-3xl">
          <UpdatedAnalysisCard
            company={company}
            setCompany={setCompany}
            onAnalyze={handleAnalyzeClick}
            loading={loadingAnalysis}
            error={analysisError}
            analysis={analysis}
          />
        </section>

        <section className="w-full">
          <EnhancedRanking
            ranking={ranking}
            loading={loadingRanking}
            error={rankingError}
            chart={
              <Suspense
                fallback={
                  <div className="mt-4 flex h-[220px] items-center justify-center text-sm text-slate-300">
                    Loading chart...
                  </div>
                }
              >
                <ProbabilityChartPanel
                  data={chartData}
                  loading={loadingRanking}
                  lowOpportunity={lowOpportunity}
                />
              </Suspense>
            }
          />
        </section>
      </main>
    </div>
  )
}

