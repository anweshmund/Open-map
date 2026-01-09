import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DrawingFeature, DrawingTool } from '../types';
import { processPolygonFeature } from '../utils/polygonOverlap';
import { getShapeLimits, ShapeLimits } from '../config/shapeLimits';

interface MapContextType {
  features: DrawingFeature[];
  activeTool: DrawingTool;
  isDrawing: boolean;
  currentFeature: DrawingFeature | null;
  shapeLimits: ShapeLimits;
  setActiveTool: (tool: DrawingTool) => void;
  addFeature: (feature: DrawingFeature) => { success: boolean; error?: string };
  removeFeature: (id: string) => void;
  clearAllFeatures: () => void;
  setDrawingState: (isDrawing: boolean, feature: DrawingFeature | null) => void;
  updateShapeLimits: (limits: ShapeLimits) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within MapProvider');
  }
  return context;
};

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const [features, setFeatures] = useState<DrawingFeature[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingTool>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<DrawingFeature | null>(null);
  const [shapeLimits, setShapeLimitsState] = useState<ShapeLimits>(getShapeLimits());

  const updateShapeLimits = useCallback((limits: ShapeLimits) => {
    setShapeLimitsState(limits);
    localStorage.setItem('shapeLimits', JSON.stringify(limits));
  }, []);

  const addFeature = useCallback((feature: DrawingFeature): { success: boolean; error?: string } => {
    // Check shape limits
    const typeCount = features.filter((f) => f.properties.type === feature.properties.type).length;
    const limit = shapeLimits[feature.properties.type as keyof ShapeLimits];

    if (typeCount >= limit) {
      return {
        success: false,
        error: `Maximum limit of ${limit} ${feature.properties.type}s reached`,
      };
    }

    // For polygon-type features, check overlaps
    if (feature.properties.type === 'polygon' || 
        feature.properties.type === 'rectangle' || 
        feature.properties.type === 'circle') {
      const result = processPolygonFeature(feature, features);
      
      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.feature) {
        setFeatures((prev) => [...prev, result.feature!]);
        return { success: true };
      }

      return { success: false, error: 'Failed to process polygon feature' };
    }

    // LineStrings don't have overlap restrictions
    setFeatures((prev) => [...prev, feature]);
    return { success: true };
  }, [features, shapeLimits]);

  const removeFeature = useCallback((id: string) => {
    setFeatures((prev) => prev.filter((f) => f.properties.id !== id));
  }, []);

  const clearAllFeatures = useCallback(() => {
    setFeatures([]);
  }, []);

  const setDrawingState = useCallback((drawing: boolean, feature: DrawingFeature | null) => {
    setIsDrawing(drawing);
    setCurrentFeature(feature);
  }, []);

  return (
    <MapContext.Provider
      value={{
        features,
        activeTool,
        isDrawing,
        currentFeature,
        shapeLimits,
        setActiveTool,
        addFeature,
        removeFeature,
        clearAllFeatures,
        setDrawingState,
        updateShapeLimits,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

