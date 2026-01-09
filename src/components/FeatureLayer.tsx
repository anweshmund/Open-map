import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { DrawingFeature } from '../types';
import { useMapContext } from '../context/MapContext';
import { generateFeatureId } from '../utils/shapeHelpers';

interface FeatureLayerProps {
  features: DrawingFeature[];
  onFeatureAdd: (feature: DrawingFeature) => void;
}

export const FeatureLayer: React.FC<FeatureLayerProps> = ({ features, onFeatureAdd }) => {
  const map = useMap();
  const { activeTool, isDrawing, setDrawingState, addFeature } = useMapContext();
  const layersRef = React.useRef<L.Layer[]>([]);
  const drawingLayerRef = React.useRef<L.Layer | null>(null);
  const startPointRef = React.useRef<[number, number] | null>(null);
  const circleRadiusRef = React.useRef<number>(0);
  const polygonPointsRef = React.useRef<[number, number][]>([]);
  const lineStringPointsRef = React.useRef<[number, number][]>([]);

  // Color scheme for different feature types
  const getFeatureStyle = (type: string) => {
    const styles: Record<string, L.PathOptions> = {
      polygon: { color: '#3388ff', fillColor: '#3388ff', fillOpacity: 0.3, weight: 2 },
      rectangle: { color: '#ff7800', fillColor: '#ff7800', fillOpacity: 0.3, weight: 2 },
      circle: { color: '#28a745', fillColor: '#28a745', fillOpacity: 0.3, weight: 2 },
      lineString: { color: '#dc3545', weight: 3, fill: false },
    };
    return styles[type] || styles.polygon;
  };

  // Render existing features
  useEffect(() => {
    // Clear existing layers
    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    // Add feature layers
    features.forEach((feature) => {
      let layer: L.Layer;

      if (feature.geometry.type === 'Polygon') {
        layer = L.polygon(
          feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]),
          getFeatureStyle(feature.properties.type)
        );
      } else if (feature.geometry.type === 'LineString') {
        layer = L.polyline(
          feature.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
          getFeatureStyle(feature.properties.type)
        );
      } else {
        return;
      }

      // Add popup with feature info
      layer.bindPopup(`
        <div>
          <strong>Type:</strong> ${feature.properties.type}<br/>
          <strong>ID:</strong> ${feature.properties.id.substring(0, 8)}...
        </div>
      `);

      layer.addTo(map);
      layersRef.current.push(layer);
    });
  }, [features, map]);

  // Handle drawing interactions
  useEffect(() => {
    if (!activeTool) {
      // Clean up drawing layer
      if (drawingLayerRef.current) {
        map.removeLayer(drawingLayerRef.current);
        drawingLayerRef.current = null;
      }
      startPointRef.current = null;
      polygonPointsRef.current = [];
      lineStringPointsRef.current = [];
      return;
    }

    let mouseMoveHandler: ((e: L.LeafletMouseEvent) => void) | null = null;
    let clickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;
    let mouseDownHandler: ((e: L.LeafletMouseEvent) => void) | null = null;
    let mouseUpHandler: ((e: L.LeafletMouseEvent) => void) | null = null;

    let dblClickHandler: (() => void) | null = null;

    const cleanup = () => {
      if (mouseMoveHandler) map.off('mousemove', mouseMoveHandler);
      if (clickHandler) map.off('click', clickHandler);
      if (mouseDownHandler) map.off('mousedown', mouseDownHandler);
      if (mouseUpHandler) map.off('mouseup', mouseUpHandler);
      if (dblClickHandler) map.off('dblclick', dblClickHandler);
      if (drawingLayerRef.current) {
        map.removeLayer(drawingLayerRef.current);
        drawingLayerRef.current = null;
      }
    };

    if (activeTool === 'polygon') {
      polygonPointsRef.current = [];

      clickHandler = (e: L.LeafletMouseEvent) => {
        const point: [number, number] = [e.latlng.lat, e.latlng.lng];
        
        if (!isDrawing) {
          setDrawingState(true, null);
          polygonPointsRef.current = []; // Reset points
        }
        
        polygonPointsRef.current.push(point);

        // Update preview
        if (drawingLayerRef.current) {
          map.removeLayer(drawingLayerRef.current);
        }

        if (polygonPointsRef.current.length >= 2) {
          const latlngs = polygonPointsRef.current.map(([lat, lng]) => [lat, lng] as [number, number]);
          // Close the polygon for preview
          const closedPoints = [...latlngs, latlngs[0]];
          drawingLayerRef.current = L.polygon(closedPoints, {
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.2,
            weight: 2,
            dashArray: '5, 5',
          }).addTo(map);
        }
      };

      // Double click to finish polygon
      dblClickHandler = () => {
        if (polygonPointsRef.current.length >= 3) {
          const points = polygonPointsRef.current;
          const polygon = {
            type: 'Polygon' as const,
            coordinates: [[...points.map(([lat, lng]) => [lng, lat]), [points[0][1], points[0][0]]]], // Close polygon
          };
          const feature: DrawingFeature = {
            type: 'Feature',
            geometry: polygon,
            properties: {
              type: 'polygon',
              id: generateFeatureId(),
              createdAt: Date.now(),
            },
          };
          const result = addFeature(feature);
          if (result.success) {
            onFeatureAdd(feature);
          } else {
            alert(result.error || 'Failed to add feature');
          }
          polygonPointsRef.current = [];
          cleanup();
          setDrawingState(false, null);
        }
      };

      map.on('click', clickHandler);
      map.on('dblclick', dblClickHandler);
    } else if (activeTool === 'rectangle') {
      mouseDownHandler = (e: L.LeafletMouseEvent) => {
        startPointRef.current = [e.latlng.lng, e.latlng.lat];
        setDrawingState(true, null);
      };

      mouseMoveHandler = (e: L.LeafletMouseEvent) => {
        if (startPointRef.current) {
          const endPoint: [number, number] = [e.latlng.lng, e.latlng.lat];
          
          if (drawingLayerRef.current) {
            map.removeLayer(drawingLayerRef.current);
          }

          const latlngs = [
            [startPointRef.current[1], startPointRef.current[0]],
            [endPoint[1], startPointRef.current[0]],
            [endPoint[1], endPoint[0]],
            [startPointRef.current[1], endPoint[0]],
            [startPointRef.current[1], startPointRef.current[0]],
          ] as [number, number][];

          drawingLayerRef.current = L.polygon(latlngs, {
            color: '#ff7800',
            fillColor: '#ff7800',
            fillOpacity: 0.2,
            weight: 2,
            dashArray: '5, 5',
          }).addTo(map);
        }
      };

      mouseUpHandler = (e: L.LeafletMouseEvent) => {
        if (startPointRef.current) {
          const endPoint: [number, number] = [e.latlng.lng, e.latlng.lat];
          const rectangle = {
            type: 'Polygon' as const,
            coordinates: [[
              [startPointRef.current[0], startPointRef.current[1]],
              [endPoint[0], startPointRef.current[1]],
              [endPoint[0], endPoint[1]],
              [startPointRef.current[0], endPoint[1]],
              [startPointRef.current[0], startPointRef.current[1]],
            ]],
          };
          const feature: DrawingFeature = {
            type: 'Feature',
            geometry: rectangle,
            properties: {
              type: 'rectangle',
              id: generateFeatureId(),
              createdAt: Date.now(),
            },
          };
          const result = addFeature(feature);
          if (result.success) {
            onFeatureAdd(feature);
          } else {
            alert(result.error || 'Failed to add feature');
          }
          startPointRef.current = null;
          cleanup();
          setDrawingState(false, null);
        }
      };

      map.on('mousedown', mouseDownHandler);
      map.on('mousemove', mouseMoveHandler);
      map.on('mouseup', mouseUpHandler);
    } else if (activeTool === 'circle') {
      mouseDownHandler = (e: L.LeafletMouseEvent) => {
        startPointRef.current = [e.latlng.lng, e.latlng.lat];
        setDrawingState(true, null);
      };

      mouseMoveHandler = (e: L.LeafletMouseEvent) => {
        if (startPointRef.current) {
          // Use proper distance calculation
          import('@turf/turf').then((turf) => {
            const distance = turf.distance(
              startPointRef.current!,
              [e.latlng.lng, e.latlng.lat],
              { units: 'kilometers' }
            );
            circleRadiusRef.current = distance;

            // Create circle preview
            if (circleRadiusRef.current > 0) {
              if (drawingLayerRef.current) {
                map.removeLayer(drawingLayerRef.current);
              }
              const circle = turf.circle(
                startPointRef.current!,
                circleRadiusRef.current,
                { units: 'kilometers', steps: 64 }
              );
              const latlngs = circle.geometry.coordinates[0].map(
                ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
              );
              if (drawingLayerRef.current) {
                map.removeLayer(drawingLayerRef.current);
              }
              drawingLayerRef.current = L.polygon(latlngs, {
                color: '#28a745',
                fillColor: '#28a745',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '5, 5',
              }).addTo(map);
            }
          });
        }
      };

      mouseUpHandler = (e: L.LeafletMouseEvent) => {
        if (startPointRef.current && circleRadiusRef.current > 0) {
          import('@turf/turf').then((turf) => {
            const circle = turf.circle(
              startPointRef.current!,
              circleRadiusRef.current,
              { units: 'kilometers', steps: 64 }
            );
            const feature: DrawingFeature = {
              type: 'Feature',
              geometry: circle.geometry as import('geojson').Polygon,
              properties: {
                type: 'circle',
                id: generateFeatureId(),
                createdAt: Date.now(),
              },
            };
            const result = addFeature(feature);
            if (result.success) {
              onFeatureAdd(feature);
            } else {
              alert(result.error || 'Failed to add feature');
            }
            startPointRef.current = null;
            circleRadiusRef.current = 0;
            cleanup();
            setDrawingState(false, null);
          });
        }
      };

      map.on('mousedown', mouseDownHandler);
      map.on('mousemove', mouseMoveHandler);
      map.on('mouseup', mouseUpHandler);
    } else if (activeTool === 'lineString') {
      lineStringPointsRef.current = [];

      clickHandler = (e: L.LeafletMouseEvent) => {
        const point: [number, number] = [e.latlng.lng, e.latlng.lat];
        
        if (!isDrawing) {
          setDrawingState(true, null);
          lineStringPointsRef.current = []; // Reset points
        }
        
        lineStringPointsRef.current.push(point);

        // Update preview
        if (drawingLayerRef.current) {
          map.removeLayer(drawingLayerRef.current);
        }

        if (lineStringPointsRef.current.length >= 2) {
          const latlngs = lineStringPointsRef.current.map(([lng, lat]) => [lat, lng] as [number, number]);
          drawingLayerRef.current = L.polyline(latlngs, {
            color: '#dc3545',
            weight: 3,
            dashArray: '5, 5',
          }).addTo(map);
        }
      };

      // Double click to finish line string
      dblClickHandler = () => {
        if (lineStringPointsRef.current.length >= 2) {
          const points = lineStringPointsRef.current;
          const lineString = {
            type: 'LineString' as const,
            coordinates: points,
          };
          const feature: DrawingFeature = {
            type: 'Feature',
            geometry: lineString,
            properties: {
              type: 'lineString',
              id: generateFeatureId(),
              createdAt: Date.now(),
            },
          };
          const result = addFeature(feature);
          if (result.success) {
            onFeatureAdd(feature);
          } else {
            alert(result.error || 'Failed to add feature');
          }
          lineStringPointsRef.current = [];
          cleanup();
          setDrawingState(false, null);
        }
      };

      map.on('click', clickHandler);
      map.on('dblclick', dblClickHandler);
    }

    return cleanup;
  }, [activeTool, isDrawing, map, setDrawingState, addFeature, onFeatureAdd]);

  return null;
};

