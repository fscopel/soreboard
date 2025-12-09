import { ReactNode } from 'react';

export type LayoutType = 'grid' | 'split';

export interface ZoneInfo {
  content: ReactNode;
  span?: number; // Number of columns to span
  hidden?: boolean; // If true, this zone is hidden (part of a span)
}

export interface LayoutProps {
  zones: Record<string, ReactNode>;
  zoneSpans?: Record<string, number>; // Map of zone names to column span
  hiddenZones?: Set<string>; // Set of zones that should be hidden
  rowHeights?: Array<string | number>; // Optional row heights for grid layouts
}

export interface LayoutConfig {
  id: string;
  type: LayoutType;
  // Map of zone names to module IDs
  assignments: Record<string, string>; 
  rowHeights?: Array<string | number>; // Optional row heights when using the grid layout
}

