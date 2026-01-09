import React from 'react';
import { MapProvider, useMapContext } from './context/MapContext';
import { Map } from './components/Map';
import { Toolbar } from './components/Toolbar';
import './App.css';

const AppContent: React.FC = () => {
  const { features } = useMapContext();

  const handleFeatureAdd = (feature: ReturnType<typeof useMapContext>['features'][0]) => {
    // Feature is already added in the context, this is just for map updates
    console.log('Feature added:', feature);
  };

  return (
    <div className="app">
      <Toolbar />
      <div className="map-container">
        <Map features={features} onFeatureAdd={handleFeatureAdd} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <MapProvider>
      <AppContent />
    </MapProvider>
  );
};

export default App;

