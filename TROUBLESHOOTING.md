# Troubleshooting Guide

## If Nothing Happens When Clicking on the Map

### 1. Check Browser Console
Open your browser's developer tools (F12) and check for any JavaScript errors.

### 2. Verify Tool is Active
- Make sure you've clicked a drawing tool in the sidebar (Polygon, Rectangle, Circle, or Line)
- The tool button should be highlighted in blue when active
- Check the status message at the bottom of the sidebar

### 3. Try Different Tools

**Polygon:**
- Click on the map to add points
- You need at least 3 points
- Double-click to finish

**Rectangle:**
- Click and hold, then drag to draw
- Release mouse to finish

**Circle:**
- Click to set center point
- Drag to set radius
- Release mouse to finish

**LineString:**
- Click on the map to add points
- You need at least 2 points
- Double-click to finish

### 4. Check Map Loading
- Make sure the map tiles are loading (you should see the OpenStreetMap map)
- Check your internet connection (tiles are loaded from the web)

### 5. Clear Browser Cache
- Try clearing your browser cache
- Or use an incognito/private window

### 6. Restart Dev Server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 7. Reinstall Dependencies
```bash
rm -rf node_modules
npm install
npm run dev
```

## Common Issues

### Map Not Showing
- Check if Leaflet CSS is loading (check Network tab in DevTools)
- Verify the map container has height/width set

### Drawing Not Working
- Make sure a tool is selected (button should be blue)
- Try clicking directly on the map, not on the toolbar
- Check browser console for errors

### Features Not Saving
- Check if you're getting error alerts
- Verify shape limits haven't been reached
- Check browser console for errors

## Still Not Working?

1. Open browser console (F12)
2. Check for any red error messages
3. Try clicking on the map and see if any events fire
4. Verify the activeTool state is being set correctly

If issues persist, check the browser console and share any error messages.

