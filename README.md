# Open Map Drawing Application

A modern web application for drawing and managing geometric features on OpenStreetMap tiles. Built with React.js, TypeScript, Leaflet, and Turf.js.

## Features

- 🗺️ **OpenStreetMap Integration**: Renders free OpenStreetMap tiles with smooth zooming and panning
- ✏️ **Multiple Drawing Tools**: Support for Polygon, Rectangle, Circle, and LineString
- 🔒 **Non-Overlapping Polygons**: Automatic overlap detection and trimming for polygon-type features
- 📤 **GeoJSON Export**: Export all drawn features as a GeoJSON file
- ⚙️ **Dynamic Configuration**: Easily adjustable limits for maximum shapes per type
- 🎨 **Modern UI**: Clean, intuitive interface with visual feedback

## Tech Stack

- **React 18** with **TypeScript**
- **Vite** for build tooling
- **Leaflet** & **React-Leaflet** for map rendering
- **Turf.js** for spatial operations (overlap detection, polygon trimming)
- **CSS3** for styling

## Project Structure

```
open-map-drawing-app/
├── src/
│   ├── components/          # React components
│   │   ├── Map.tsx          # Main map container
│   │   ├── FeatureLayer.tsx # Feature rendering and drawing logic
│   │   ├── Toolbar.tsx      # Drawing tools sidebar
│   │   └── Toolbar.css      # Toolbar styles
│   ├── context/             # React Context for state management
│   │   └── MapContext.tsx   # Global state management
│   ├── config/              # Configuration files
│   │   └── shapeLimits.ts   # Dynamic shape limits configuration
│   ├── utils/               # Utility functions
│   │   ├── polygonOverlap.ts # Overlap detection and trimming logic
│   │   ├── geojsonExport.ts  # GeoJSON export functionality
│   │   └── shapeHelpers.ts   # Shape creation helpers
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Shared types and interfaces
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── README.md                # This file
```

## Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd open-map-drawing-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - The application will be available at `http://localhost:5173` (or the port shown in terminal)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## Usage Guide

### Drawing Features

1. **Polygon**: 
   - Click the Polygon tool in the sidebar
   - Click on the map to add vertices
   - Double-click to finish the polygon

2. **Rectangle**:
   - Click the Rectangle tool
   - Click and drag on the map to draw a rectangle
   - Release mouse to complete

3. **Circle**:
   - Click the Circle tool
   - Click on the map to set the center
   - Drag to set the radius
   - Release mouse to complete

4. **LineString**:
   - Click the LineString tool
   - Click on the map to add points
   - Double-click to finish the line

### Constraints

- **Non-overlapping Rule**: Polygon-type features (Polygon, Rectangle, Circle) cannot overlap. The system automatically trims overlapping portions.
- **Enclosure Blocking**: If a polygon fully encloses another (or vice versa), the operation is blocked with an error message.
- **LineString Freedom**: LineStrings are exempt from overlap rules and can freely cross other features.

### Exporting Features

Click the "Export GeoJSON" button in the toolbar to download all drawn features as a GeoJSON file.

### Configuration

Shape limits can be adjusted in `src/config/shapeLimits.ts`:

```typescript
export const DEFAULT_SHAPE_LIMITS: ShapeLimits = {
  polygon: 10,      // Maximum polygons
  rectangle: 5,     // Maximum rectangles
  circle: 5,        // Maximum circles
  lineString: 20,   // Maximum line strings
};
```

The configuration is stored in localStorage and persists across sessions.

## Polygon Overlap Logic

The application uses **Turf.js** for spatial operations to ensure non-overlapping polygons:

### Detection Algorithm

1. **Intersection Check**: When a new polygon-type feature is added, the system checks if it intersects with any existing polygon-type features using `turf.booleanIntersects()`.

2. **Enclosure Detection**: 
   - If a new polygon fully encloses an existing one, the operation is blocked
   - If an existing polygon fully encloses the new one, the operation is blocked
   - Uses `turf.booleanContains()` for detection

3. **Auto-Trim Process**:
   - If overlap is detected (but no full enclosure), the system uses `turf.difference()` to remove the overlapping portion
   - The trimmed polygon is recursively checked against remaining features
   - If trimming results in an invalid geometry, the operation is blocked

### Implementation Details

The core logic is in `src/utils/polygonOverlap.ts`:

- `findOverlappingPolygon()`: Finds the first overlapping polygon feature
- `isFullyEnclosed()`: Checks if one polygon fully contains another
- `trimOverlappingPolygon()`: Removes overlapping portions using Turf.js difference operation
- `processPolygonFeature()`: Main function that orchestrates the overlap handling

### Example Scenario

```
Existing: [Rectangle A]
New:      [Circle B that overlaps Rectangle A]

Result:   [Circle B trimmed to exclude overlap with Rectangle A]
```

## Sample GeoJSON Export

When you export features, the GeoJSON structure looks like this:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng1, lat1], [lng2, lat2], ...]]
      },
      "properties": {
        "type": "polygon",
        "id": "feature_1234567890_abc123",
        "createdAt": 1234567890
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[lng1, lat1], [lng2, lat2], ...]
      },
      "properties": {
        "type": "lineString",
        "id": "feature_1234567891_def456",
        "createdAt": 1234567891
      }
    }
  ]
}
```

## Dependencies

All dependencies are listed in `package.json`:

### Production Dependencies
- `react`: ^18.2.0
- `react-dom`: ^18.2.0
- `leaflet`: ^1.9.4
- `react-leaflet`: ^4.2.1
- `@turf/turf`: ^6.5.0

### Development Dependencies
- `typescript`: ^5.2.2
- `vite`: ^5.0.8
- `@vitejs/plugin-react`: ^4.2.1
- And TypeScript/ESLint related packages

## Code Quality

- **Strict TypeScript**: Full type safety throughout the codebase
- **Modular Architecture**: Separated concerns with components, hooks, utils, and services
- **React Context**: Centralized state management using React Context API
- **Inline Comments**: Complex logic (especially overlap handling) is well-commented
- **Clean Code**: Follows React best practices and modern JavaScript patterns

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Deploy (automatic on push)

### Netlify

1. Push code to GitHub
2. Import project in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

### GitHub Pages

1. Build the project: `npm run build`
2. Follow GitHub Pages deployment guide for Vite projects

## License

This project is created as a frontend development assignment.

## Author

Built with ❤️ using React, TypeScript, and modern web technologies.

