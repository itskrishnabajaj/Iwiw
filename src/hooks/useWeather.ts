import { useEffect, useState } from 'react'

interface Weather {
  temp: number
  code: number
  label: string
  emoji: string
}

const CODES: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Clear sky', emoji: '☀️' },
  1: { label: 'Mostly clear', emoji: '🌤️' },
  2: { label: 'Partly cloudy', emoji: '⛅' },
  3: { label: 'Overcast', emoji: '☁️' },
  45: { label: 'Foggy', emoji: '🌫️' },
  48: { label: 'Foggy', emoji: '🌫️' },
  51: { label: 'Light drizzle', emoji: '🌦️' },
  61: { label: 'Rain', emoji: '🌧️' },
  63: { label: 'Rain', emoji: '🌧️' },
  65: { label: 'Heavy rain', emoji: '🌧️' },
  80: { label: 'Showers', emoji: '🌦️' },
  95: { label: 'Thunderstorm', emoji: '⛈️' },
}

// Open-Meteo — no API key needed. Falls back gracefully when offline.
export function useWeather(lat: number, lon: number) {
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.current_weather) return
        const code = d.current_weather.weathercode as number
        const meta = CODES[code] ?? { label: 'Weather', emoji: '🌡️' }
        setWeather({ temp: Math.round(d.current_weather.temperature), code, ...meta })
      })
      .catch(() => {
        /* offline — leave null */
      })
    return () => {
      cancelled = true
    }
  }, [lat, lon])

  return weather
}
