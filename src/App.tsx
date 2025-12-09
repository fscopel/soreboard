import { SCOREBOARD_CONFIG } from './config/scoreboard';
import { GridLayout } from './layouts/GridLayout';
import { SplitLayout } from './layouts/SplitLayout';
import { getModule } from './modules/registry';
import { Header } from './components/header/Header';
import { ReactNode } from 'react';

function App() {
  const config = SCOREBOARD_CONFIG;

  // Resolve modules for the zones
  const resolvedZones: Record<string, ReactNode> = {};
  const zoneSpans: Record<string, number> = {};
  const hiddenZones = new Set<string>();
  
  // Filter assignments based on layout type to avoid cross-layout spanning
  const isGrid = config.type === 'grid';
  const assignments = Object.fromEntries(
    Object.entries(config.assignments).filter(([zoneId]) =>
      isGrid ? zoneId.startsWith('zone') : zoneId === 'sidebar' || zoneId === 'main'
    )
  );
  
  // Group zones by module ID to detect spanning
  const moduleToZones: Record<string, string[]> = {};
  Object.entries(assignments).forEach(([zoneId, moduleId]) => {
    if (!moduleToZones[moduleId]) {
      moduleToZones[moduleId] = [];
    }
    moduleToZones[moduleId].push(zoneId);
  });
  
  // Process assignments and handle spanning
  Object.entries(assignments).forEach(([zoneId, moduleId]) => {
    const moduleDef = getModule(moduleId);
    if (moduleDef) {
      const Component = moduleDef.component;
      const zonesForModule = moduleToZones[moduleId];
      
      // If this module is assigned to multiple zones, handle spanning
      if (zonesForModule.length > 1) {
        // Sort zones to ensure consistent ordering
        const sortedZones = zonesForModule.sort();
        const firstZone = sortedZones[0];
        
        // Only render in the first zone, mark others as hidden
        if (zoneId === firstZone) {
          resolvedZones[zoneId] = <Component />;
          // Calculate span based on number of zones
          zoneSpans[zoneId] = zonesForModule.length;
          // Mark other zones as hidden
          sortedZones.slice(1).forEach(hiddenZone => {
            hiddenZones.add(hiddenZone);
          });
        }
      } else {
        // Single zone assignment, normal rendering
        resolvedZones[zoneId] = <Component />;
      }
    } else {
      console.warn(`Module with ID '${moduleId}' not found in registry.`);
    }
  });

  const renderLayout = () => {
    switch (config.type) {
      case 'split':
        return <SplitLayout zones={resolvedZones} />;
      case 'grid':
      default:
        return (
          <GridLayout
            zones={resolvedZones}
            zoneSpans={zoneSpans}
            hiddenZones={hiddenZones}
            rowHeights={config.rowHeights}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 font-sans text-gray-900 flex flex-col">
       <Header restaurantName={config.restaurantName} />
       <div className="flex-1">
         {renderLayout()}
       </div>
    </div>
  );
}

export default App;
