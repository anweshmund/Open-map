import React from 'react';
import { useMapContext } from '../context/MapContext';
import { downloadGeoJSON } from '../utils/geojsonExport';
import './Toolbar.css';

export const Toolbar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    features,
    clearAllFeatures,
    shapeLimits,
  } = useMapContext();

  const tools: Array<{ id: string; label: string; icon: string }> = [
    { id: 'polygon', label: 'Polygon', icon: '⬟' },
    { id: 'rectangle', label: 'Rectangle', icon: '▭' },
    { id: 'circle', label: 'Circle', icon: '○' },
    { id: 'lineString', label: 'Line', icon: '╱' },
  ];

  const handleToolClick = (toolId: string) => {
    if (activeTool === toolId) {
      setActiveTool(null); // Toggle off
    } else {
      setActiveTool(toolId as typeof activeTool);
    }
  };

  const handleExport = () => {
    if (features.length === 0) {
      alert('No features to export');
      return;
    }
    downloadGeoJSON(features);
  };

  const getFeatureCount = (type: string) => {
    return features.filter((f) => f.properties.type === type).length;
  };

  const getLimit = (type: string) => {
    return shapeLimits[type as keyof typeof shapeLimits] || 0;
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3 className="toolbar-title">Drawing Tools</h3>
        <div className="toolbar-tools">
          {tools.map((tool) => {
            const count = getFeatureCount(tool.id);
            const limit = getLimit(tool.id);
            const isActive = activeTool === tool.id;
            const isDisabled = count >= limit;

            return (
              <button
                key={tool.id}
                className={`toolbar-button ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && handleToolClick(tool.id)}
                title={`${tool.label} (${count}/${limit})`}
                disabled={isDisabled}
              >
                <span className="tool-icon">{tool.icon}</span>
                <span className="tool-label">{tool.label}</span>
                <span className="tool-count">{count}/{limit}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-actions">
          <button
            className="toolbar-button export-button"
            onClick={handleExport}
            disabled={features.length === 0}
          >
            <span className="tool-icon">💾</span>
            <span className="tool-label">Export GeoJSON</span>
          </button>
          <button
            className="toolbar-button clear-button"
            onClick={clearAllFeatures}
            disabled={features.length === 0}
          >
            <span className="tool-icon">🗑️</span>
            <span className="tool-label">Clear All</span>
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-info">
          <p className="info-text">
            <strong>Total Features:</strong> {features.length}
          </p>
          {activeTool && (
            <p className="info-text active-tool-info">
              <strong>Active:</strong> {activeTool}
              {activeTool === 'polygon' && ' (Click to add points, double-click to finish)'}
              {activeTool === 'rectangle' && ' (Click and drag to draw)'}
              {activeTool === 'circle' && ' (Click center and drag to set radius)'}
              {activeTool === 'lineString' && ' (Click to add points, double-click to finish)'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

