import { LayoutConfig } from '../layouts/types';

export const SCOREBOARD_CONFIG: LayoutConfig & { restaurantName: string; videoUrl?: string } = {
  id: 'main-dashboard',
  restaurantName: 'Lazy Dog Restaurant - Brea, CA',
  type: 'grid', // Change to 'split' to test SplitLayout
  assignments: {
    // Grid layout: single instance of each module
    'zone1': 'weather',
    'zone2': 'sales',
    'zone3': 'video',
    // Split layout mapping (used when type: 'split')
    'sidebar': 'weather',
    'main': 'sales'
  },
  // Video feed URL (can be direct stream or a page)
  // Local video served from Vite public folder
  videoUrl: '/videos/hoststandBrea.mp4'
};

