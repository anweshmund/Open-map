import { FeatureCollection } from 'geojson';
import { DrawingFeature } from '../types';

/**
 * Export all features as GeoJSON FeatureCollection
 */
export const exportToGeoJSON = (features: DrawingFeature[]): FeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: features.map((feature) => ({
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        type: feature.properties.type,
        id: feature.properties.id,
        createdAt: feature.properties.createdAt,
      },
    })),
  };
};

/**
 * Download GeoJSON as a file
 */
export const downloadGeoJSON = (features: DrawingFeature[], filename = 'map-features.geojson'): void => {
  const geoJSON = exportToGeoJSON(features);
  const jsonString = JSON.stringify(geoJSON, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

