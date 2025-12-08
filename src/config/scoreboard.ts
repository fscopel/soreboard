import { LayoutConfig } from '../layouts/types';

export const SCOREBOARD_CONFIG: LayoutConfig & { restaurantName: string } = {
  id: 'main-dashboard',
  restaurantName: 'Lazy Dog Restaurant - Brea, CA',
  type: 'grid', // Change to 'split' to test SplitLayout
  assignments: {
    'zone1': 'weather',
    'zone2': 'sales',
    'zone3': 'weather', 
    'zone4': 'helloworld',
    'zone5': 'laborhours',
    'zone6': 'laborhours',
    // Split layout mapping
    'sidebar': 'weather',
    'main': 'sales'
  }
};

