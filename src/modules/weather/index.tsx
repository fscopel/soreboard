import { useEffect, useState } from 'react';
import { ModuleWrapper } from '../../components/ModuleWrapper';

type WeatherData = {
  tempF: number;
  condition: string;
  humidityPct: number;
  windMph: number;
  sunsetTime: string;
  updatedAt?: string;
};

const formatSunset = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '—';
  }
};

export const WeatherModule = () => {
  const [weather, setWeather] = useState<WeatherData>({
    tempF: 0,
    condition: 'Loading…',
    humidityPct: 0,
    windMph: 0,
    sunsetTime: '—',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setError(null);
        // Newport Beach, CA: lat 33.6189, lon -117.9289
        const url =
          'https://api.open-meteo.com/v1/forecast?latitude=33.6189&longitude=-117.9289' +
          '&current=temperature_2m,relative_humidity_2m,wind_speed_10m' +
          '&daily=sunset' +
          '&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto';
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const tempF = Number(data?.current?.temperature_2m ?? 0);
        const humidityPct = Number(data?.current?.relative_humidity_2m ?? 0);
        const windMph = Number(data?.current?.wind_speed_10m ?? 0);
        const sunsetIso: string | undefined = data?.daily?.sunset?.[0];
        const sunsetTime = sunsetIso ? formatSunset(sunsetIso) : '—';

        // Basic condition mapping using temperature/wind
        const condition = tempF > 75 ? 'Warm' : tempF < 55 ? 'Cool' : 'Mild';

        const updatedAt = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        setWeather({ tempF, humidityPct, windMph, sunsetTime, condition, updatedAt });
      } catch (e: any) {
        // If fetch was aborted due to component unmount or refresh, ignore gracefully
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Failed to load weather');
      }
    };

    load();
    const interval = setInterval(load, 5 * 60 * 1000); // refresh every 5 minutes
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return (
    <ModuleWrapper title="Newport Beach Weather">
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="text-6xl font-bold text-blue-500">{Math.round(weather.tempF)}°F</div>
        <div className="text-base text-gray-600">{weather.condition}</div>
        <div className="grid grid-cols-3 gap-6 mt-4 text-center">
          <div>
            <div className="text-sm text-gray-500">Humidity</div>
            <div className="text-xl font-semibold">{Math.round(weather.humidityPct)}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Wind</div>
            <div className="text-xl font-semibold">{Math.round(weather.windMph)} mph</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Sunset</div>
            <div className="text-xl font-semibold">{weather.sunsetTime}</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">Last updated: {weather.updatedAt ?? '—'}</div>
      </div>
    </ModuleWrapper>
  );
};

