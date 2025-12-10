import { useEffect, useState } from 'react';
import { ModuleWrapper } from '../../components/ModuleWrapper';

export const SalesModule = () => {
  const [sales, setSales] = useState({ daily: 0, guests: 0 });

  useEffect(() => {
    // Mock real-time sales updates
    const interval = setInterval(() => {
      setSales(prev => ({
        daily: prev.daily + Math.floor(Math.random() * 50),
        guests: prev.guests + (Math.random() > 0.7 ? 1 : 0),
      }));
    }, 2000);

    setSales({ daily: 1250, guests: 45 });

    return () => clearInterval(interval);
  }, []);

  return (
    <ModuleWrapper title="Live Sales">
      <div className="grid grid-cols-2 gap-4 h-full items-center">
        <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
          <div className="text-sm text-green-600 uppercase font-bold tracking-wider">Sales</div>
          <div className="text-3xl font-bold text-green-800">${sales.daily.toLocaleString()}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
          <div className="text-sm text-orange-600 uppercase font-bold tracking-wider">Guests</div>
          <div className="text-3xl font-bold text-orange-800">{sales.guests}</div>
        </div>
      </div>
    </ModuleWrapper>
  );
};

