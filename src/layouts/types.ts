import { ReactNode } from 'react';

export type LayoutType = 'grid' | 'split';

export interface LayoutProps {
  zones: Record<string, ReactNode>;
}

export interface LayoutConfig {
  id: string;
  type: LayoutType;
  // Map of zone names to module IDs
  assignments: Record<string, string>; 
}

