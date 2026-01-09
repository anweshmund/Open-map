# Quick Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including:
- React and React DOM
- Leaflet and React-Leaflet for maps
- Turf.js for spatial operations
- TypeScript and Vite for development

### 2. Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5173` (or another port if 5173 is busy).

### 3. Open in Browser

Navigate to the URL shown in your terminal (usually `http://localhost:5173`).

## Troubleshooting

### If you see TypeScript errors:

1. Make sure all dependencies are installed: `npm install`
2. Restart your IDE/editor
3. If errors persist, try: `npm install --save-dev @types/react @types/react-dom @types/leaflet @types/geojson`

### If the map doesn't load:

1. Check browser console for errors
2. Ensure you have an internet connection (OpenStreetMap tiles are loaded from the web)
3. Try clearing browser cache

### If drawing doesn't work:

1. Make sure you've selected a tool from the sidebar
2. Check the browser console for any error messages
3. Ensure you're clicking on the map (not the toolbar)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder, ready to deploy to any static hosting service.

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Customize shape limits in `src/config/shapeLimits.ts`
- Modify styles in `src/components/Toolbar.css` and `src/App.css`

