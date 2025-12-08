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
  
  Object.entries(config.assignments).forEach(([zoneId, moduleId]) => {
    const moduleDef = getModule(moduleId);
    if (moduleDef) {
      const Component = moduleDef.component;
      resolvedZones[zoneId] = <Component />;
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
        return <GridLayout zones={resolvedZones} />;
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
