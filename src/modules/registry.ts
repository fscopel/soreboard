import { ScoreboardModule } from './types';
import { WeatherModule } from './weather';
import { SalesModule } from './sales';
import { EventsModule } from './events';

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
  }
  ,
  'events': {
    id: 'events',
    title: 'Nearby Events (Brea)',
    component: EventsModule
  }
};

export const getModule = (id: string): ScoreboardModule | undefined => {
  return MODULE_REGISTRY[id];
};

