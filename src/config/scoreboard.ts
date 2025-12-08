import { LayoutConfig } from '../layouts/types';

export const SCOREBOARD_CONFIG: LayoutConfig & { restaurantName: string } = {
  id: 'main-dashboard',
  restaurantName: 'Lazy Dog Restaurant - Brea, CA',
  type: 'grid', // Change to 'split' to test SplitLayout
  assignments: {
    'zone1': 'weather', 
    'zone2': 'events',
    'zone3': 'laborhours',
    // Split layout mapping
    'sidebar': 'weather',
    'main': 'sales'
  }
};

