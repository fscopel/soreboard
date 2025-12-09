import { LayoutConfig } from '../layouts/types';

export const SCOREBOARD_CONFIG: LayoutConfig & { restaurantName: string; videoUrl?: string } = {
  id: 'main-dashboard',
  restaurantName: 'Lazy Dog Restaurant - Brea, CA',
  type: 'grid', // Change to 'split' to test SplitLayout
  // Row heights for the 3x3 grid layout (accepts numbers as fr units or strings like "250px")
  rowHeights: ['1fr', '1fr', '1fr'],
  assignments: {
    // Grid layout: single instance of each module
    
    'zone1': 'video',
    'zone2': 'laborhours',
    'zone3': 'laborhours',
    'zone4': 'events',
    'zone5': 'reservations',
    'zone6': 'weather',
    'zone7': undefined as any,
    // Split layout mapping (used when type: 'split')
    'sidebar': 'weather',
    'main': 'sales'
  },
  // Video feed URL (can be direct stream or a page)
  // Local video served from Vite public folder
  videoUrl: '/videos/hoststandBrea.mp4'
};

