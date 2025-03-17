/**
 * Module for initializing Highcharts and loading required modules
 */
import { formatOHLCData } from './dataUtils';
import { updateOHLCDisplay } from './uiUtils';

const initHighcharts = async () => {
  if (typeof window === 'undefined') return null;
  
  console.log("🔍 DEBUG: Starting Highcharts initialization");
  try {
    // Import core Highcharts/Highstock - using a direct import instead of dynamic
    const Highcharts = await import('highcharts/highstock');
    const highchartsInstance = Highcharts.default || Highcharts;
    console.log("🔍 DEBUG: Core Highcharts loaded:", !!highchartsInstance);
    
    // Set global options with proper zooming/panning
    highchartsInstance.setOptions({
      accessibility: { enabled: true },
      credits: { enabled: false },
      chart: {
        panning: {
          enabled: true,
          type: 'xy'
        },
        zoomType: null // Disable rectangular zoom
      }
    });
    
    console.log('✅ DEBUG: Successfully initialized Highcharts core');
    
    return highchartsInstance;
  } catch (error) {
    console.error('❌ DEBUG: Error initializing Highcharts:', error);
    return null;
  }
};

/**
 * Create a basic chart when full functionality isn't available
 */
const createBasicChart = async (container, data) => {
  if (typeof window === 'undefined' || !container || !data || data.length === 0) return null;
  
  try {
    const HighchartsModule = await import('highcharts/highstock');
    const Highcharts = HighchartsModule.default || HighchartsModule;
    
    // Process data for chart
    const ohlcData = formatOHLCData(data);
    
    return Highcharts.stockChart(container, {
      chart: {
        animation: false,
        height: 600,
        panning: {
          enabled: true,
          type: 'xy'
        },
        zoomType: null, // Disable rectangular zoom
        events: {
          mousemove: function(e) {
            const point = this.series[0].searchPoint(e, true);
            if (point) updateOHLCDisplay(point, container);
          }
        }
      },
      series: [{
        type: 'candlestick',
        data: ohlcData,
        name: 'Price',
        dataGrouping: { enabled: false },
        // Restore original colors
        color: '#2f7ed8',      // Down candle
        upColor: 'white',      // Up candle 
        lineColor: '#2f7ed8',  // Down candle border
        upLineColor: '#2f7ed8' // Up candle border
      }],
      xAxis: {
        ordinal: false,
        minRange: 24 * 3600 * 1000, // Minimum range of 1 day
        overscroll: 0.5             // Allow overscroll beyond data points
      },
      yAxis: {
        startOnTick: false,
        endOnTick: false
      },
      tooltip: { enabled: false },
      rangeSelector: { enabled: false },
      navigator: { enabled: false },
      scrollbar: { enabled: false },
      credits: { enabled: false }
    });
  } catch (error) {
    console.error('Error creating basic chart:', error);
    return null;
  }
};

export { initHighcharts, createBasicChart }; 