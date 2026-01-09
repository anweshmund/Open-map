import { Feature } from 'geojson';

/**
 * Supported drawing tool types
 */
export type DrawingTool = 'polygon' | 'rectangle' | 'circle' | 'lineString' | null;

/**
 * Feature type for GeoJSON properties
 */
export type FeatureType = 'polygon' | 'rectangle' | 'circle' | 'lineString';

/**
 * Extended GeoJSON Feature with custom properties
 */
export interface DrawingFeature extends Feature {
  properties: {
    type: FeatureType;
    id: string;
    createdAt: number;
    [key: string]: unknown;
  };
}

/**
 * Drawing state for active drawing operations
 */
export interface DrawingState {
  tool: DrawingTool;
  isDrawing: boolean;
  currentFeature: DrawingFeature | null;
}

