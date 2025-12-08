import { ScoreboardModule } from './types';
import { WeatherModule } from './weather';
import { SalesModule } from './sales';
import { VideoModule } from './video';

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
  'video': {
    id: 'video',
    title: 'Video Feed',
    component: VideoModule
  }
};

export const getModule = (id: string): ScoreboardModule | undefined => {
  return MODULE_REGISTRY[id];
};

