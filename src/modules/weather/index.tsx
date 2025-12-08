import { useEffect, useState } from 'react';
import { ModuleWrapper } from '../../components/ModuleWrapper';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  loading: boolean;
  error: string | null;
}

// Map weather codes to conditions (Open-Meteo WMO weather interpretation codes)
const getWeatherCondition = (code: number): string => {
  const conditions: Record<number, string> = {
    0: 'Clear',
    1: 'Mostly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    56: 'Light Freezing Drizzle',
    57: 'Dense Freezing Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    66: 'Light Freezing Rain',
    67: 'Heavy Freezing Rain',
    71: 'Slight Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    85: 'Slight Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Heavy Hail',
  };
  return conditions[code] || 'Unknown';
};

export const WeatherModule = () => {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 0,
    condition: 'Loading...',
    humidity: 0,
    loading: true,
    error: null,
  });

  const fetchWeather = async () => {
    try {
      // Newport Beach, CA coordinates
      const latitude = 33.6189;
      const longitude = -117.9298;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=fahrenheit`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      const current = data.current;

      setWeather({
        temp: Math.round(current.temperature_2m),
        condition: getWeatherCondition(current.weather_code),
        humidity: current.relative_humidity_2m,
        loading: false,
        error: null,
      });
    } catch (error) {
      setWeather(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load weather',
        condition: 'Error',
      }));
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchWeather();

    // Update every 5 minutes (300000 ms)
    const interval = setInterval(fetchWeather, 300000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ModuleWrapper title="Local Weather - Newport Beach">
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        {weather.loading ? (
          <div className="text-xl text-gray-600">Loading weather data...</div>
        ) : weather.error ? (
          <div className="text-xl text-red-600">Error: {weather.error}</div>
        ) : (
          <>
            <div className="text-6xl font-bold text-blue-500">{weather.temp}°F</div>
            <div className="text-xl text-gray-600">{weather.condition}</div>
            <div className="text-sm text-gray-500">Humidity: {weather.humidity}%</div>
          </>
        )}
      </div>
    </ModuleWrapper>
  );
};

