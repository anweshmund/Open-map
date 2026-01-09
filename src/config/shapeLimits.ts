/**
 * Dynamic configuration for maximum shapes per type
 * Easily adjustable limits for each feature type
 */
export interface ShapeLimits {
  polygon: number;
  rectangle: number;
  circle: number;
  lineString: number;
}

export const DEFAULT_SHAPE_LIMITS: ShapeLimits = {
  polygon: 10,
  rectangle: 5,
  circle: 5,
  lineString: 20,
};

/**
 * Get current shape limits configuration
 * Modify this function to load from localStorage, API, or environment variables
 */
export const getShapeLimits = (): ShapeLimits => {
  // You can extend this to load from localStorage or API
  const stored = localStorage.getItem('shapeLimits');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_SHAPE_LIMITS;
    }
  }
  return DEFAULT_SHAPE_LIMITS;
};

/**
 * Save shape limits configuration
 */
export const saveShapeLimits = (limits: ShapeLimits): void => {
  localStorage.setItem('shapeLimits', JSON.stringify(limits));
};

