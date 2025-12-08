import { useEffect, useState } from 'react';
import { ModuleWrapper } from '../../components/ModuleWrapper';

type WeatherState = {
  tempC: number | null;
  windKph: number | null;
  condition: string;
  updatedAt: string | null;
  highC: number | null;
  lowC: number | null;
  alerts: Array<{ title: string; severity?: string }>; 
};

const weatherCodeMap: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export const WeatherModule = () => {
  const [weather, setWeather] = useState<WeatherState>({
    tempC: null,
    windKph: null,
    condition: 'Loading…',
    updatedAt: null,
    highC: null,
    lowC: null,
    alerts: [],
  });

  useEffect(() => {
    let isMounted = true;

    const fetchWeather = async () => {
      try {
        // Newport Beach, CA coordinates
        const lat = 33.6189;
        const lon = -117.9289;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const current = data?.current;
        const tempC = typeof current?.temperature_2m === 'number' ? current.temperature_2m : null;
        const windMs = typeof current?.wind_speed_10m === 'number' ? current.wind_speed_10m : null; // m/s
        const windKph = windMs != null ? Math.round(windMs * 3.6) : null;
        const code = typeof current?.weather_code === 'number' ? current.weather_code : null;
        const condition = code != null ? weatherCodeMap[code] ?? 'Unknown' : 'Unknown';
        const updatedAt = current?.time ?? null;

        // Daily values – use the first (today)
        const daily = data?.daily;
        const highC = Array.isArray(daily?.temperature_2m_max) && typeof daily.temperature_2m_max[0] === 'number' ? daily.temperature_2m_max[0] : null;
        const lowC = Array.isArray(daily?.temperature_2m_min) && typeof daily.temperature_2m_min[0] === 'number' ? daily.temperature_2m_min[0] : null;

        // Simple derived major events based on daily metrics
        const precip = Array.isArray(daily?.precipitation_sum) && typeof daily.precipitation_sum[0] === 'number' ? daily.precipitation_sum[0] : 0;
        const windMaxMs = Array.isArray(daily?.wind_speed_10m_max) && typeof daily.wind_speed_10m_max[0] === 'number' ? daily.wind_speed_10m_max[0] : 0;
        const windMaxMph = Math.round(windMaxMs * 2.23694);
        const alertsDerived: Array<{ title: string; severity?: string }> = [];
        if (precip >= 10) alertsDerived.push({ title: 'Heavy precipitation expected', severity: 'warning' });
        if (windMaxMph >= 35) alertsDerived.push({ title: 'Strong winds today', severity: 'advisory' });
        if ([95, 96, 99].includes(code ?? -1)) alertsDerived.push({ title: 'Thunderstorms possible', severity: 'warning' });

        if (isMounted) {
          setWeather({ tempC, windKph, condition, updatedAt, highC, lowC, alerts: alertsDerived });
        }
      } catch (err) {
        if (isMounted) {
          setWeather((prev) => ({ ...prev, condition: 'Error fetching weather' }));
        }
      }
    };

    // Initial fetch
    fetchWeather();
    // Refresh every 2 minutes
    const intervalId = setInterval(fetchWeather, 120000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <ModuleWrapper title="Newport Beach Weather">
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-6xl font-bold text-blue-500">
          {weather.tempC != null ? `${Math.round(weather.tempC * 9/5 + 32)}°F` : '—'}
        </div>
        <div className="text-xl text-gray-600">{weather.condition}</div>
        <div className="text-sm text-gray-500">
          {weather.windKph != null ? `Wind: ${Math.round((weather.windKph || 0) / 1.60934)} mph` : ''}
          {weather.updatedAt ? (weather.windKph != null ? ' • ' : '') + `Updated: ${new Date(weather.updatedAt).toLocaleTimeString()}` : ''}
        </div>
        <div className="text-lg text-gray-700">
          {weather.highC != null && weather.lowC != null
            ? `High: ${Math.round(weather.highC * 9/5 + 32)}°F • Low: ${Math.round(weather.lowC * 9/5 + 32)}°F`
            : '—'}
        </div>
        {weather.alerts.length > 0 ? (
          <div className="text-sm text-red-600 text-center">
            {weather.alerts.map((a, idx) => (
              <div key={idx}>⚠️ {a.title}</div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-green-700">No major events</div>
        )}
      </div>
    </ModuleWrapper>
  );
};

