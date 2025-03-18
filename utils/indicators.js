/**
 * Utility functions for angle calculations in charts
 */

/**
 * Calculate the angle between two points in a chart, accounting for price-to-bar ratio
 * 
 * @param {number} x1 - X coordinate of first point (typically time)
 * @param {number} y1 - Y coordinate of first point (typically price)
 * @param {number} x2 - X coordinate of second point
 * @param {number} y2 - Y coordinate of second point
 * @param {number} [priceToBarRatio=0.00369] - Ratio of price units to time units
 * @returns {number} Angle in degrees between the two points
 */
const calculateAngleBetweenPoints = function(x1, y1, x2, y2, priceToBarRatio = 0.00369) {
  // Calculate the raw differences
  const dx = x2 - x1; // time difference
  const dy = y2 - y1; // price difference
  
  if (dx === 0) {
    // Vertical line
    return dy > 0 ? 90 : -90;
  }
  
  // Apply scaling factor to maintain ratio between time and price
  // This ensures consistent angles regardless of display scaling
  const scaledDy = dy / priceToBarRatio;
  
  // Calculate the angle in radians
  const angleRadians = Math.atan2(scaledDy, dx);
  
  // Convert to degrees
  let angleDegrees = angleRadians * (180 / Math.PI);
  
  // Normalize to the range -90 to +90 degrees
  if (angleDegrees > 90) {
    angleDegrees = 180 - angleDegrees;
  } else if (angleDegrees < -90) {
    angleDegrees = -180 - angleDegrees;
  }
  
  console.log('Angle calculation:', {
    points: { x1, y1, x2, y2 },
    raw: { dx, dy },
    scaled: { dx, scaledDy: scaledDy },
    angle: angleDegrees,
    priceToBarRatio
  });
  
  return angleDegrees;
};

export { calculateAngleBetweenPoints };
