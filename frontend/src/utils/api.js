const BASE_URL = 'http://localhost:8000'

async function request(path) {
  try {
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
        detail = 'Endpoint not found. Verify backend is running on http://localhost:8000'
      }

      throw new Error(detail)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Backend server not responding. Ensure backend is running: python main.py')
    }
    throw error
  }
}

export function fetchAnalysis(company) {
  return request(`/analyze?company=${encodeURIComponent(company)}`)
}

export async function fetchRanking() {
  const payload = await request('/ranking')
  if (Array.isArray(payload)) return payload
  if (payload?.value && Array.isArray(payload.value)) return payload.value
  return []
}
