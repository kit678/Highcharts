/**
 * Custom technical indicators for Highcharts
 * 
 * This module contains:
 * - An angle calculator that respects the price-to-bar ratio
 * - Pivot point detection for identifying market tops and bottoms
 */

/**
 * Calculate the angle between two points, accounting for price-to-bar ratio
 * @param {Object} p1 - Starting point {x, y}
 * @param {Object} p2 - Ending point {x, y}
 * @param {Number} priceToBarRatio - The ratio of price units to bar units
 * @returns {Number} - Angle in degrees
 */
export const calculateAngleBetweenPoints = (p1, p2, priceToBarRatio = 1) => {
  // Calculate the adjusted height based on the ratio
  const dx = p2.x - p1.x;
  const dy = (p2.y - p1.y) * priceToBarRatio;
  
  // Calculate angle in radians and convert to degrees
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = angleRad * (180 / Math.PI);
  
  return angleDeg;
};

/**
 * Detect pivot points (highs and lows) in price data according to classical technical analysis
 * @param {Array} xData - Array of x values (timestamps or indices)
 * @param {Array} yData - Array of y values (prices)
 * @param {Object} params - Parameters { lookback }
 * @returns {Object} - Arrays of pivot high and low points
 */
export const getPivotPoints = (xData, yData, params = {}) => {
  const lookback = params.lookback || 5;
  
  // Need at least 2*lookback+1 points to detect pivots
  if (yData.length < 2 * lookback + 1) {
    console.warn(`Not enough data points (${yData.length}) to detect pivots (need ${2 * lookback + 1})`);
    return { highs: [], lows: [] };
  }
  
  const pivotHighs = [];
  const pivotLows = [];
  
  // Debug data range to ensure values make sense
  const minPrice = Math.min(...yData);
  const maxPrice = Math.max(...yData);
  console.log(`Data range: min=${minPrice.toFixed(2)}, max=${maxPrice.toFixed(2)}, points=${yData.length}`);
  
  // Iterate through the data, skipping the first and last 'lookback' points
  for (let i = lookback; i < yData.length - lookback; i++) {
    // Get high and low for the current bar - for OHLC data
    // If using close prices only, both will be the same value
    const currentHigh = Array.isArray(yData[i]) ? yData[i][1] : yData[i]; // High
    const currentLow = Array.isArray(yData[i]) ? yData[i][2] : yData[i];  // Low
    
    // Check for pivot high - must be higher than ALL bars in the window
    let isPivotHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      // Skip the current bar
      if (j === i) continue;
      
      // Get high of comparison bar
      const compareHigh = Array.isArray(yData[j]) ? yData[j][1] : yData[j];
      
      // If ANY bar in window has a higher high, this is not a pivot high
      if (compareHigh >= currentHigh) {
        isPivotHigh = false;
        break;
      }
    }
    
    // Check for pivot low - must be lower than ALL bars in the window
    let isPivotLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      // Skip the current bar
      if (j === i) continue;
      
      // Get low of comparison bar
      const compareLow = Array.isArray(yData[j]) ? yData[j][2] : yData[j];
      
      // If ANY bar in window has a lower low, this is not a pivot low
      if (compareLow <= currentLow) {
        isPivotLow = false;
        break;
      }
    }
    
    // Save pivot points with their coordinates
    if (isPivotHigh) {
      pivotHighs.push({ x: xData[i], y: currentHigh, index: i });
    }
    
    if (isPivotLow) {
      pivotLows.push({ x: xData[i], y: currentLow, index: i });
    }
  }
  
  console.log(`Found ${pivotHighs.length} highs and ${pivotLows.length} lows in ${yData.length} data points`);
  
  return { highs: pivotHighs, lows: pivotLows };
};

/**
 * Register custom indicators with Highcharts
 * @param {Object} Highcharts - The Highcharts instance
 */
