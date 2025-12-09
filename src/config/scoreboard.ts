import { LayoutConfig } from '../layouts/types';

export const SCOREBOARD_CONFIG: LayoutConfig & { restaurantName: string } = {
  id: 'main-dashboard',
  restaurantName: 'Lazy Dog Restaurant - Brea, CA',
  type: 'grid', // Change to 'split' to test SplitLayout
  assignments: {
    'zone1': 'weather',
    'zone2': 'sales',
    'zone3': 'sales', // Duplicating for demo
    'zone4': 'weather', // Duplicating for demo
    'zone6': 'reservations',
    // Split layout mapping
    'sidebar': 'weather',
    'main': 'sales'
  }
};

