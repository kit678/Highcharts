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
 * - Pivot point detection
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
  const [showPivotPoints, setShowPivotPoints] = useState(true);
  const [pivotLookback, setPivotLookback] = useState(5);
  const [pivotLookbackText, setPivotLookbackText] = useState('5');
  const [error, setError] = useState(null);
  const [pivotMethod, setPivotMethod] = useState('hlc'); // Default to high-low pivot detection

  // Initialize Highcharts on client-side only
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    console.log("Starting Highcharts initialization");
    
    // Use setTimeout to ensure the DOM is fully loaded
    setTimeout(() => {
      try {
        setError(null); // Clear any previous errors
        const highchartsInstance = initHighcharts();
        
        if (!highchartsInstance) {
          setError('Failed to initialize Highcharts. Check console for details.');
          return;
        }
        
        console.log("Highcharts initialized successfully");
        setHighcharts(highchartsInstance);
      } catch (error) {
        console.error("Failed to initialize Highcharts:", error);
        setError(`Failed to initialize Highcharts: ${error.message}`);
      }
    }, 0);
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

  // Toggle pivot points visibility
  const togglePivotPoints = () => {
    // Toggle state first
    const newState = !showPivotPoints;
    setShowPivotPoints(newState);
    
    // If we have a chart instance, update the pivot points
    if (chartInstanceRef.current) {
      const chart = chartInstanceRef.current;
      
      if (newState) {
        // We're enabling pivot points
        try {
          if (chart.Highcharts && typeof chart.Highcharts.createPivotPoints === 'function') {
            console.log(`Enabling pivot points with lookback=${pivotLookback}`);
            
            // Pass the raw data directly to ensure we have access to it
            chart.Highcharts.createPivotPoints(chart, 'price-series', { 
              lookback: pivotLookback,
              method: pivotMethod,
              sourceData: data // Pass the original data directly
            });
          } else {
            console.warn('createPivotPoints function not available');
            setError('Pivot points feature is not available');
          }
        } catch (err) {
          console.error('Error creating pivot points:', err);
          setError(`Failed to create pivot points: ${err.message}`);
        }
      } else {
        // We're disabling pivot points - remove the series
        try {
          console.log('Removing pivot points');
          const pivotHighs = chart.get('pivot-highs');
          const pivotLows = chart.get('pivot-lows');
          
          if (pivotHighs) pivotHighs.remove(false);
          if (pivotLows) pivotLows.remove(false);
          
          chart.redraw();
        } catch (err) {
          console.error('Error removing pivot points:', err);
        }
      }
    }
  };

  // Handle pivot lookback change
  const handlePivotLookbackChange = (e) => {
    setPivotLookbackText(e.target.value);
  };

  // Update pivot lookback when input loses focus
  const handlePivotLookbackBlur = () => {
    // Parse and validate the input value
    const value = parseInt(pivotLookbackText, 10);
    
    if (!isNaN(value) && value >= 2 && value <= 20) {
      setPivotLookback(value);
      
      // Update pivot points if enabled and chart exists
      if (showPivotPoints && chartInstanceRef.current) {
        const chart = chartInstanceRef.current;
        
        try {
          if (chart.Highcharts && typeof chart.Highcharts.createPivotPoints === 'function') {
            // Remove existing pivot points
            const pivotHighs = chart.get('pivot-highs');
            const pivotLows = chart.get('pivot-lows');
            
            if (pivotHighs) pivotHighs.remove(false);
            if (pivotLows) pivotLows.remove(false);
            
            // Create new pivot points with updated lookback
            console.log(`Updating pivot lookback to ${value}`);
            chart.Highcharts.createPivotPoints(chart, 'price-series', { 
              lookback: value,
              method: pivotMethod
            });
          } else {
            console.warn('createPivotPoints function not available');
          }
        } catch (err) {
          console.error('Error updating pivot points:', err);
          setError(`Failed to update pivot points: ${err.message}`);
        }
      }
    } else {
      // Reset to previous valid value
      setPivotLookbackText(pivotLookback.toString());
      console.log(`Invalid pivot lookback: ${value}, using ${pivotLookback} instead`);
    }
  };

  const handlePivotLookbackKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePivotLookbackBlur();
      e.target.blur();
    }
  };

  // Add toggle function
  const togglePivotMethod = () => {
    const newMethod = pivotMethod === 'hlc' ? 'close' : 'hlc';
    setPivotMethod(newMethod);
    
    // If chart exists and pivot points are enabled, refresh them
    if (chartInstanceRef.current && showPivotPoints) {
      const chart = chartInstanceRef.current;
      if (chart.Highcharts && typeof chart.Highcharts.createPivotPoints === 'function') {
        console.log(`Switching pivot detection method to: ${newMethod}`);
        
        // Clear existing pivot points
        const pivotHighs = chart.get('pivot-highs');
        const pivotLows = chart.get('pivot-lows');
        if (pivotHighs) pivotHighs.remove(false);
        if (pivotLows) pivotLows.remove(false);
        
        // Create new pivot points with updated method
        chart.Highcharts.createPivotPoints(chart, 'price-series', { 
          lookback: pivotLookback,
          method: newMethod,
          sourceData: data
        });
      }
    }
  };

  // Create or update chart when highcharts or data changes
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0 || !highcharts) return;

    console.log("🔍 DEBUG: Creating chart with data length:", data.length);
    
    try {
      setError(null); // Clear any previous errors
      
      // Create chart with options from builder
      const chartOptions = buildChartOptions(data, { 
        title, 
        priceToBarRatio, 
        isRatioLocked,
        onSetExtremes: handleSetExtremes,
        updateOHLCDisplay,
        showPivotPoints,
        pivotLookback,
        pivotMethod
      });
      
      // Log the series configuration
      if (chartOptions.series && chartOptions.series.length > 0) {
        console.log("Series configuration:", chartOptions.series.map(s => ({
          type: s.type,
          id: s.id,
          name: s.name,
          dataLength: s.data.length
        })));
      }
      
      // Create the chart
      const chart = highcharts.stockChart(chartRef.current, chartOptions);
      
      console.log("🔍 DEBUG: Chart created successfully");
      
      // Store the chart instance for later use
      chartInstanceRef.current = chart;
      
      // Attach Highcharts instance to the chart for access to utility functions
      chart.Highcharts = highcharts;

      // Explicitly create pivot points if they're enabled
      // Add longer delay and additional checking
      if (showPivotPoints) {
        console.log("🔍 DEBUG: Scheduling pivot points initialization");
        setTimeout(() => {
          try {
            if (chart && chart.Highcharts && typeof chart.Highcharts.createPivotPoints === 'function') {
              const seriesIds = chart.series.map(s => s.options.id || 'no-id').join(', ');
              console.log(`Available series IDs: ${seriesIds}`);
              
              // Check if price-series exists
              const mainSeries = chart.get('price-series');
              if (!mainSeries) {
                console.warn('price-series not found, will use first series');
              }
              
              chart.Highcharts.createPivotPoints(chart, 'price-series', {
                lookback: pivotLookback,
                method: pivotMethod
              });
            } else {
              console.error("Pivot points creation failed: Required functions not available");
            }
          } catch (err) {
            console.error("Failed to create pivot points:", err);
          }
        }, 1500); // Give the chart more time to initialize
      }

    } catch (error) {
      console.error('❌ DEBUG: Error creating chart:', error);
      setError(`Error creating chart: ${error.message}`);
      
      // Fall back to basic chart
      createBasicChart(chartRef.current, data);
    }
    
    // Cleanup function
    return () => {
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        } catch (error) {
          console.warn('Error destroying chart:', error);
        }
      }
    };
  }, [data, priceToBarRatio, isRatioLocked, title, highcharts, showPivotPoints, pivotLookback, pivotMethod]);
    
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
        
        <div className="pivot-control">
          <label htmlFor="pivot-lookback">
            Pivot Lookback:
            <input
              id="pivot-lookback"
              type="text"
              value={pivotLookbackText}
              onChange={handlePivotLookbackChange}
              onBlur={handlePivotLookbackBlur}
              onKeyDown={handlePivotLookbackKeyDown}
              className="pivot-input"
            />
          </label>
          <button
            onClick={togglePivotPoints}
            className={`pivot-toggle-button ${showPivotPoints ? 'active' : 'inactive'}`}
          >
            {showPivotPoints ? '👁️ Hide Pivots' : '👁️ Show Pivots'}
          </button>
          
          {/* Add pivot method toggle */}
          {showPivotPoints && (
            <button
              onClick={togglePivotMethod}
              className="pivot-method-button"
            >
              {pivotMethod === 'hlc' ? '🔄 Using High/Low' : '🔄 Using Close'}
            </button>
          )}
          
          <div className="pivot-info">
            <small>Number of bars to check on each side</small>
              </div>
            </div>
            
            <div className="ohlc-display-container">
              <div className="ohlc-display" id="ohlc-display">
                <span>Hover over candle</span>
              </div>
            </div>
        {error && (
          <div className="chart-error">
            <p>⚠️ {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="error-reload-button"
            >
              Reload Page
            </button>
          </div>
        )}
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
          gap: 20px;
            }
            
        .ratio-control, .pivot-control {
              display: flex;
              align-items: center;
              gap: 10px;
              flex-wrap: wrap;
              flex: 0 0 auto;
            }
            
        .ratio-input, .pivot-input {
              padding: 8px 12px;
              border: 1px solid #ccc;
              border-radius: 4px;
              font-size: 14px;
          width: 80px;
            }
            
        .ratio-lock-button, .pivot-toggle-button {
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
            
        .pivot-toggle-button.active {
          background-color: #2196f3;
          color: white;
          border-color: #0d47a1;
        }
        
        .pivot-toggle-button.inactive {
          background-color: #9e9e9e;
          color: white;
          border-color: #424242;
        }
        
        .ratio-info, .pivot-info {
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
        
        .chart-error {
          background-color: #ffebee;
          color: #c62828;
          padding: 15px;
          border-radius: 4px;
          margin-top: 15px;
          width: 100%;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        
        .error-reload-button {
          background-color: #2196f3;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .error-reload-button:hover {
          background-color: #1976d2;
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
