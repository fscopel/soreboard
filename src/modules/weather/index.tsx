import { useEffect, useState } from 'react';
import { ModuleWrapper } from '../../components/ModuleWrapper';

interface DailyForecastItem {
  date: string;
  min: number;
  max: number;
  code: number;
}

interface WeatherAlertItem {
  id: string;
  title: string;
  description?: string;
  severity?: string;
}

interface WeatherData {
  temp: number;
  condition: string;
  todayHigh: number;
  todayLow: number;
  forecast: DailyForecastItem[];
  alerts: WeatherAlertItem[];
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
    todayHigh: 0,
    todayLow: 0,
    forecast: [],
    alerts: [],
    loading: true,
    error: null,
  });

  const fetchWeather = async () => {
    try {
      // Brea, CA coordinates
      const latitude = 33.9153;
      const longitude = -117.8880;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&temperature_unit=fahrenheit`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      const current = data.current;
      const daily = data.daily;

      const forecast: DailyForecastItem[] = (daily?.time || []).slice(0, 3).map((date: string, i: number) => ({
        date,
        min: Math.round(daily.temperature_2m_min[i]),
        max: Math.round(daily.temperature_2m_max[i]),
        code: daily.weather_code[i],
      }));

      setWeather({
        temp: Math.round(current.temperature_2m),
        condition: getWeatherCondition(current.weather_code),
        todayHigh: forecast[0]?.max ?? 0,
        todayLow: forecast[0]?.min ?? 0,
        forecast,
        alerts: [], // will be populated below
        loading: false,
        error: null,
      });

      // Fetch active weather alerts from National Weather Service (no API key required)
      try {
        const alertsResp = await fetch(
          `https://api.weather.gov/alerts/active?point=${latitude},${longitude}`,
          { headers: { Accept: 'application/geo+json' } }
        );
        if (alertsResp.ok) {
          const alertsData = await alertsResp.json();
          const alerts: WeatherAlertItem[] = (alertsData.features || []).map((f: any) => ({
            id: f.id || f.properties?.id || `${Math.random()}`,
            title: f.properties?.headline || f.properties?.event || 'Weather Alert',
            description: f.properties?.description,
            severity: f.properties?.severity,
          }));
          setWeather(prev => ({ ...prev, alerts }));
        }
      } catch {
        // If alerts fail, keep existing state without blocking weather
      }
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
    <ModuleWrapper title="Local Weather - Brea, CA">
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        {weather.loading ? (
          <div className="text-xl text-gray-600">Loading weather data...</div>
        ) : weather.error ? (
          <div className="text-xl text-red-600">Error: {weather.error}</div>
        ) : (
          <>
            <div className="text-6xl font-bold text-blue-500">{weather.temp}°F</div>
            <div className="text-xl text-gray-600">{weather.condition}</div>
            {/* Humidity removed per request */}
            <div className="text-sm text-gray-700">Today: High {weather.todayHigh}° / Low {weather.todayLow}°</div>

            <div className="w-full max-w-xl mt-4">
              <div className="text-lg font-semibold text-gray-800 mb-2">3-Day Forecast</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {weather.forecast.map((day, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 p-3 bg-white/50">
                    <div className="text-sm text-gray-500">
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-700">{getWeatherCondition(day.code)}</div>
                    <div className="text-base font-medium text-gray-900">{day.max}° / {day.min}°</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full max-w-xl mt-4">
              <div className="text-lg font-semibold text-gray-800 mb-2">Weather Alerts</div>
              {weather.alerts.length === 0 ? (
                <div className="text-sm text-gray-600">No active alerts.</div>
              ) : (
                <div className="space-y-2">
                  {weather.alerts.map(alert => (
                    <div key={alert.id} className="rounded-md border border-red-300 bg-red-50 p-3">
                      <div className="text-sm font-semibold text-red-700">
                        {alert.title} {alert.severity ? `(${alert.severity})` : ''}
                      </div>
                      {alert.description && (
                        <div className="text-xs text-red-800 mt-1 whitespace-pre-wrap">
                          {alert.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ModuleWrapper>
  );
};

