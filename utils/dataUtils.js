/**
 * Format data for OHLC display
 */
const formatOHLCData = (data) => {
  if (!data || data.length === 0) return [];
  
  return Array.isArray(data[0]) ? data : data.map(point => [
    point.timestamp || point.date || point.x,
    point.open,
    point.high,
    point.low,
    point.close
  ]);
};

/**
 * Create volume data series if available
 */
const formatVolumeData = (data) => {
  if (!data || data.length === 0) return [];
  
  return Array.isArray(data[0]) && data[0].length >= 6 ? 
    data.map(point => [point[0], point[5]]) : [];
};

/**
 * Calculate Y-axis range based on price-to-bar ratio
 */
const calculateYAxisRange = (data, priceToBarRatio) => {
  if (!data || data.length === 0) return { min: 0, max: 100 };
  
  // Calculate price range
  const priceValues = formatOHLCData(data).flatMap(point => [point[1], point[2], point[3], point[4]]);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const priceRange = maxPrice - minPrice;
  
  // Calculate adjusted price range based on ratio
  const barCount = data.length;
  const adjustedPriceRange = priceToBarRatio * barCount;
  const paddingFactor = 0.1;
  const paddingAmount = priceRange * paddingFactor;
  
  const centerPrice = (maxPrice + minPrice) / 2;
  const yAxisMin = Math.max(minPrice - paddingAmount, centerPrice - adjustedPriceRange / 2);
  const yAxisMax = Math.min(maxPrice + paddingAmount, centerPrice + adjustedPriceRange / 2);
  
  return {
    min: yAxisMin,
    max: yAxisMax,
    centerPrice,
    priceRange,
    paddingAmount,
    adjustedPriceRange
  };
};

/**
 * Calculate the average time length between bars and the number of bars in view
 * @param {Object} series - The chart series object 
 * @param {Object} xAxis - The chart x-axis object
 * @returns {Object} An object with barTimeLength and barsInView
 */
export const calculateBarTimeLength = (series, xAxis) => {
  try {
    // Get visible points sorted by x value
    const points = (series.points || [])
      .filter(p => p && typeof p.x === 'number')
      .sort((a, b) => a.x - b.x);
      
    if (points.length < 2) {
      console.warn('Not enough points to calculate bar time length');
      return { barTimeLength: 0, barsInView: 0 };
    }
    
    // Calculate time differences between consecutive points
    const timeDiffs = [];
    for (let i = 1; i < points.length; i++) {
      const diff = points[i].x - points[i-1].x;
      if (diff > 0) timeDiffs.push(diff);
    }
    
    if (timeDiffs.length === 0) {
      console.warn('Unable to determine time differences between points');
      return { barTimeLength: 0, barsInView: 0 };
    }
    
    // Calculate the median time difference to avoid outliers affecting the calculation
    timeDiffs.sort((a, b) => a - b);
    const medianIndex = Math.floor(timeDiffs.length / 2);
    const barTimeLength = timeDiffs.length % 2 === 0
      ? (timeDiffs[medianIndex - 1] + timeDiffs[medianIndex]) / 2
      : timeDiffs[medianIndex];
    
    // Calculate bars in view based on x-axis range and bar time length
    const xRange = xAxis.max - xAxis.min;
    const barsInView = barTimeLength > 0 ? xRange / barTimeLength : 0;
    
    console.log("📊 DEBUG: Bar calculation:", {
      barTimeLength,
      barsInView: Math.ceil(barsInView),
      xRange,
      pointsCount: points.length,
      visiblePoints: points.filter(p => p.x >= xAxis.min && p.x <= xAxis.max).length
    });
    
    return { 
      barTimeLength, 
      barsInView: Math.ceil(barsInView)
    };
  } catch (error) {
    console.error('Error calculating bar time length:', error);
    return { barTimeLength: 0, barsInView: 0 };
  }
};

export { formatOHLCData, formatVolumeData, calculateYAxisRange }; 