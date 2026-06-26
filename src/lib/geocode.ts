// City → coordinates via Open-Meteo's free, key-less geocoding API.
// Used when the user sets their weather city so the dashboard shows that city's
// real weather. The resolved lat/lon are persisted in settings, so weather then
// works offline for that location too.
export interface GeoResult {
  lat: number
  lon: number
  label: string
}

export async function geocodeCity(name: string): Promise<GeoResult | null> {
  const q = name.trim()
  if (!q) return null
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`,
    )
    if (!r.ok) return null
    const d = await r.json()
    const hit = d?.results?.[0]
    if (!hit || typeof hit.latitude !== 'number' || typeof hit.longitude !== 'number') return null
    return {
      lat: hit.latitude,
      lon: hit.longitude,
      label: [hit.name, hit.admin1, hit.country_code].filter(Boolean).join(', '),
    }
  } catch {
    return null // offline / network blocked — caller keeps the previous coords
  }
}
