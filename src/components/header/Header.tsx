import { useState, useEffect } from 'react';
import { HeaderConfig } from './types';

export const Header = ({ restaurantName }: HeaderConfig) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-between items-center bg-white p-4 shadow-md mb-4">
      <h1 className="text-2xl font-bold text-gray-800">{restaurantName}</h1>
      <div className="text-xl font-medium text-gray-600">
        {currentDateTime.toLocaleDateString()} {currentDateTime.toLocaleTimeString()}
      </div>
    </div>
  );
};

