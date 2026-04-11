const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function request(path) {
  const response = await fetch(`${BASE_URL}${path}`)

  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    try {
      const body = await response.json()
      detail = body.detail || detail
    } catch {
      // Keep fallback error detail.
    }
    if (response.status === 404 || String(detail).toLowerCase().includes('not found')) {
      detail = 'Endpoint not found. Verify VITE_API_URL and backend routes /analyze and /ranking.'
    }

    throw new Error(detail)
  }

  return response.json()
}

function toQuery(params) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export function parsePercent(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return fallback
  const cleaned = value.replace('%', '').trim()
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function fetchAnalysis(company, tempDelta = 0) {
  const query = toQuery({ company, temp_change: tempDelta })
  return request(`/analyze${query}`)
}

export async function fetchRanking(tempDelta = 0) {
  const query = toQuery({ temp_change: tempDelta })
  const payload = await request(`/ranking${query}`)
  if (Array.isArray(payload)) return payload
  if (payload?.value && Array.isArray(payload.value)) return payload.value
  return []
}
