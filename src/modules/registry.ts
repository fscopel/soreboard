import { ScoreboardModule } from './types';
import { WeatherModule } from './weather';
import { SalesModule } from './sales';
import { HelloWorldModule } from './hello_world';
import { LaborHoursModule } from './labor_hours';

// This registry will map module IDs to their definitions
export const MODULE_REGISTRY: Record<string, ScoreboardModule> = {
  'weather': {
    id: 'weather',
    title: 'Local Weather',
    component: WeatherModule
  },
  'sales': {
    id: 'sales',
    title: 'Live Sales',
    component: SalesModule
  },
   'helloworld': {
    id: 'hello',
    title: 'Hello World',
    component: HelloWorldModule
  },
  'laborhours': {
    id: 'laborhours',
    title: 'Labor Hours',
    component: LaborHoursModule
  }
};

export const getModule = (id: string): ScoreboardModule | undefined => {
  return MODULE_REGISTRY[id];
};

