import { formatOHLCData, formatVolumeData, calculateYAxisRange } from './dataUtils';

/**
 * Build chart options object based on provided data and settings
 */
const buildChartOptions = (data, { 
  title = 'Price Chart', 
  priceToBarRatio = 1,
  isRatioLocked = true,
  onSetExtremes = null,
  updateOHLCDisplay = null,
  showPivotPoints = true, // New option to show/hide pivot points
  pivotLookback = 5,      // New option for pivot point sensitivity
  pivotMethod = 'hlc'    // Add a new option: 'close' or 'hlc' (high-low-close)
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
      panKey: undefined,
      zoomType: undefined,
      marginBottom: 100,
      spacingBottom: 20,
      spacing: [10, 10, 20, 10], // [top, right, bottom, left]
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
          
          // Initialize pivot points if enabled
          if (showPivotPoints && this.Highcharts && this.Highcharts.createPivotPoints) {
            try {
              // Give time for series to render first
              setTimeout(() => {
                this.Highcharts.createPivotPoints(this, 'price-series', { 
                  lookback: pivotLookback 
                });
              }, 200);
            } catch (error) {
              console.error("Error creating pivot points:", error);
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
      height: 40, // Explicit height
      buttonPosition: {
        align: 'center', // Center the buttons
        x: 0,
        y: 0
      },
      buttonTheme: {
        width: 28,
        height: 18,
        padding: 2,
        fill: '#f8f8f8',
        stroke: '#cccccc',
        'stroke-width': 1,
        style: {
          color: '#333333',
          fontWeight: 'normal'
        },
        states: {
          hover: {
            fill: '#e6e6e6',
            style: {
              color: '#333333'
            }
          },
          select: {
            fill: '#e6e6e6',
            style: {
              color: '#333333',
              fontWeight: 'bold'
            }
          }
        }
      },
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
    navigator: { 
      enabled: true,
      adaptToUpdatedData: true, // Ensure navigator updates with data
      height: 50,
      margin: 30, // Increased margin to avoid overlap
      outlineWidth: 1,
      maskFill: 'rgba(102, 133, 194, 0.2)',
      handles: {
        backgroundColor: '#f2f2f2',
        borderColor: '#999'
      }
    },
    scrollbar: { 
      enabled: true,
      margin: 8,
      height: 8,
      barBackgroundColor: '#cccccc',
      barBorderRadius: 5,
      barBorderWidth: 0,
      buttonBackgroundColor: '#cccccc',
      buttonBorderWidth: 0,
      buttonBorderRadius: 5,
      trackBackgroundColor: '#f2f2f2',
      trackBorderWidth: 0,
      trackBorderRadius: 5,
      liveRedraw: false // Disable live redraw for better performance
    },
    
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
        },
        clip: false,  // Allow rendering outside the plot area to prevent cutoff
        events: {
          // Ensure proper data rendering
          afterAnimate: function() {
            if (this.chart && this.chart.redraw) {
              setTimeout(() => {
                this.chart.redraw(false);
              }, 100);
            }
          }
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
      overscroll: 2,       // Increase overscroll for more space to the right
      min: null,           // Allow panning beyond the first point
      max: null,           // Allow panning beyond the last point 
      maxPadding: 0.3,     // Add more padding to the right
      minPadding: 0.05,    // Add some padding to the left
      lineWidth: 1,
      tickLength: 5,
      margin: 15, // Increased margin for labels
      offset: 5,  // Offset from the edge
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
      min: null,           // Allow panning below the lowest price
      max: null,           // Allow panning above the highest price
      startOnTick: false,
      endOnTick: false,
      minPadding: 0.2,     // Increase padding below
      maxPadding: 0.2,     // Increase padding above
      labels: { align: 'right', x: -3 },
      title: { text: 'Price' },
      height: '65%', // Increase height slightly
      lineWidth: 2,
      resize: { enabled: true },
      softMin: yAxisConfig.min,  // Soft minimum for initial view
      softMax: yAxisConfig.max,  // Soft maximum for initial view
      showEmpty: false,
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
      top: '70%', // Move down slightly
      height: '30%', // Decrease height slightly
      offset: 0,
      lineWidth: 2,
      min: null,          // Allow panning below the lowest volume
      max: null,          // Allow panning above the highest volume
      minPadding: 0.2,    // Add padding below
      maxPadding: 0.2,    // Add padding above
      showEmpty: false
    }],
    
    // Series data
    series: [
      // Main price series
      {
        type: 'candlestick',
        name: 'Price',
        id: 'price-series', // Make sure this ID is consistent
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
        id: 'volume-series',
        data: volumeData,
        yAxis: 1,
        color: 'rgba(100, 100, 255, 0.5)'
      }] : [])
      // Note: Pivot points will be added dynamically via createPivotPoints function
    ]
  };
};

export { buildChartOptions }; 