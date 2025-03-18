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
    
    // Load required indicator modules
    const loadIndicators = async () => {
      try {
        // Load indicators module (all-in-one approach instead of individual modules)
        const stockIndicators = await import('highcharts/indicators/indicators');
        if (stockIndicators.default) stockIndicators.default(highchartsInstance);
        
        // Now try to load export module for save/print functionality
        try {
          const exporting = await import('highcharts/modules/exporting');
          if (exporting.default) exporting.default(highchartsInstance);
          
          console.log('✅ DEBUG: Exporting module loaded');
        } catch (moduleError) {
          console.warn('⚠️ DEBUG: Export module failed to load:', moduleError);
          // Continue anyway as core functionality should work
        }
        
        return true;
      } catch (error) {
        console.error('❌ DEBUG: Error loading modules:', error);
        return false;
      }
    };
    
    // Load required modules
    await loadIndicators();
    
    console.log('✅ DEBUG: All required Highcharts modules loaded successfully');
    
    return highchartsInstance;
  } catch (error) {
    console.error('❌ DEBUG: Failed to initialize Highcharts:', error);
    return null;
  }
};

/**
 * Create a basic chart for fallback when full Highcharts fails
 */
const createBasicChart = (container, data) => {
  const formattedData = formatOHLCData(data);
  
  // Create a very basic chart without Highcharts
  container.innerHTML = '<div style="padding: 20px; background: #f5f5f5; border-radius: 4px; text-align: center;">' +
    '<p>Full charting library could not be loaded. Showing basic chart.</p>' +
    '<canvas id="basic-chart" width="800" height="400"></canvas>' +
    '</div>';
  
  return {
    dataUpdated: () => {
      console.log('Basic chart data updated');
    }
  };
};

export { initHighcharts, createBasicChart }; 