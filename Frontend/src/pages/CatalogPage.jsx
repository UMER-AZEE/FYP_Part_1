import ModelPerformanceTable from '../components/ModelPerformanceTable'
import StatsGrid from '../components/StatsGrid'

export default function CatalogPage({ data }) {
  return (
    <>
      <StatsGrid
        items={[
          { title: 'Available models', hint: 'deployable in catalog', value: '12', detail: '4 Gemini · 3 Groq · 3 OpenAI · 2 Anthropic' },
          { title: 'Healthy models', hint: 'passing SLO checks', value: '9', detail: '3 models need tuning or review' },
        ]}
      />
      <ModelPerformanceTable rows={data.modelRows} />
    </>
  )
}
