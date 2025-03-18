/**
 * Module for initializing Highcharts and loading required modules
 */
import { formatOHLCData } from './dataUtils';
import { updateOHLCDisplay } from './uiUtils';
import { registerCustomIndicators } from './indicators';

// Global variable to track initialization
let highchartsInstance = null;

/**
 * Initialize Highcharts with all required modules
 * This function should only be called client-side
 */
export const initHighcharts = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.warn('Attempted to initialize Highcharts in a non-browser environment');
    return null;
  }
  
  // Return cached instance if already initialized
  if (highchartsInstance) {
    console.log('Returning existing Highcharts instance');
    return highchartsInstance;
  }
  
  try {
    console.log('Initializing Highcharts...');
    
    // Import Highcharts directly
    // We need to use require here instead of import to avoid SSR issues
    const Highcharts = require('highcharts/highstock');
    
    // Register custom indicators
    registerCustomIndicators(Highcharts);
    
    // Initialize our own flags functionality since the module is causing issues
    if (!Highcharts.seriesTypes.flags) {
      // Add a basic implementation of the flags series type
      Highcharts.seriesType('flags', 'column', {
        // Default options
        pointRange: 0,
        shape: 'flag',
        stackDistance: 12,
        textAlign: 'center',
        tooltip: {
          pointFormat: '{point.text}<br/>'
        },
        threshold: null,
        y: -30,
        // Custom styling
        fillColor: '#ffffff',
        lineWidth: 1,
        states: {
          hover: {
            brightness: 0.2,
            fillColor: '#ccc'
          }
        },
        style: {
          fontSize: '11px',
          fontWeight: 'bold',
          textAlign: 'center'
        }
      });
      
      console.log('✅ Custom flags implementation enabled');
    }
    
    // Mark the Highcharts instance with a flag to indicate we've initialized everything
    Highcharts.hasCustomIndicators = true;
    
    // Cache the instance
    highchartsInstance = Highcharts;
    
    return Highcharts;
  } catch (error) {
    console.error('❌ Error initializing Highcharts:', error);
    return null;
  }
};

/**
 * Fallback chart function in case Highcharts fails to load
 */
export const createBasicChart = (container, data) => {
  if (typeof window === 'undefined' || !container) return;
  
  try {
    const formattedData = formatOHLCData(data);
    
    // Create a simple message
    container.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h3 style="color: #d32f2f;">Advanced chart failed to load</h3>
        <p>Using simplified display instead.</p>
        <canvas id="basic-chart" width="800" height="400"></canvas>
      </div>
    `;
    
    // We could implement a basic canvas chart here if needed
    console.log('Created basic chart fallback');
  } catch (e) {
    console.error('Failed to create basic chart:', e);
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #d32f2f;">Chart could not be displayed</div>';
  }
}; 