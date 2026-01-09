import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
// @ts-expect-error - Turf.js types have module resolution issues
import { distance, circle } from '@turf/turf';
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
  const handlersRef = React.useRef<{
    click?: (e: L.LeafletMouseEvent) => void;
    dblclick?: (e: L.LeafletMouseEvent) => void;
    mousedown?: (e: L.LeafletMouseEvent) => void;
    mousemove?: (e: L.LeafletMouseEvent) => void;
    mouseup?: (e: L.LeafletMouseEvent) => void;
  }>({});

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
    // Cleanup function
    const cleanup = () => {
      // Remove all event handlers
      if (handlersRef.current.click) {
        map.off('click', handlersRef.current.click);
      }
      if (handlersRef.current.dblclick) {
        map.off('dblclick', handlersRef.current.dblclick);
      }
      if (handlersRef.current.mousedown) {
        map.off('mousedown', handlersRef.current.mousedown);
      }
      if (handlersRef.current.mousemove) {
        map.off('mousemove', handlersRef.current.mousemove);
      }
      if (handlersRef.current.mouseup) {
        map.off('mouseup', handlersRef.current.mouseup);
      }
      
      // Clear drawing layer
      if (drawingLayerRef.current) {
        map.removeLayer(drawingLayerRef.current);
        drawingLayerRef.current = null;
      }
      
      // Reset handlers
      handlersRef.current = {};
    };

    if (!activeTool) {
      cleanup();
      startPointRef.current = null;
      polygonPointsRef.current = [];
      lineStringPointsRef.current = [];
      circleRadiusRef.current = 0;
      return cleanup;
    }

    // Polygon drawing
    if (activeTool === 'polygon') {
      // Reset points when starting new polygon
      if (!isDrawing) {
        polygonPointsRef.current = [];
      }

      const clickHandler = (e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();
        const point: [number, number] = [e.latlng.lat, e.latlng.lng];
        
        if (!isDrawing) {
          setDrawingState(true, null);
          polygonPointsRef.current = [];
        }
        
        polygonPointsRef.current.push(point);

        // Update preview
        if (drawingLayerRef.current) {
          map.removeLayer(drawingLayerRef.current);
        }

        if (polygonPointsRef.current.length >= 2) {
          const latlngs = polygonPointsRef.current.map(([lat, lng]) => [lat, lng] as [number, number]);
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

      const dblClickHandler = (e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
        if (polygonPointsRef.current.length >= 3) {
          const points = polygonPointsRef.current;
          const polygon = {
            type: 'Polygon' as const,
            coordinates: [[...points.map(([lat, lng]) => [lng, lat]), [points[0][1], points[0][0]]]],
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

      handlersRef.current.click = clickHandler;
      handlersRef.current.dblclick = dblClickHandler;
      
      // Attach event handlers
      map.on('click', clickHandler);
      map.on('dblclick', dblClickHandler);
    }
    // Rectangle drawing
    else if (activeTool === 'rectangle') {
      const mouseDownHandler = (e: L.LeafletMouseEvent) => {
        startPointRef.current = [e.latlng.lng, e.latlng.lat];
        setDrawingState(true, null);
      };

      const mouseMoveHandler = (e: L.LeafletMouseEvent) => {
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

      const mouseUpHandler = (e: L.LeafletMouseEvent) => {
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

      handlersRef.current.mousedown = mouseDownHandler;
      handlersRef.current.mousemove = mouseMoveHandler;
      handlersRef.current.mouseup = mouseUpHandler;
      
      map.on('mousedown', mouseDownHandler);
      map.on('mousemove', mouseMoveHandler);
      map.on('mouseup', mouseUpHandler);
    }
    // Circle drawing
    else if (activeTool === 'circle') {
      const mouseDownHandler = (e: L.LeafletMouseEvent) => {
        startPointRef.current = [e.latlng.lng, e.latlng.lat];
        setDrawingState(true, null);
      };

      const mouseMoveHandler = (e: L.LeafletMouseEvent) => {
        if (startPointRef.current) {
          const dist = distance(
            startPointRef.current,
            [e.latlng.lng, e.latlng.lat],
            { units: 'kilometers' }
          );
          circleRadiusRef.current = dist;

          if (drawingLayerRef.current) {
            map.removeLayer(drawingLayerRef.current);
          }

          if (circleRadiusRef.current > 0) {
            const circleGeom = circle(
              startPointRef.current,
              circleRadiusRef.current,
              { units: 'kilometers', steps: 64 }
            );
            const latlngs = circleGeom.geometry.coordinates[0].map(
              ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
            );
            drawingLayerRef.current = L.polygon(latlngs, {
              color: '#28a745',
              fillColor: '#28a745',
              fillOpacity: 0.2,
              weight: 2,
              dashArray: '5, 5',
            }).addTo(map);
          }
        }
      };

      const mouseUpHandler = () => {
        if (startPointRef.current && circleRadiusRef.current > 0) {
          const circleGeom = circle(
            startPointRef.current,
            circleRadiusRef.current,
            { units: 'kilometers', steps: 64 }
          );
          const feature: DrawingFeature = {
            type: 'Feature',
            geometry: circleGeom.geometry as import('geojson').Polygon,
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
        }
      };

      handlersRef.current.mousedown = mouseDownHandler;
      handlersRef.current.mousemove = mouseMoveHandler;
      handlersRef.current.mouseup = mouseUpHandler;
      
      map.on('mousedown', mouseDownHandler);
      map.on('mousemove', mouseMoveHandler);
      map.on('mouseup', mouseUpHandler);
    }
    // LineString drawing
    else if (activeTool === 'lineString') {
      if (!isDrawing) {
        lineStringPointsRef.current = [];
      }

      const clickHandler = (e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();
        const point: [number, number] = [e.latlng.lng, e.latlng.lat];
        
        if (!isDrawing) {
          setDrawingState(true, null);
          lineStringPointsRef.current = [];
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

      const dblClickHandler = (e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
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

      handlersRef.current.click = clickHandler;
      handlersRef.current.dblclick = dblClickHandler;
      
      map.whenReady(() => {
        map.on('click', clickHandler);
        map.on('dblclick', dblClickHandler);
      });
    }

    return cleanup;
  }, [activeTool, isDrawing, map, setDrawingState, addFeature, onFeatureAdd]);

  return null;
};
