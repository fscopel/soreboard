import { LayoutProps } from './types';

export const GridLayout = ({ zones, zoneSpans = {}, hiddenZones = new Set() }: LayoutProps) => {
  const zoneKeys = ['zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'zone6'];
  
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-4 p-4 h-full bg-gray-100">
      {zoneKeys.map((key) => {
        // Skip rendering if this zone is hidden (part of a span)
        if (hiddenZones.has(key)) {
          return null;
        }
        
        const span = zoneSpans[key] || 1;
        const colSpanClass = span === 2 ? 'col-span-2' : span === 3 ? 'col-span-3' : '';
        
        return (
          <div 
            key={key} 
            className={`bg-white rounded-lg shadow-md overflow-hidden relative ${colSpanClass}`}
          >
            {zones[key] || (
              <div className="flex items-center justify-center h-full text-gray-400">
                Empty Slot ({key})
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