export const registerCustomIndicators = (Highcharts) => {
  if (!Highcharts) {
    console.error('Highcharts instance is required to register custom indicators');
    return;
  }

  // Add direct data approach for pivot points
  Highcharts.createPivotPoints = function(chart, seriesId, params = {}) {
    // Safety check - make sure we have access to the chart
    if (!chart) {
      console.error('Invalid chart instance');
      return { highs: [], lows: [] };
    }
    
    const lookback = params.lookback || 5;
    const method = params.method || 'hlc'; // 'hlc' or 'close'
    
    console.log(`Creating pivot points with method: ${method}, lookback=${lookback}`);
    
    try {
      // Get source data directly from the userOptions
      const sourceData = chart.userOptions.series && chart.userOptions.series[0] && 
                         chart.userOptions.series[0].data;
      
      if (!sourceData || !Array.isArray(sourceData) || sourceData.length === 0) {
        console.error('No source data available in chart options');
        return { highs: [], lows: [] };
      }
      
      console.log(`Processing ${sourceData.length} data points from source data`);
      
      // Create separate arrays for timestamp, highs, and lows
      const xData = [];
      const highData = [];
      const lowData = [];
      
      // Extract high and low values properly from OHLC format
      sourceData.forEach(point => {
        if (Array.isArray(point) && point.length >= 4) {
          // Standard OHLC format [timestamp, open, high, low, close]
          xData.push(point[0]);  // Timestamp
          highData.push(point[2]); // High
          lowData.push(point[3]);  // Low
        } else if (typeof point === 'object' && point.x != null) {
          // Object format {x, open, high, low, close}
          xData.push(point.x);
          highData.push(point.high != null ? point.high : point.y);
          lowData.push(point.low != null ? point.low : point.y);
        } else {
          // Simple price format
          xData.push(point[0]);
          highData.push(point[1]);
          lowData.push(point[1]);
        }
      });
      
      // Find pivot highs using high values
      const pivotHighs = [];
      for (let i = lookback; i < highData.length - lookback; i++) {
        let isPivotHigh = true;
        const currentHigh = highData[i];
        
        for (let j = i - lookback; j <= i + lookback; j++) {
          if (j === i) continue; // Skip the current bar
          
          if (highData[j] >= currentHigh) {
            isPivotHigh = false;
            break;
          }
        }
        
        if (isPivotHigh) {
          pivotHighs.push({ x: xData[i], y: currentHigh, index: i });
        }
      }
      
      // Find pivot lows using low values
      const pivotLows = [];
      for (let i = lookback; i < lowData.length - lookback; i++) {
        let isPivotLow = true;
        const currentLow = lowData[i];
        
        for (let j = i - lookback; j <= i + lookback; j++) {
          if (j === i) continue; // Skip the current bar
          
          if (lowData[j] <= currentLow) {
            isPivotLow = false;
            break;
          }
        }
        
        if (isPivotLow) {
          pivotLows.push({ x: xData[i], y: currentLow, index: i });
        }
      }
      
      console.log(`Found ${pivotHighs.length} highs and ${pivotLows.length} lows using true OHLC data`);
      
      // Remove any existing pivot series
      chart.series.forEach(series => {
        if (series.options.id === 'pivot-highs' || series.options.id === 'pivot-lows') {
          series.remove(false);
        }
      });
      
      // Add pivot high markers
      if (pivotHighs.length > 0) {
        chart.addSeries({
          type: 'scatter',
          name: 'Pivot Highs',
          id: 'pivot-highs',
          color: '#21b838',
          marker: {
            symbol: 'triangle',
            radius: 8,
            fillColor: 'rgba(33, 184, 56, 0.9)',
            lineColor: '#ffffff',
            lineWidth: 2
          },
          data: pivotHighs.map(point => [point.x, point.y]),
          showInLegend: false,
          tooltip: {
            pointFormat: '<span style="color:#21b838">●</span> Pivot High: <b>{point.y}</b><br/>'
          },
          zIndex: 10
        }, false);
        
        console.log("Added pivot highs:", pivotHighs.map(h => h.y.toFixed(2)).join(", "));
      }
      
      // Add pivot low markers
      if (pivotLows.length > 0) {
        chart.addSeries({
          type: 'scatter',
          name: 'Pivot Lows',
          id: 'pivot-lows',
          color: '#d91e1e',
          marker: {
            symbol: 'triangle-down',
            radius: 8,
            fillColor: 'rgba(217, 30, 30, 0.9)',
            lineColor: '#ffffff',
            lineWidth: 2
          },
          data: pivotLows.map(point => [point.x, point.y]),
          showInLegend: false,
          tooltip: {
            pointFormat: '<span style="color:#d91e1e">●</span> Pivot Low: <b>{point.y}</b><br/>'
          },
          zIndex: 10
        }, false);
        
        console.log("Added pivot lows:", pivotLows.map(l => l.y.toFixed(2)).join(", "));
      }
      
      // Redraw the chart
      chart.redraw();
      return { highs: pivotHighs, lows: pivotLows };
      
    } catch (error) {
      console.error('Error creating pivot points with direct data approach:', error);
      
      // Fallback to another method if the direct approach fails
      return tryAlternativePivotMethod(chart, lookback);
    }
  };
  
  // Fallback method that uses a different approach
  function tryAlternativePivotMethod(chart, lookback) {
    console.log("Trying alternative pivot detection method...");
    try {
      // Get data from chart's rendered points
      const points = [];
      let mainSeries = null;
      
      // Find the main price series
      for (let i = 0; i < chart.series.length; i++) {
        const series = chart.series[i];
        if (series.type === 'candlestick' || series.type === 'ohlc') {
          mainSeries = series;
          break;
        }
      }
      
      if (!mainSeries || !mainSeries.points || mainSeries.points.length === 0) {
        console.error("Could not find rendered points in any suitable series");
        return { highs: [], lows: [] };
      }
      
      // Extract data from rendered points
      const xData = [];
      const yData = [];
      
      mainSeries.points.forEach(point => {
        if (point && point.x && (point.close !== undefined || point.y !== undefined)) {
          xData.push(point.x);
          yData.push(point.close !== undefined ? point.close : point.y);
        }
      });
      
      if (xData.length === 0) {
        console.error("No usable data points found in rendered series");
        return { highs: [], lows: [] };
      }
      
      console.log(`Processing ${xData.length} data points from rendered series`);
      
      // Find pivot points 
      const { highs, lows } = getPivotPoints(xData, yData, { lookback });
      console.log(`Found ${highs.length} highs and ${lows.length} lows from rendered data`);
      
      // Remove any existing pivot series
      chart.series.forEach(series => {
        if (series.options.id === 'pivot-highs' || series.options.id === 'pivot-lows') {
          series.remove(false);
        }
      });
      
      // Add pivot high markers
      if (highs.length > 0) {
        chart.addSeries({
          type: 'scatter',
          name: 'Pivot Highs',
          id: 'pivot-highs',
          color: '#21b838',
          marker: {
            symbol: 'triangle',
            radius: 8,
            fillColor: 'rgba(33, 184, 56, 0.9)',
            lineColor: '#ffffff',
            lineWidth: 2
          },
          data: highs.map(point => [point.x, point.y]),
          showInLegend: false,
          tooltip: {
            pointFormat: '<span style="color:#21b838">●</span> Pivot High: <b>{point.y}</b><br/>'
          },
          zIndex: 10
        }, false);
      }
      
      // Add pivot low markers
      if (lows.length > 0) {
        chart.addSeries({
          type: 'scatter',
          name: 'Pivot Lows',
          id: 'pivot-lows',
          color: '#d91e1e',
          marker: {
            symbol: 'triangle-down',
            radius: 8,
            fillColor: 'rgba(217, 30, 30, 0.9)',
            lineColor: '#ffffff',
            lineWidth: 2
          },
          data: lows.map(point => [point.x, point.y]),
          showInLegend: false,
          tooltip: {
            pointFormat: '<span style="color:#d91e1e">●</span> Pivot Low: <b>{point.y}</b><br/>'
          },
          zIndex: 10
        }, false);
      }
      
      // Redraw the chart
      chart.redraw();
      return { highs, lows };
      
    } catch (error) {
      console.error('Error in alternative pivot method:', error);
      return { highs: [], lows: [] };
    }
  }
};
