import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DrawingFeature } from '../types';
import { FeatureLayer } from './FeatureLayer';

// Fix for default marker icon in Leaflet with Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  features: DrawingFeature[];
  onFeatureAdd: (feature: DrawingFeature) => void;
}

// Component to handle map updates
const MapUpdater: React.FC<{ features: DrawingFeature[] }> = ({ features }) => {
  const map = useMap();
  const prevFeaturesRef = useRef<DrawingFeature[]>([]);

  useEffect(() => {
    if (features.length !== prevFeaturesRef.current.length) {
      // Fit bounds to all features when features change
      if (features.length > 0) {
        const bounds = L.latLngBounds(
          features.flatMap((feature) => {
            if (feature.geometry.type === 'Polygon') {
              return feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
            } else if (feature.geometry.type === 'LineString') {
              return feature.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
            }
            return [];
          })
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      prevFeaturesRef.current = features;
    }
  }, [features, map]);

  return null;
};

export const Map: React.FC<MapProps> = ({ features, onFeatureAdd }) => {
  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater features={features} />
      <FeatureLayer features={features} onFeatureAdd={onFeatureAdd} />
    </MapContainer>
  );
};

