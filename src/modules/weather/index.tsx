import { useEffect, useState } from 'react';
import { ModuleWrapper } from '../../components/ModuleWrapper';

export const WeatherModule = () => {
  const [weather, setWeather] = useState({ temp: 0, condition: 'Loading...' });

  useEffect(() => {
    // Mock data fetching
    const interval = setInterval(() => {
      setWeather({
        temp: Math.floor(Math.random() * (30 - 10) + 10), // Random temp between 10-30
        condition: Math.random() > 0.5 ? 'Sunny' : 'Cloudy',
      });
    }, 5000);

    // Initial fetch
    setWeather({ temp: 22, condition: 'Sunny' });

    return () => clearInterval(interval);
  }, []);

  return (
    <ModuleWrapper title="Local Weather">
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-6xl font-bold text-blue-500">{weather.temp}°C</div>
        <div className="text-xl text-gray-600">{weather.condition}</div>
      </div>
    </ModuleWrapper>
  );
};

