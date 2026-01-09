// @ts-expect-error - Turf.js types have module resolution issues
import { circle as createCircleTurf } from '@turf/turf';
// @ts-expect-error - Turf.js types have module resolution issues
import { distance as calculateDistanceTurf } from '@turf/turf';
import { Polygon, LineString } from 'geojson';
import { DrawingFeature, FeatureType } from '../types';

/**
 * Generate unique ID for features
 */
export const generateFeatureId = (): string => {
  return `feature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a rectangle polygon from two corner points
 */
export const createRectangle = (
  point1: [number, number],
  point2: [number, number]
): Polygon => {
  const [lng1, lat1] = point1;
  const [lng2, lat2] = point2;

  const minLng = Math.min(lng1, lng2);
  const maxLng = Math.max(lng1, lng2);
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);

  return {
    type: 'Polygon',
    coordinates: [
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ],
  };
};

/**
 * Create a circle polygon from center point and radius in kilometers
 */
export const createCircle = (
  center: [number, number],
  radiusKm: number
): Polygon => {
  const circleGeom = createCircleTurf(center, radiusKm, { units: 'kilometers' });
  return circleGeom.geometry as Polygon;
};

/**
 * Create a DrawingFeature with proper properties
 */
export const createDrawingFeature = (
  geometry: Polygon | LineString,
  type: FeatureType
): DrawingFeature => {
  return {
    type: 'Feature',
    geometry,
    properties: {
      type,
      id: generateFeatureId(),
      createdAt: Date.now(),
    },
  };
};

/**
 * Calculate distance between two points in kilometers
 */
export const calculateDistance = (
  point1: [number, number],
  point2: [number, number]
): number => {
  return calculateDistanceTurf(point1, point2, { units: 'kilometers' });
};

