import { useEffect, useState } from 'react';
import { ModuleWrapper } from '../../components/ModuleWrapper';

export const WeatherModule = () => {
  const [weather, setWeather] = useState<{ temp: number | null; condition: string; wind: number | null; humidity: number | null }>({ temp: null, condition: 'Loading…', wind: null, humidity: null });

  useEffect(() => {
    const latitude = 33.9167; // Brea, CA approx
    const longitude = -117.9001;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&windspeed_unit=mph`;

    const weatherCodeMap: Record<number, string> = {
      0: 'Clear',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Light rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Freezing rain',
      67: 'Heavy freezing rain',
      71: 'Light snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Light rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Light snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with hail',
      99: 'Thunderstorm with heavy hail',
    };

    const fetchWeather = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const tempF: number | undefined = data?.current?.temperature_2m;
        const code: number | undefined = data?.current?.weather_code;
        const windMph: number | undefined = data?.current?.wind_speed_10m;
        const humidityPct: number | undefined = data?.current?.relative_humidity_2m;
        const condition = code != null ? weatherCodeMap[code] ?? `Code ${code}` : 'Unknown';
        setWeather({ temp: tempF ?? null, condition, wind: windMph ?? null, humidity: humidityPct ?? null });
      } catch (err) {
        setWeather({ temp: null, condition: 'Error loading weather', wind: null, humidity: null });
        // Optionally log error
        // console.error('Weather fetch failed', err);
      }
    };

    // Initial fetch
    fetchWeather();
    // Refresh every minute
    const interval = setInterval(fetchWeather, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ModuleWrapper title="Brea Weather">
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-6xl font-bold text-blue-500">
          {weather.temp != null ? `${Math.round(weather.temp)}°F` : '—'}
        </div>
        <div className="text-xl text-gray-600">{weather.condition}</div>
        <div className="text-lg text-gray-700">
          {weather.wind != null ? `Wind: ${Math.round(weather.wind)} mph` : 'Wind: —'}
        </div>
        <div className="text-lg text-gray-700">
          {weather.humidity != null ? `Humidity: ${Math.round(weather.humidity)}%` : 'Humidity: —'}
        </div>
      </div>
    </ModuleWrapper>
  );
};

