/**
 * Geocoding and weather, both from Open-Meteo: free, no API key, CORS-friendly,
 * no account to create. Chosen so nothing here depends on a key that could
 * expire in the middle of the trip.
 */

const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';

/**
 * Look up a place name. Returns candidates rather than picking one — several
 * of this trip's base_location values are genuinely ambiguous ("Cyprus
 * (Limassol or Paphos)", "Rifugio (Alta Via 1)"), and quietly choosing a
 * coordinate for those would be inventing a fact about the trip.
 */
export async function geocode(name, count = 5) {
  const cleaned = String(name ?? '')
    .replace(/\([^)]*\)/g, ' ')      // drop parenthetical asides
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return [];
  const url = `${GEOCODE}?name=${encodeURIComponent(cleaned)}&count=${count}&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocoding failed (${res.status})`);
  const json = await res.json();
  return (json.results ?? []).map(r => ({
    label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude,
    lon: r.longitude,
    elevation: r.elevation ?? null
  }));
}

/** Open-Meteo only forecasts this far ahead. Beyond it there is nothing to show. */
export const FORECAST_HORIZON_DAYS = 16;

export function daysAhead(isoDate) {
  const target = new Date(isoDate + 'T12:00:00');
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

export function forecastAvailable(isoDate) {
  const d = daysAhead(isoDate);
  return d >= 0 && d <= FORECAST_HORIZON_DAYS;
}

/**
 * One request covering a whole span of days for one location.
 *
 * Deliberately not one request per day: the trip has 24 days and several share
 * a base, and hammering a free service 24 times per page load to redraw the
 * same numbers would be rude and slow.
 */
export async function fetchForecast(lat, lon, startISO, endISO) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    timezone: 'auto',
    start_date: startISO,
    end_date: endISO
  });
  const res = await fetch(`${FORECAST}?${params}`);
  if (!res.ok) throw new Error(`forecast failed (${res.status})`);
  const j = await res.json();
  const out = {};
  (j.daily?.time ?? []).forEach((date, i) => {
    out[date] = {
      code: j.daily.weather_code[i],
      max: j.daily.temperature_2m_max[i],
      min: j.daily.temperature_2m_min[i],
      rain: j.daily.precipitation_sum[i],
      wind: j.daily.wind_speed_10m_max[i]
    };
  });
  return out;
}

/** WMO weather codes, condensed to what a walker actually needs to know. */
const WMO = [
  [[0], '☀️', 'clear'],
  [[1, 2], '🌤️', 'mostly clear'],
  [[3], '☁️', 'overcast'],
  [[45, 48], '🌫️', 'fog'],
  [[51, 53, 55, 56, 57], '🌦️', 'drizzle'],
  [[61, 63, 65, 66, 67], '🌧️', 'rain'],
  [[71, 73, 75, 77, 85, 86], '🌨️', 'snow'],
  [[80, 81, 82], '🌧️', 'showers'],
  [[95, 96, 99], '⛈️', 'thunderstorms']
];

export function describeWeather(code) {
  for (const [codes, icon, text] of WMO) {
    if (codes.includes(code)) return { icon, text };
  }
  return { icon: '·', text: '' };
}
