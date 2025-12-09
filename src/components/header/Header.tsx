import { useState, useEffect } from 'react';
import logo from '../../assets/logo.png';
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
      <h1 className="flex items-center">
        <div className="flex items-center" style={{ maxHeight: 80 }}>
          <img
            src={logo}
            alt={restaurantName}
            className="h-12 md:h-16 lg:h-20 w-auto max-w-[320px] object-contain"
          />
        </div>
      </h1>
      <div className="text-xl font-medium text-gray-600">
        {currentDateTime.toLocaleDateString()} {currentDateTime.toLocaleTimeString()}
      </div>
    </div>
  );
};

