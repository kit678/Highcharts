import { formatOHLCData, formatVolumeData, calculateYAxisRange } from './dataUtils';

/**
 * Build chart options object based on provided data and settings
 */
const buildChartOptions = (data, { 
  title = 'Price Chart', 
  priceToBarRatio = 0.00369, 
  isRatioLocked = true,
  onSetExtremes = null,
  updateOHLCDisplay = null
}) => {
  if (!data || data.length === 0) return null;
  
  // Process data
  const ohlcData = formatOHLCData(data);
  const volumeData = formatVolumeData(data);
  
  // Calculate axis ranges
  const yAxisConfig = calculateYAxisRange(data, priceToBarRatio);
  
  // Date range info
  const startDate = ohlcData[0][0];
  const endDate = ohlcData[ohlcData.length - 1][0];
  const timeRange = endDate - startDate;
  
  // Core chart options structure
  return {
    chart: {
      height: 600,
      animation: false,
      panning: {
        enabled: true,
        type: 'xy'
      },
      zoomType: null,
      events: {
        load: function() {
          console.log("🔍 DEBUG: Chart load event triggered");
          // Ensure zooming and ratio locking works with the initial view
          if (isRatioLocked && onSetExtremes) {
            try {
              const xAxis = this.xAxis[0];
              const extremes = {
                min: xAxis.min,
                max: xAxis.max
              };
              // Initialize the proper Y-axis range based on visible X range
              setTimeout(() => onSetExtremes(xAxis, extremes), 100);
            } catch (error) {
              console.error("Error applying initial ratio:", error);
            }
          }
          
          console.log("🔍 DEBUG: Chart initialized successfully");
        },
        redraw: function() {
          // Update OHLC display on redraw if callback provided
          if (updateOHLCDisplay && this.hoverPoints && this.hoverPoints[0]) {
            updateOHLCDisplay(this.hoverPoints[0]);
          }
        }
      }
    },
    
    // Range selector options
    rangeSelector: {
      enabled: true,
      selected: 1,
      buttons: [{
        type: 'month',
        count: 1,
        text: '1m'
      }, {
        type: 'month',
        count: 3,
        text: '3m'
      }, {
        type: 'month',
        count: 6,
        text: '6m'
      }, {
        type: 'ytd',
        text: 'YTD'
      }, {
        type: 'year',
        count: 1,
        text: '1y'
      }, {
        type: 'all',
        text: 'All'
      }],
      inputEnabled: true
    },
    
    // Navigator and scrollbar
    navigator: { enabled: true },
    scrollbar: { enabled: true },
    
    // Chart title
    title: { text: title },
    
    // Plot styling
    plotOptions: {
      candlestick: {
        // Restore original colors to maintain original appearance
        color: '#2f7ed8',      // Down candle
        upColor: 'white',      // Up candle 
        lineColor: '#2f7ed8',  // Down candle border
        upLineColor: '#2f7ed8', // Up candle border
        states: {
          hover: { brightness: 0.1 }
        },
        // Ensure no gaps in data
        gapSize: 0,
        dataGrouping: {
          enabled: false  // Disable data grouping for consistent display
        }
      },
      series: {
        pointPadding: 0.1,
        groupPadding: 0.1,
        borderWidth: 1,
        dataGrouping: {
          enabled: false
        }
      }
    },
    
    // Tooltip configuration
    tooltip: {
      enabled: true,
      followPointer: true,
      followTouchMove: true,
      formatter: function() {
        if (!this.points || !this.points[0] || !this.points[0].point) return false;
        
        // Update the OHLC display if callback provided
        if (updateOHLCDisplay) {
          updateOHLCDisplay(this.points[0].point);
        }
        
        // Return false to prevent showing the tooltip
        return false;
      }
    },
    
    // X-axis configuration
    xAxis: {
      ordinal: false,      // Important - disable ordinal axis to preserve time scale
      minRange: 24 * 3600 * 1000,
      overscroll: 0.5,
      events: {
        afterSetExtremes: function(e) {
          console.log("X-axis extremes changed:", e.min, e.max);
          if (!isRatioLocked || !onSetExtremes) return;
          
          // Apply ratio lock when X-axis changes
          onSetExtremes(this, e);
        },
        setExtremes: function(e) {
          // If ratio locked, we need to also listen for setExtremes (called before afterSetExtremes)
          if (isRatioLocked && e && e.trigger && e.trigger !== 'syncExtremes') {
            console.log("X-axis setExtremes called:", e.trigger);
          }
        }
      }
    },
    
    // Y-axis configuration
    yAxis: [{
      // Price axis
      min: yAxisConfig.min,
      max: yAxisConfig.max,
      startOnTick: false,
      endOnTick: false,
      minPadding: 0.1,
      maxPadding: 0.1,
      labels: { align: 'right', x: -3 },
      title: { text: 'Price' },
      height: '60%',
      lineWidth: 2,
      resize: { enabled: true },
      events: {
        afterSetExtremes: function(e) {
          console.log("Y-axis extremes changed:", e.min, e.max);
          if (!isRatioLocked || !onSetExtremes) return;
          
          // Only apply ratio lock when Y-axis changes directly (not as result of X change)
          if (e.trigger && e.trigger !== 'syncExtremes') {
            onSetExtremes(this, e);
          }
        }
      }
    }, {
      // Volume axis
      labels: { align: 'right', x: -3 },
      title: { text: 'Volume' },
      top: '65%',
      height: '35%',
      offset: 0,
      lineWidth: 2
    }],
    
    // Series data
    series: [
      {
        type: 'candlestick',
        name: 'Price',
        id: 'price_chart',
        data: ohlcData,
        dataGrouping: { enabled: false },
        // Colors to match original appearance
        color: '#2f7ed8',      // Down candle
        upColor: 'white',      // Up candle 
        lineColor: '#2f7ed8',  // Down candle border
        upLineColor: '#2f7ed8' // Up candle border
      },
      // Add volume series if available
      ...(volumeData.length > 0 ? [{
        type: 'column',
        name: 'Volume',
        id: 'volume_chart',
        data: volumeData,
        yAxis: 1,
        color: 'rgba(100, 100, 255, 0.5)'
      }] : [])
    ]
  };
};

export { buildChartOptions }; 