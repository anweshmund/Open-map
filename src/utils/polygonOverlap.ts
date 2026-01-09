// @ts-expect-error - Turf.js types have module resolution issues
import { booleanIntersects, booleanContains, difference } from '@turf/turf';
import { Polygon } from 'geojson';
import { DrawingFeature } from '../types';

/**
 * Check if a polygon feature overlaps with any existing polygon features
 * Returns the overlapping feature if found, null otherwise
 */
export const findOverlappingPolygon = (
  newFeature: DrawingFeature,
  existingFeatures: DrawingFeature[]
): DrawingFeature | null => {
  // Only check against polygon-type features (polygon, rectangle, circle)
  const polygonFeatures = existingFeatures.filter(
    (f) => f.properties.type === 'polygon' || 
           f.properties.type === 'rectangle' || 
           f.properties.type === 'circle'
  );

  for (const existing of polygonFeatures) {
    if (existing.properties.id === newFeature.properties.id) {
      continue; // Skip self
    }

    // Check if geometries intersect
    if (booleanIntersects(newFeature, existing)) {
      return existing;
    }
  }

  return null;
};

/**
 * Check if a polygon fully encloses another polygon
 */
export const isFullyEnclosed = (
  outerFeature: DrawingFeature,
  innerFeature: DrawingFeature
): boolean => {
  try {
    return booleanContains(outerFeature, innerFeature);
  } catch {
    return false;
  }
};

/**
 * Auto-trim overlapping polygon by removing the overlapping portion
 * Uses Turf.js difference operation
 */
export const trimOverlappingPolygon = (
  newFeature: DrawingFeature,
  overlappingFeature: DrawingFeature
): DrawingFeature | null => {
  try {
    // Calculate difference: newFeature - overlappingFeature
    const diffResult = difference(
      newFeature.geometry as Polygon,
      overlappingFeature.geometry as Polygon
    );

    if (!diffResult || diffResult.geometry.type === 'GeometryCollection') {
      // If difference results in empty or collection, return null
      return null;
    }

    // Ensure we have a valid polygon
    if (diffResult.geometry.type === 'Polygon' || diffResult.geometry.type === 'MultiPolygon') {
      return {
        ...newFeature,
        geometry: diffResult.geometry,
      } as DrawingFeature;
    }

    return null;
  } catch (error) {
    console.error('Error trimming polygon:', error);
    return null;
  }
};

/**
 * Process new polygon feature against existing features
 * Returns the trimmed feature or null if it should be blocked
 */
export const processPolygonFeature = (
  newFeature: DrawingFeature,
  existingFeatures: DrawingFeature[]
): { feature: DrawingFeature | null; error: string | null } => {
  // Find overlapping polygon
  const overlapping = findOverlappingPolygon(newFeature, existingFeatures);

  if (!overlapping) {
    // No overlap, feature is valid
    return { feature: newFeature, error: null };
  }

  // Check if new feature fully encloses existing feature
  if (isFullyEnclosed(newFeature, overlapping)) {
    return {
      feature: null,
      error: 'Cannot create a polygon that fully encloses another polygon',
    };
  }

  // Check if existing feature fully encloses new feature
  if (isFullyEnclosed(overlapping, newFeature)) {
    return {
      feature: null,
      error: 'Cannot create a polygon that is fully enclosed by another polygon',
    };
  }

  // Try to trim the overlapping portion
  const trimmed = trimOverlappingPolygon(newFeature, overlapping);

  if (!trimmed) {
    return {
      feature: null,
      error: 'Unable to trim overlapping polygon. Please adjust your drawing.',
    };
  }

  // Recursively check if trimmed feature still overlaps with others
  const remainingFeatures = existingFeatures.filter(
    (f) => f.properties.id !== overlapping.properties.id
  );
  return processPolygonFeature(trimmed, remainingFeatures);
};

