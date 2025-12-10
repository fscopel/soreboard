import { ComponentType } from 'react';

export interface ScoreboardModule {
  id: string;
  title: string;
  component: ComponentType;
  description?: string;
}

