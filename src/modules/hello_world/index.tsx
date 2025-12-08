import { useEffect, useState } from 'react';
import { ModuleWrapper } from '../../components/ModuleWrapper';

export const HelloWorldModule = () => {
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
    <ModuleWrapper title="Hello World">
       <div>
        Hello World
      </div>
    </ModuleWrapper>
  );
};

