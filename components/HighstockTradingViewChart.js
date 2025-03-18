import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';

// Import utility functions
import { initHighcharts, createBasicChart } from '../utils/highchartsInit';
import { formatOHLCData, calculateBarTimeLength } from '../utils/dataUtils';
import { updateOHLCDisplay, calculateAngle } from '../utils/uiUtils';
import { buildChartOptions } from '../utils/chartOptionsBuilder';

/**
 * A TradingView-like chart component with price-to-bar ratio locking
 * 
 * This component renders a financial chart with:
 * - Ability to lock price-to-bar ratio (aspect ratio) to maintain angle consistency
 * - OHLC/Candlestick data visualization
 */
const HighstockTradingViewChart = ({ 
  data = [], 
  title = 'Price Chart',
  initialPriceToBarRatio = 1, // Changed from 0.00369 to 1
}) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [priceToBarRatio, setPriceToBarRatio] = useState(initialPriceToBarRatio);
  const [priceToBarRatioText, setPriceToBarRatioText] = useState(initialPriceToBarRatio.toString());
  const [isRatioLocked, setIsRatioLocked] = useState(false); // Changed from true to false
  const [highcharts, setHighcharts] = useState(null);

  // Initialize Highcharts on client-side only
  useEffect(() => {
    const loadHighcharts = async () => {
      console.log("Starting Highcharts initialization");
      try {
        const highchartsInstance = await initHighcharts();
        console.log("Highcharts initialized successfully:", {
          hasInstance: !!highchartsInstance,
          hasStockChart: !!highchartsInstance?.stockChart
        });
        setHighcharts(highchartsInstance);
      } catch (error) {
        console.error("Failed to initialize Highcharts:", error);
      }
    };
    
    loadHighcharts();
  }, []);

  // Handle extremes change for ratio locking
  const handleSetExtremes = (axis, e) => {
    if (!isRatioLocked || !chartInstanceRef.current) return;
    
    try {
      const chart = chartInstanceRef.current;
      const xAxis = axis.isXAxis ? axis : chart.xAxis[0];
      const yAxis = axis.isXAxis ? chart.yAxis[0] : axis;
      
      if (!xAxis || !yAxis) return;
      
      const xRange = xAxis.max - xAxis.min;
      const series = chart.series[0];
      
      if (!series) return;
      
      // Calculate bar time length and bars in view
      const { barTimeLength, barsInView } = calculateBarTimeLength(series, xAxis);
      
      // Add debug logging
      console.log("🔍 DEBUG: Ratio lock calculations:", {
        priceToBarRatio,
        xRange,
        barTimeLength,
        barsInView: barsInView || 'N/A',
        sourceTrigger: e?.trigger || 'unknown'
      });
      
      if (barsInView <= 0) {
        // Fallback to visible points count if barsInView calculation failed
        const allPoints = series.points || [];
        const visiblePoints = allPoints.filter(p => p.x >= xAxis.min && p.x <= xAxis.max);
        const pointsCount = Math.max(1, visiblePoints.length);
        
        console.log("🔍 DEBUG: Using visible points fallback:", {
          visiblePoints: pointsCount,
          allPoints: allPoints.length
        });
        
        // Get price values (not timestamps) from the visible points
        let minPrice = Infinity, maxPrice = -Infinity;
        visiblePoints.forEach(point => {
          minPrice = Math.min(minPrice, point.low || point.y || 0);
          maxPrice = Math.max(maxPrice, point.high || point.y || 0);
        });
        
        // Use actual price range instead of timestamp values
        const actualPriceRange = maxPrice - minPrice;
        const desiredPriceRange = priceToBarRatio * pointsCount;
        const pricePadding = (desiredPriceRange - actualPriceRange) / 2;
        
        // Calculate the center of the price range
        const priceCenter = (minPrice + maxPrice) / 2;
        
        console.log("🔍 DEBUG: Price calculation:", {
          minPrice,
          maxPrice, 
          actualPriceRange,
          desiredPriceRange,
          priceCenter
        });
        
        // Avoid setting extremes with identical values to reduce recursion
        if (
          Math.abs(yAxis.min - (priceCenter - desiredPriceRange / 2)) > 0.0001 ||
          Math.abs(yAxis.max - (priceCenter + desiredPriceRange / 2)) > 0.0001
        ) {
          // Only update if the axis is different from the one that triggered this
          if (axis.isXAxis && !e.syncYAxis) {
            // Set new extremes for Y-axis when X-axis changes
            yAxis.setExtremes(
              priceCenter - desiredPriceRange / 2,
              priceCenter + desiredPriceRange / 2,
              true,  // redraw
              false, // animation
              { syncYAxis: true } // Add flag to prevent recursion
            );
            
            console.log("✅ DEBUG: Applied ratio lock to Y-axis:", {
              newMin: priceCenter - desiredPriceRange / 2,
              newMax: priceCenter + desiredPriceRange / 2,
              desiredPriceRange
            });
          } else if (!axis.isXAxis && !e.syncXAxis && e.trigger !== 'syncExtremes') {
            // Handle Y-axis changes by adjusting X-axis if needed
            // This would only happen if user directly manipulates Y-axis
            // Implementation depends on desired behavior - often not needed
          }
        }
        
        return;
      }
      
      // Apply ratio with bar time length - this is the primary path
      const priceRange = priceToBarRatio * barsInView;
      
      // Get actual price values from the visible points
      const visiblePoints = series.points.filter(p => p.x >= xAxis.min && p.x <= xAxis.max);
      let minPrice = Infinity, maxPrice = -Infinity;
      
      visiblePoints.forEach(point => {
        minPrice = Math.min(minPrice, point.low || point.y || 0);
        maxPrice = Math.max(maxPrice, point.high || point.y || 0);
      });
      
      // Use price center from actual data, not from timestamps
      const priceCenter = (minPrice + maxPrice) / 2;
      
      console.log("🔍 DEBUG: Price calculation for primary path:", {
        minPrice,
        maxPrice,
        priceCenter,
        desiredPriceRange: priceRange
      });
      
      // Avoid setting extremes with identical values to reduce recursion
      if (
        Math.abs(yAxis.min - (priceCenter - priceRange / 2)) > 0.0001 ||
        Math.abs(yAxis.max - (priceCenter + priceRange / 2)) > 0.0001
      ) {
        // Only update if the axis is different from the one that triggered this
        if (axis.isXAxis && !e.syncYAxis) {
          // Set new extremes for Y-axis when X-axis changes
          yAxis.setExtremes(
            priceCenter - priceRange / 2,
            priceCenter + priceRange / 2,
            true,  // redraw
            false, // animation
            { syncYAxis: true } // Add flag to prevent recursion
          );
          
          console.log("✅ DEBUG: Applied ratio lock to Y-axis:", {
            newMin: priceCenter - priceRange / 2,
            newMax: priceCenter + priceRange / 2,
            priceRange
          });
        } else if (!axis.isXAxis && !e.syncXAxis && e.trigger !== 'syncExtremes') {
          // Handle Y-axis changes by adjusting X-axis if needed
          // This would only happen if user directly manipulates Y-axis
          // Implementation depends on desired behavior - often not needed
        }
      }
    } catch (error) {
      console.error('Error handling extremes change:', error);
    }
  };

  // Create or update chart when highcharts or data changes
  useEffect(() => {
    const abortController = new AbortController();
    let chart = null;
    let visibilityTimeout;

    const initChart = async () => {
      if (!chartRef.current || !data || data.length === 0) return;

      console.log("🔍 DEBUG: initChart started");
      try {
        // Initialize Highcharts
        const highchartsInstance = await initHighcharts();
        console.log("🔍 DEBUG: Highcharts instance received:", {
          hasInstance: !!highchartsInstance,
          hasStockChart: typeof highchartsInstance?.stockChart === 'function'
        });
        
        if (!highchartsInstance) {
          console.warn('❌ DEBUG: No Highcharts instance available, falling back to basic chart');
          chart = await createBasicChart(chartRef.current, data);
          return;
        }
    
        // Create chart with options from builder
        chart = highchartsInstance.stockChart(
          chartRef.current, 
          buildChartOptions(data, { 
            title, 
            priceToBarRatio, 
            isRatioLocked,
            onSetExtremes: handleSetExtremes,
            updateOHLCDisplay
          })
        );
        
        console.log("🔍 DEBUG: Chart creation result:", {
          chartCreated: !!chart,
          containerHasChildren: chartRef.current.children.length > 0
        });
        
        // Check for visible series and log data for debugging
        if (chart && chart.series && chart.series.length > 0) {
          const mainSeries = chart.series[0];
          
          visibilityTimeout = setTimeout(() => {
            if (!abortController.signal.aborted && 
                mainSeries && 
                typeof mainSeries.setVisible === 'function' && 
                mainSeries.options && 
                !mainSeries.visible) {
              console.log("🔄 DEBUG: Forcing series visibility and redraw");
              mainSeries.setVisible(true, true);
            }
          }, 200);
        }
        
        // Store the chart instance
        chartInstanceRef.current = chart;
      } catch (error) {
        console.error('❌ DEBUG: Error creating chart:', error);
      }
    };

    initChart();

    // Cleanup on unmount
    return () => {
      abortController.abort();
      clearTimeout(visibilityTimeout);
      if (chart && typeof chart.destroy === 'function') {
        try {
          chart.destroy();
        } catch (error) {
          console.warn('Error destroying chart:', error);
        }
      }
    };
  }, [data, priceToBarRatio, isRatioLocked, title, highcharts]);
    
  // UI event handlers
  const handleRatioTextChange = (e) => {
    setPriceToBarRatioText(e.target.value);
  };

  const handleRatioBlur = () => {
    const newValue = parseFloat(priceToBarRatioText);
    if (!isNaN(newValue) && newValue > 0) {
      setPriceToBarRatio(newValue);
    } else {
      setPriceToBarRatioText(priceToBarRatio.toString());
    }
  };

  const handleRatioKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRatioBlur();
      e.target.blur();
    }
  };

  const toggleRatioLock = () => {
    const newState = !isRatioLocked;
    setIsRatioLocked(newState);
    
    console.log(`Price-to-bar ratio lock ${newState ? 'enabled' : 'disabled'}`);
    
    // Apply ratio constraint when enabling
    if (newState && chartInstanceRef.current) {
      try {
        const chart = chartInstanceRef.current;
        const xAxis = chart.xAxis[0];
        const yAxis = chart.yAxis[0];
        
        if (!xAxis || !yAxis) {
          console.warn('Missing axis, cannot apply ratio lock');
          return;
        }
        
        const xRange = xAxis.max - xAxis.min;
        const series = chart.series[0];
        
        if (!series) {
          console.warn('Series not available, cannot apply ratio lock');
          return;
        }
        
        // Calculate bar time length and apply ratio
        const { barTimeLength, barsInView } = calculateBarTimeLength(series, xAxis);
        
        console.log("🔍 DEBUG: Initial ratio lock calculation:", {
          barTimeLength,
          barsInView,
          xRange
        });
        
        // If calculation failed, use visible points
        let effectiveBarsInView = barsInView;
        if (effectiveBarsInView <= 0) {
          const allPoints = series.points || [];
          const visiblePoints = allPoints.filter(p => p.x >= xAxis.min && p.x <= xAxis.max);
          
          if (visiblePoints.length >= 2) {
            effectiveBarsInView = visiblePoints.length;
          } else {
            // Estimate based on total range
            const totalRange = allPoints[allPoints.length - 1].x - allPoints[0].x;
            effectiveBarsInView = (xRange / totalRange) * allPoints.length;
          }
          
          console.log("🔍 DEBUG: Using fallback bars in view:", effectiveBarsInView);
        }
        
        effectiveBarsInView = Math.max(1, effectiveBarsInView);
        
        const yRange = priceToBarRatio * effectiveBarsInView;
        
        // Get actual price values from visible points
        const visiblePoints = series.points.filter(p => p.x >= xAxis.min && p.x <= xAxis.max);
        let minPrice = Infinity, maxPrice = -Infinity;
        
        visiblePoints.forEach(point => {
          minPrice = Math.min(minPrice, point.low || point.y || 0);
          maxPrice = Math.max(maxPrice, point.high || point.y || 0);
        });
        
        // Use price center from actual data
        const priceCenter = (minPrice + maxPrice) / 2;
        
        console.log("Applying price-to-bar ratio lock:", {
          ratio: priceToBarRatio,
          barsInView: effectiveBarsInView,
          xRange,
          requiredYRange: yRange,
          priceMin: minPrice,
          priceMax: maxPrice,
          priceCenter
        });
        
        yAxis.setExtremes(
          priceCenter - yRange / 2,
          priceCenter + yRange / 2,
          true,
          true
        );
        
        // Force the chart to recognize the ratio lock by marking the axis
        chart.ratioLocked = true;
      } catch (error) {
        console.error('Error applying ratio lock:', error);
      }
    } else if (!newState && chartInstanceRef.current) {
      // If disabling, mark the chart
      chartInstanceRef.current.ratioLocked = false;
    }
  };

  // Server-side rendering placeholder
  if (typeof window === 'undefined') {
    return (
      <div className="loading-chart">
        <p>Loading chart...</p>
        <style jsx>{`
          .loading-chart {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 400px;
            background-color: #f9f9f9;
            border-radius: 8px;
          }
        `}</style>
      </div>
    );
  }

  // Render component
  return (
    <div className="highstock-chart-container">
      <div className="chart-controls">
        <div className="ratio-control">
          <label htmlFor="price-bar-ratio">
            Price-to-Bar Ratio:
            <input
              id="price-bar-ratio"
              type="text"
              value={priceToBarRatioText}
              onChange={handleRatioTextChange}
              onBlur={handleRatioBlur}
              onKeyDown={handleRatioKeyDown}
              className="ratio-input"
            />
          </label>
          <button
            onClick={toggleRatioLock}
            className={`ratio-lock-button ${isRatioLocked ? 'locked' : 'unlocked'}`}
          >
            {isRatioLocked ? '🔒 Locked' : '🔓 Unlocked'}
          </button>
          <div className="ratio-info">
            <small>Try values between 0.1 and 10 for best results</small>
          </div>
        </div>
        
        <div className="ohlc-display-container">
          <div className="ohlc-display" id="ohlc-display">
            <span>Hover over candle</span>
          </div>
        </div>
      </div>
      <div className="highcharts-stock-chart-wrapper">
        <div ref={chartRef} className="chart-container" />
      </div>
      
      <style jsx>{`
        .highstock-chart-container {
          width: 100%;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          position: relative;
        }
        
        .chart-controls {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: flex-start;
          position: relative;
        }
        
        .ratio-control {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          flex: 0 0 auto;
          margin-right: 20px;
        }
        
        .ratio-input {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          width: 100px;
        }
        
        .ratio-lock-button {
          padding: 8px 12px;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .ratio-lock-button.locked {
          background-color: #4caf50;
          color: white;
          border-color: #388e3c;
        }
        
        .ratio-lock-button.unlocked {
          background-color: #f44336;
          color: white;
          border-color: #d32f2f;
        }
        
        .ratio-info {
          margin-top: 4px;
          font-size: 12px;
          color: #666;
        }
        
        .ohlc-display-container {
          flex: 1 1 auto;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          min-width: 300px;
        }
        
        .ohlc-display {
          background-color: rgba(255, 255, 255, 0.8);
          padding: 8px 12px;
          border-radius: 4px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
          font-size: 14px;
          z-index: 10;
          position: relative;
        }
        
        .highcharts-stock-chart-wrapper {
          position: relative;
          width: 100%;
          height: 600px;
          margin-bottom: 40px; /* Add margin to ensure navigator and scrollbar have space */
        }
        
        .chart-container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: visible; /* Ensure chart elements outside container are visible */
        }
        
        /* Override Highcharts-specific styles to fix spacing issues */
        :global(.highcharts-container) {
          overflow: visible !important;
        }
        
        :global(.highcharts-navigator-series) {
          fill-opacity: 0.3;
        }
        
        :global(.highcharts-scrollbar) {
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

HighstockTradingViewChart.propTypes = {
  data: PropTypes.array,
  title: PropTypes.string,
  initialPriceToBarRatio: PropTypes.number
};

// Export with dynamic to disable SSR for this component
export default dynamic(() => Promise.resolve(HighstockTradingViewChart), {
  ssr: false
});
