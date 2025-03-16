import React, { useRef, useEffect, useState } from 'react';
import { createChart, CrosshairMode, LineStyle, CandlestickSeries } from 'lightweight-charts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #131722;
  color: #d1d4dc;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ToolbarContainer = styled.div`
  display: flex;
  padding: 8px;
  border-bottom: 1px solid #2a2e39;
  gap: 10px;
  align-items: center;
`;

const ChartTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #d1d4dc;
  margin-right: 15px;
`;

const ScaleInput = styled.input`
  width: 100px;
  background-color: #2a2e39;
  color: #d1d4dc;
  border: 1px solid #363c4e;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  &:focus {
    outline: none;
    border-color: #5d9cf5;
  }
`;

const Button = styled.button`
  background-color: ${(props) => (props.active ? '#5d9cf5' : '#2a2e39')};
  color: #d1d4dc;
  border: 1px solid #363c4e;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: ${(props) => (props.active ? '#5d9cf5' : '#363c4e')};
  }
`;

const InfoPanel = styled.div`
  margin-left: auto;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Label = styled.span`
  margin-right: 4px;
  color: #787b86;
`;

// The drawing layer will be an SVG overlay on top of the chart
const DrawingLayerSVG = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 2;
`;

// Canvas for interactive drawing 
const DrawingCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  pointer-events: ${props => props.active ? 'auto' : 'none'};
  cursor: ${props => props.active ? 'crosshair' : 'default'};
  touch-action: none; /* Prevent default touch behaviors like scrolling */
  user-select: none; /* Prevent text selection while drawing */
  /* Debugging outline */
  ${props => props.active ? 'outline: 1px solid rgba(93, 156, 245, 0.3);' : ''}
`;

// Angle Display Component
const AngleDisplay = styled.div`
  position: absolute;
  top: 70px;
  right: 20px;
  background-color: rgba(19, 23, 34, 0.85);
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 14px;
  color: #d1d4dc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: ${props => props.visible ? 'block' : 'none'};
  z-index: 5;
`;

/**
 * TradingViewLightweightChart Component
 * 
 * A TradingView-like chart with price-to-bar ratio locking and angle measurement tool
 * using the TradingView Lightweight Charts library.
 * 
 * @param {Object} props 
 * @param {Array} props.data - Candlestick data in format [{time, open, high, low, close, volume}, ...]
 * @param {number} props.width - Width of the chart
 * @param {number} props.height - Height of the chart
 * @param {string} props.title - Chart title
 */
const TradingViewLightweightChart = ({ data = [], width = 800, height = 500, title = '' }) => {
  // Refs for DOM elements
  const chartContainerRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const drawingLayerRef = useRef(null);
  
  // Chart state
  const [chart, setChart] = useState(null);
  const [candlestickSeries, setCandlestickSeries] = useState(null);
  const [priceToBarRatio, setPriceToBarRatio] = useState(0.01);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnAngles, setDrawnAngles] = useState([]);
  const [currentAngle, setCurrentAngle] = useState(null);
  const [chartError, setChartError] = useState(null);
  
  // Simplified drawing state
  const [drawingState, setDrawingState] = useState({
    isDrawing: false,
    startPoint: null,
    endPoint: null,
  });

  // Store logical coordinates for drawing
  const coordinatesRef = useRef({
    chartPixelRatio: null,
    priceScale: null,
    timeScale: null,
    scaleChangeSubscription: null  // Store the subscription
  });
  
  // Add a new state to track whether the ratio is locked
  const [ratioLocked, setRatioLocked] = useState(false);
  
  // Add a debounce timer ref to prevent performance issues with rapid scale changes
  const debounceTimerRef = useRef(null);
  
  // Add a ref to store the original ratio value when it was locked
  const originalRatioRef = useRef(priceToBarRatio);
  
  // Add a ref for animation frame to use for scale changes - more efficient than setTimeout
  const animationFrameRef = useRef(null);
  
  // Add a cache for scale values to avoid unnecessary calculations
  const scaleValuesCacheRef = useRef({
    lastTimeRange: null,
    lastPriceRange: null,
    lastRatio: priceToBarRatio
  });
  
  // Add an effect that updates the ref when ratio changes
  useEffect(() => {
    originalRatioRef.current = priceToBarRatio;
  }, [priceToBarRatio]);
  
  // Redraw all angles when scale changes
  const redrawAllAngles = () => {
    if (!chart || !drawingLayerRef.current) {
      console.warn("Cannot redraw angles - missing chart or drawing layer");
      return;
    }
    
    console.log("Redrawing all angles, count:", drawnAngles.length);
    
    // Clear existing lines
    while (drawingLayerRef.current.firstChild) {
      drawingLayerRef.current.removeChild(drawingLayerRef.current.firstChild);
    }
    
    // If no angles to draw, return early
    if (drawnAngles.length === 0) {
      return;
    }
    
    try {
      // Get current visible range
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleLogicalRange();
      
      if (visibleRange) {
        console.log("Current visible range:", visibleRange);
      }
      
      // Redraw each angle
      drawnAngles.forEach((angle, index) => {
        console.log(`Redrawing angle ${index}:`, angle.startPoint, "to", angle.endPoint);
        drawAngle(angle);
      });
    } catch (err) {
      console.error("Error redrawing angles:", err, err.stack);
    }
  };
  
  // Draw an angle on the SVG layer
  const drawAngle = (angleData) => {
    if (!chart || !drawingLayerRef.current) {
      console.warn("Cannot draw angle - missing chart or drawing layer");
      return;
    }
    
    try {
      const timeScale = chart.timeScale();
      const priceScale = chart.priceScale('right');
      
      if (!timeScale || !priceScale) {
        console.warn("Cannot draw angle - missing timeScale or priceScale");
        return;
      }
      
      const { startPoint, endPoint, angle } = angleData;
      
      console.log("Drawing angle:", startPoint, "to", endPoint, "angle:", angle);
      
      // Convert logical coordinates to screen coordinates
      let x1, y1, x2, y2;
      
      // Handle timeScale conversion
      if (typeof timeScale.logicalToCoordinate === 'function') {
        x1 = timeScale.logicalToCoordinate(startPoint.index);
        x2 = timeScale.logicalToCoordinate(endPoint.index);
      } else {
        // Fallback using relative position
        console.warn("timeScale.logicalToCoordinate not available, using fallback");
        const visibleRange = timeScale.getVisibleLogicalRange();
        if (!visibleRange) {
          console.warn("No visible range available for coordinate conversion");
          return;
        }
        
        const rangeWidth = visibleRange.to - visibleRange.from;
        const containerWidth = drawingLayerRef.current.width.baseVal.value;
        
        // Calculate relative position
        x1 = ((startPoint.index - visibleRange.from) / rangeWidth) * containerWidth;
        x2 = ((endPoint.index - visibleRange.from) / rangeWidth) * containerWidth;
      }
      
      // Handle priceScale conversion
      if (typeof priceScale.priceToCoordinate === 'function') {
        y1 = priceScale.priceToCoordinate(startPoint.price);
        y2 = priceScale.priceToCoordinate(endPoint.price);
      } else {
        // Fallback using relative position
        console.warn("priceScale.priceToCoordinate not available, using fallback");
        
        // Get visible price range from data
        const seriesData = candlestickSeries?.data();
        const visibleTimeRange = timeScale.getVisibleLogicalRange();
        
        if (!seriesData || !visibleTimeRange) {
          console.warn("No data or visible range available for price conversion");
          return;
        }
        
        // Find min and max prices in visible range
        const fromIndex = Math.max(0, Math.floor(visibleTimeRange.from));
        const toIndex = Math.min(seriesData.length - 1, Math.ceil(visibleTimeRange.to));
        
        let min = Infinity;
        let max = -Infinity;
        
        for (let i = fromIndex; i <= toIndex; i++) {
          if (i >= 0 && i < seriesData.length) {
            const candle = seriesData[i];
            if (candle.low < min) min = candle.low;
            if (candle.high > max) max = candle.high;
          }
        }
        
        if (min === Infinity || max === -Infinity) {
          console.warn("Cannot determine price range from data");
          return;
        }
        
        const containerHeight = drawingLayerRef.current.height.baseVal.value;
        const priceRange = max - min;
        
        // Inverse the y-coordinate (price coordinates are inverse of screen coordinates)
        y1 = containerHeight - ((startPoint.price - min) / priceRange) * containerHeight;
        y2 = containerHeight - ((endPoint.price - min) / priceRange) * containerHeight;
      }
      
      if (x1 === null || y1 === null || x2 === null || y2 === null || 
          isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
        console.warn("Invalid screen coordinates - skipping angle draw", { x1, y1, x2, y2 });
        return;
      }
      
      // Create SVG group for the angle
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'angle-group');
      
      // Draw the line
      const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineElement.setAttribute('x1', x1);
      lineElement.setAttribute('y1', y1);
      lineElement.setAttribute('x2', x2);
      lineElement.setAttribute('y2', y2);
      lineElement.setAttribute('stroke', '#5d9cf5');
      lineElement.setAttribute('stroke-width', '2');
      lineElement.setAttribute('data-start-index', startPoint.index);
      lineElement.setAttribute('data-start-price', startPoint.price);
      lineElement.setAttribute('data-end-index', endPoint.index);
      lineElement.setAttribute('data-end-price', endPoint.price);
      lineElement.setAttribute('data-angle', angle);
      
      // Add start point marker
      const startMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      startMarker.setAttribute('cx', x1);
      startMarker.setAttribute('cy', y1);
      startMarker.setAttribute('r', '4');
      startMarker.setAttribute('fill', '#5d9cf5');
      
      // Add end point marker
      const endMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      endMarker.setAttribute('cx', x2);
      endMarker.setAttribute('cy', y2);
      endMarker.setAttribute('r', '4');
      endMarker.setAttribute('fill', '#5d9cf5');
      
      // Draw the horizontal reference line (parallel to time axis)
      const refLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      refLine.setAttribute('x1', x1);
      refLine.setAttribute('y1', y1);
      refLine.setAttribute('x2', x2);
      refLine.setAttribute('y2', y1); // Same y as start point to make it horizontal
      refLine.setAttribute('stroke', 'rgba(93, 156, 245, 0.4)');
      refLine.setAttribute('stroke-width', '1');
      refLine.setAttribute('stroke-dasharray', '4,4');
      
      // Add angle arc to visualize the angle
      const arcRadius = 30;
      const arcPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Calculate angles for the arc
      let startAngle = 0; // Horizontal reference
      let endAngle = Math.atan2(y1 - y2, x2 - x1);
      
      // Convert to degrees for display
      const degAngle = (endAngle * 180 / Math.PI);
      const angleDeg = degAngle < 0 ? 360 + degAngle : degAngle;
      
      // Create arc path
      const x1Prime = x1 + arcRadius;
      const y1Prime = y1;
      const arcSweep = endAngle > 0 ? 0 : 1;
      
      const x2Prime = x1 + arcRadius * Math.cos(endAngle);
      const y2Prime = y1 - arcRadius * Math.sin(endAngle);
      
      const arcPath1 = `M ${x1} ${y1} L ${x1Prime} ${y1Prime}`;
      const arcPath2 = `M ${x1} ${y1} L ${x2Prime} ${y2Prime}`;
      
      arcPath.setAttribute('d', `${arcPath1} A ${arcRadius} ${arcRadius} 0 0 ${arcSweep} ${x2Prime} ${y2Prime}`);
      arcPath.setAttribute('fill', 'none');
      arcPath.setAttribute('stroke', '#26a69a');
      arcPath.setAttribute('stroke-width', '2');
      
      // Add angle label
      const midX = x1 + (arcRadius / 2) * Math.cos(endAngle / 2);
      const midY = y1 - (arcRadius / 2) * Math.sin(endAngle / 2);
      
      // Add angle label background
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const textWidth = angle.toString().length * 8 + 15;
      labelBg.setAttribute('x', midX - textWidth / 2);
      labelBg.setAttribute('y', midY - 10);
      labelBg.setAttribute('width', textWidth);
      labelBg.setAttribute('height', '18');
      labelBg.setAttribute('rx', '3');
      labelBg.setAttribute('fill', '#131722');
      labelBg.setAttribute('fill-opacity', '0.8');
      
      // Add angle label text
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', midX);
      label.setAttribute('y', midY);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', '#26a69a');
      label.setAttribute('font-size', '12px');
      label.textContent = `${angle}°`;
      
      // Add all elements to group
      group.appendChild(refLine);
      group.appendChild(lineElement);
      group.appendChild(arcPath);
      group.appendChild(startMarker);
      group.appendChild(endMarker);
      group.appendChild(labelBg);
      group.appendChild(label);
      
      // Add group to SVG
      drawingLayerRef.current.appendChild(group);
      console.log("Angle drawn successfully");
    } catch (err) {
      console.error("Error drawing angle:", err);
    }
  };
  
  // Improved safe apply price-to-bar ratio function with throttling - MOVED OUTSIDE USEEFFECT
  const safeApplyPriceToBarRatio = (chart, ratio, forceApply = false) => {
    try {
      // Only apply if the chart exists and has necessary methods
      if (!chart || !chart.timeScale || !chart.priceScale) {
        console.warn("Cannot apply ratio: chart or scales unavailable");
        return;
      }
      
      // Only apply if ratio is locked or forceApply is true
      if (!ratioLocked && !forceApply) {
        return;
      }
      
      const timeScale = chart.timeScale();
      const priceScale = chart.priceScale('right');
      
      // Safely check if methods exist before calling them
      if (!timeScale.getVisibleLogicalRange) {
        console.warn("timeScale.getVisibleLogicalRange method not available");
        return;
      }
      
      const visibleLogicalRange = timeScale.getVisibleLogicalRange();
      if (!visibleLogicalRange) {
        console.warn("No visible logical range available");
        return;
      }
      
      // Get the visible bars range 
      const barsRange = visibleLogicalRange.to - visibleLogicalRange.from;
      
      // Fix for the getVisibleLogicalRange issue
      let currentPriceRange, currentPriceMiddle;
      
      if (priceScale.getVisibleLogicalRange) {
        const currentVisiblePriceRange = priceScale.getVisibleLogicalRange();
        if (!currentVisiblePriceRange) {
          console.warn("No visible price range available");
          return;
        }
        
        currentPriceRange = currentVisiblePriceRange.to - currentVisiblePriceRange.from;
        currentPriceMiddle = (currentVisiblePriceRange.from + currentVisiblePriceRange.to) / 2;
      } else {
        // Updated fallback method using logical coordinates instead of coordinateToPrice
        // Check if we have data to determine price range
        const seriesData = candlestickSeries?.data();
        if (!seriesData || seriesData.length === 0) {
          console.warn("No data available to determine price range");
          return;
        }
        
        // Calculate visible price range from data
        const visibleData = [];
        const fromIndex = Math.max(0, Math.floor(visibleLogicalRange.from));
        const toIndex = Math.min(seriesData.length - 1, Math.ceil(visibleLogicalRange.to));
        
        for (let i = fromIndex; i <= toIndex; i++) {
          if (i >= 0 && i < seriesData.length) {
            visibleData.push(seriesData[i]);
          }
        }
        
        if (visibleData.length === 0) {
          console.warn("No visible data points to determine price range");
          return;
        }
        
        // Find min and max prices in visible range
        let min = Infinity;
        let max = -Infinity;
        
        for (const candle of visibleData) {
          if (candle.low < min) min = candle.low;
          if (candle.high > max) max = candle.high;
        }
        
        if (min === Infinity || max === -Infinity) {
          console.warn("Could not determine min/max prices from visible data");
          return;
        }
        
        currentPriceRange = max - min;
        currentPriceMiddle = (min + max) / 2;
        
        // Add some padding (10%) to the range for better visualization
        currentPriceRange *= 1.1;
      }
      
      // Calculate the price range based on the ratio
      const targetPriceRange = barsRange * ratio;
      
      // Calculate how much the price range needs to change
      const priceRangeChangePercent = Math.abs(targetPriceRange - currentPriceRange) / currentPriceRange;
      
      // Lower threshold to 0.5% to make the effect more noticeable (was 2%)
      // Only apply the change if it's significant or if forced
      if (forceApply || priceRangeChangePercent > 0.005) {
        // Apply new price range while maintaining the center
        if (priceScale.setVisibleLogicalRange) {
          const newPriceRange = {
            from: currentPriceMiddle - targetPriceRange / 2,
            to: currentPriceMiddle + targetPriceRange / 2
          };
          
          // Always log ratio changes to help debug
          console.log("Applying price-to-bar ratio:", {
            ratioLocked,
            ratio,
            barsRange,
            currentPriceRange,
            targetPriceRange,
            priceRangeChangePercent,
            forceApply
          });
          
          // Set new price range
          priceScale.setVisibleLogicalRange(newPriceRange);
          
          // Add a visual indicator that ratio was applied
          if (ratioLocked) {
            showRatioChangeIndicator();
          }
        } else {
          // Instead of just logging a warning, let's try an alternative approach
          console.log("priceScale.setVisibleLogicalRange method not available, using alternative approach");
          
          // Check if we can use applyOptions instead
          if (typeof priceScale.applyOptions === 'function') {
            try {
              // Try to use autoScale and fixLeftEdge options
              priceScale.applyOptions({
                autoScale: true,
                scaleMargins: {
                  top: 0.1, 
                  bottom: 0.2
                }
              });
              
              console.log("Applied alternative scaling options");
              
              // Display indicator even with alternative method
              if (ratioLocked) {
                showRatioChangeIndicator();
              }
            } catch (optErr) {
              console.warn("Failed to apply alternative scaling options:", optErr);
            }
          } else {
            console.warn("No alternative methods available to set price scale");
          }
        }
      } else {
        console.log("Skipping minor price range adjustment", {
          priceRangeChangePercent,
          currentPriceRange,
          targetPriceRange
        });
      }
    } catch (err) {
      console.warn("Error applying price-to-bar ratio:", err);
    }
  };
  
  // Show a brief visual indicator when ratio is applied
  const showRatioChangeIndicator = () => {
    // Find or create indicator element
    let indicator = document.getElementById('ratio-change-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'ratio-change-indicator';
      indicator.style.position = 'absolute';
      indicator.style.top = '60px';
      indicator.style.right = '10px';
      indicator.style.backgroundColor = 'rgba(93, 156, 245, 0.7)';
      indicator.style.color = 'white';
      indicator.style.padding = '5px 10px';
      indicator.style.borderRadius = '3px';
      indicator.style.fontSize = '12px';
      indicator.style.transition = 'opacity 0.5s';
      indicator.style.zIndex = '1000';
      document.body.appendChild(indicator);
    }
    
    // Show the indicator
    indicator.textContent = `Ratio Applied: ${priceToBarRatio.toFixed(5)}`;
    indicator.style.opacity = '1';
    
    // Hide after 1.5 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 1500);
  };
  
  // Improved scale change handlers setup with requestAnimationFrame for better performance
  // MOVED OUTSIDE USEEFFECT
  const safeSetupScaleChangeHandlers = (chart) => {
    if (!chart || !chart.timeScale) return;
    
    const timeScale = chart.timeScale();
    
    // Clean up existing subscription if any
    if (coordinatesRef.current.scaleChangeSubscription) {
      try {
        coordinatesRef.current.scaleChangeSubscription();
        coordinatesRef.current.scaleChangeSubscription = null;
      } catch (err) {
        console.warn("Error cleaning up previous subscription:", err);
      }
    }
    
    // When visible range changes (after zoom/scroll)
    try {
      if (timeScale.subscribeVisibleLogicalRangeChange) {
        const subscription = timeScale.subscribeVisibleLogicalRangeChange(() => {
          // Always redraw angles when scale changes
          redrawAllAngles();
          
          // Only apply the ratio if it's locked
          if (ratioLocked) {
            // Cancel any pending animation frame
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }
            
            // Use requestAnimationFrame for better performance than setTimeout
            animationFrameRef.current = requestAnimationFrame(() => {
              try {
                // Get current time range to check if we really need to update
                const currentTimeRange = timeScale.getVisibleLogicalRange();
                
                if (currentTimeRange) {
                  // Calculate time range width
                  const timeRangeWidth = currentTimeRange.to - currentTimeRange.from;
                  
                  // Lower threshold to ensure ratio is maintained more consistently
                  // Check if time range has changed significantly (>0.5%, was 1%)
                  const hasTimeRangeChanged = !scaleValuesCacheRef.current.lastTimeRange || 
                    Math.abs(timeRangeWidth - scaleValuesCacheRef.current.lastTimeRange) / scaleValuesCacheRef.current.lastTimeRange > 0.005;
                  
                  // Check if ratio has changed
                  const hasRatioChanged = originalRatioRef.current !== scaleValuesCacheRef.current.lastRatio;
                  
                  // Only apply if something relevant has changed
                  if (hasTimeRangeChanged || hasRatioChanged) {
                    console.log("Scale change detected, maintaining locked ratio", {
                      timeRangeWidth,
                      lastTimeRange: scaleValuesCacheRef.current.lastTimeRange,
                      ratio: originalRatioRef.current
                    });
                    safeApplyPriceToBarRatio(chart, originalRatioRef.current);
                    
                    // Update cache
                    scaleValuesCacheRef.current.lastTimeRange = timeRangeWidth;
                    scaleValuesCacheRef.current.lastRatio = originalRatioRef.current;
                  }
                }
                
                animationFrameRef.current = null;
              } catch (err) {
                console.warn("Error maintaining ratio on scale change:", err);
                animationFrameRef.current = null;
              }
            });
          }
        });
        
        // Store the subscription for cleanup
        coordinatesRef.current.scaleChangeSubscription = subscription;
      }
    } catch (err) {
      console.warn("Error setting up scale change handlers:", err);
    }
  };
  
  // Format data for the lightweight-charts library
  const formatDataForLightweightCharts = (inputData) => {
    if (!inputData || inputData.length === 0) {
      console.log("No input data to format");
      return [];
    }
    
    console.log(`Original data length: ${inputData.length}`);
    
    try {
      // STEP 1: Convert all items to proper format with numeric values and sequential indices
      const processedItems = inputData.map((item, index) => {
        // Get date info for display purposes only
        const dateObj = typeof item.date === 'string' 
          ? new Date(item.date) 
          : new Date(item.date);
        
        return {
          // Use sequential index as time (avoids any duplicate issues completely)
          time: index,
          // Store original date string for display
          dateStr: dateObj.toISOString().split('T')[0],
          // Ensure all values are numeric
          open: Number(item.open || 0),
          high: Number(item.high || 0),
          low: Number(item.low || 0),
          close: Number(item.close || 0),
          volume: Number(item.volume || 0)
        };
      });
      
      console.log(`Processed ${inputData.length} points with sequential indices`);
      
      return processedItems;
    } catch (err) {
      console.error("Error processing chart data:", err);
      return [];
    }
  };
  
  // Generate sample data if none provided
  const generateSampleData = (length) => {
    console.log("Generating sample data with sequential indices");
    const sampleData = [];
    let currentPrice = 100;
    
    for (let i = 0; i < length; i++) {
      // Random walk
      const change = (Math.random() - 0.5) * 3;
      currentPrice += change;
      
      const open = currentPrice;
      const close = open + (Math.random() - 0.5) * 2;
      const high = Math.max(open, close) + Math.random() * 1;
      const low = Math.min(open, close) - Math.random() * 1;
      const volume = Math.floor(Math.random() * 1000);
      
      sampleData.push({
        // Use sequential index as time (guaranteed unique)
        time: i,
        // Store a date string for display
        dateStr: new Date(2023, 0, i+1).toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    return sampleData;
  };
  
  // Initialize the chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Clear previous error state
    setChartError(null);
    
    // If no data provided, show error and exit early
    if (!data || data.length === 0) {
      setChartError("No data available for chart display. Please check API connection or try another symbol.");
      return;
    }
    
    // Initialize chart
    try {
    const newChart = createChart(chartContainerRef.current, {
      width,
      height: height - 40, // Subtract toolbar height
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#242832' },
        horzLines: { color: '#242832' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#363c4e',
      },
      timeScale: {
        borderColor: '#363c4e',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        vertTouchDrag: true,
      },
    });
    
    // Add candlestick series
      const newCandlestickSeries = newChart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    
      // Create a mapping function to display dates instead of indices
      const timeScale = newChart.timeScale();
      timeScale.applyOptions({
        tickMarkFormatter: (timeIndex) => {
          // Basic, robust date formatter that works with sequential indices
          try {
            // Case 1: Original data from props is available
            if (data && Array.isArray(data) && timeIndex >= 0 && timeIndex < data.length) {
              if (data[timeIndex].date) {
                const dateObj = new Date(data[timeIndex].date);
                if (!isNaN(dateObj.getTime())) {
                  return dateObj.toLocaleDateString();
                }
              }
            }
            
            // Case 2: Processed data in the series is available
            if (newCandlestickSeries) {
              const seriesData = newCandlestickSeries.data();
              if (seriesData && Array.isArray(seriesData) && timeIndex >= 0 && timeIndex < seriesData.length) {
                // If we have dateStr saved in our processed data
                if (seriesData[timeIndex].dateStr) {
                  return new Date(seriesData[timeIndex].dateStr).toLocaleDateString();
                }
              }
            }
            
            // Case 3: Fallback to showing the sequential index
            return `#${timeIndex}`;
          } catch (err) {
            console.warn("Error in tickMarkFormatter:", err);
            return `${timeIndex}`;
          }
        }
      });
      
      // Process and set data
      try {
        let chartData = [];
        
        if (data && data.length > 0) {
          console.log(`Processing ${data.length} data points from props`);
          chartData = formatDataForLightweightCharts(data);
    } else {
          // Instead of silently falling back to mock data, throw an error
          const errorMessage = "No real AAPL data available. Please check the API connection.";
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
        
        if (chartData.length > 0) {
          try {
            console.log(`Setting ${chartData.length} processed data points to chart`);
            
            // Set data with sequential indices (guaranteed no duplicates)
            newCandlestickSeries.setData(chartData);
            
            // Fit content to show all data
            timeScale.fitContent();
            
            console.log("Chart data set successfully");
          } catch (err) {
            console.error("Error setting chart data:", err);
            // Instead of falling back to minimal sample data, propagate the error
            throw new Error("Failed to set chart data: " + err.message);
          }
        } else {
          const errorMessage = "No data points available after processing";
          console.error(errorMessage);
          throw new Error(errorMessage);
    }
    
    // Save references
    setChart(newChart);
    setCandlestickSeries(newCandlestickSeries);
    
    // Get scale information for drawing
    const priceScale = newChart.priceScale('right');
    
    coordinatesRef.current = {
      ...coordinatesRef.current,
      priceScale,
      timeScale,
      chartPixelRatio: window.devicePixelRatio || 1
    };
    
        // Set up drawing layer with proper dimensions
    if (drawingLayerRef.current) {
          // Ensure the SVG has the right dimensions
      drawingLayerRef.current.setAttribute('width', width);
      drawingLayerRef.current.setAttribute('height', height - 40);
          
          // Clear any existing elements in the SVG
          while (drawingLayerRef.current.firstChild) {
            drawingLayerRef.current.removeChild(drawingLayerRef.current.firstChild);
          }
    }
    
    // Set up drawing canvas
    if (drawingCanvasRef.current) {
      drawingCanvasRef.current.width = width;
      drawingCanvasRef.current.height = height - 40;
        }
        
        // Wait for refs to be updated
        setTimeout(() => {
          // Apply safe version that won't crash 
          if (newChart) {
            try {
              // Always apply the initial ratio once when chart is created, regardless of lock state
              safeApplyPriceToBarRatio(newChart, priceToBarRatio, true);
              
              // Apply the scale change handlers
              safeSetupScaleChangeHandlers(newChart);
            } catch (err) {
              console.warn("Error setting up chart with initial ratio:", err);
            }
          }
          
          // If drawing mode is enabled, set up the drawing handlers
          if (drawingMode && drawingCanvasRef.current) {
      setupAngleDrawing();
    }
        }, 100);
    
        // Return cleanup function
    return () => {
          // Clean up the scale change subscription if it exists
          if (coordinatesRef.current.scaleChangeSubscription) {
            try {
              coordinatesRef.current.scaleChangeSubscription();
              coordinatesRef.current.scaleChangeSubscription = null;
            } catch (err) {
              console.warn("Error cleaning up subscription on unmount:", err);
            }
          }
          
          // Clear any debounce timers
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          
          // Cancel any pending animation frames
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          
      if (newChart) {
        newChart.remove();
      }
    };
      } catch (err) {
        console.error("Error in chart data processing:", err);
        setChartError(err.message);
        
        // We still need to clean up even if there's an error
        if (newChart) {
          try {
            newChart.remove();
          } catch (cleanupErr) {
            console.warn("Error cleaning up chart after initialization failure:", cleanupErr);
          }
        }
      }
    } catch (err) {
      console.error("Error in chart initialization:", err);
      setChartError("Failed to initialize chart: " + err.message);
    }
  }, [data, width, height, ratioLocked]);
  
  // Set up simple angle drawing functionality
  const setupAngleDrawing = () => {
    if (!drawingCanvasRef.current || !chart) {
      console.warn("Cannot setup angle drawing - missing canvas or chart");
      return;
    }
    
    console.log("Setting up angle drawing tools");
    
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear any previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remove any existing event listeners
    if (canvas._mouseDownHandler) {
      canvas.removeEventListener('mousedown', canvas._mouseDownHandler);
    }
    if (canvas._mouseMoveHandler) {
      canvas.removeEventListener('mousemove', canvas._mouseMoveHandler);
    }
    if (canvas._mouseUpHandler) {
      canvas.removeEventListener('mouseup', canvas._mouseUpHandler);
      canvas.removeEventListener('mouseleave', canvas._mouseUpHandler);
    }
    
    // Create new handlers
    function handleMouseDown(e) {
      if (!drawingMode) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      console.log("Angle drawing: mousedown at", x, y);
      
      try {
        // Convert to logical coordinates
        const timeScale = chart.timeScale();
        const priceScale = chart.priceScale('right');
        
        // Check if we have the methods we need
        if (!timeScale || !priceScale) {
          console.error("Missing timeScale or priceScale");
          return;
        }
        
        // Use appropriate conversion method
        let timeValue;
        let priceValue;
        
        // For timeScale, we need the logical index
        if (typeof timeScale.coordinateToLogical === 'function') {
          timeValue = timeScale.coordinateToLogical(x);
        } else if (typeof timeScale.coordinateToTime === 'function') {
          // If we don't have coordinateToLogical, try coordinateToTime
          // and convert the result to an index using our data
          const timePoint = timeScale.coordinateToTime(x);
          
          // Find the index from the time data
          if (candlestickSeries && timePoint) {
            const seriesData = candlestickSeries.data();
            if (seriesData && Array.isArray(seriesData)) {
              // Find the closest index (since we're using sequential indices)
              const visibleRange = timeScale.getVisibleLogicalRange();
              if (visibleRange) {
                // Get the visible range and find the closest index
                const fromIndex = Math.max(0, Math.floor(visibleRange.from));
                const toIndex = Math.min(seriesData.length - 1, Math.ceil(visibleRange.to));
                
                // Approximate index based on x position within visible range
                const rangeWidth = toIndex - fromIndex;
                const containerWidth = canvas.width;
                const relativePosition = x / containerWidth;
                timeValue = fromIndex + (rangeWidth * relativePosition);
              } else {
                // Fallback to just using the x coordinate as a relative position
                timeValue = x / canvas.width * seriesData.length;
              }
            }
          }
        } else {
          // Last resort fallback
          console.warn("No suitable method found to convert x coordinate to time value");
          timeValue = x;
        }
        
        // For priceScale, we need the price
        if (typeof priceScale.coordinateToPrice === 'function') {
          priceValue = priceScale.coordinateToPrice(y);
        } else {
          // Fallback: try to approximate the price from visible range
          const seriesData = candlestickSeries?.data();
          if (seriesData && seriesData.length > 0) {
            // Try to get visible price range
            const visibleLogicalRange = timeScale.getVisibleLogicalRange();
            if (visibleLogicalRange) {
              const fromIndex = Math.max(0, Math.floor(visibleLogicalRange.from));
              const toIndex = Math.min(seriesData.length - 1, Math.ceil(visibleLogicalRange.to));
              
              // Find min and max prices in visible range
              let min = Infinity;
              let max = -Infinity;
              
              for (let i = fromIndex; i <= toIndex; i++) {
                if (i >= 0 && i < seriesData.length) {
                  const candle = seriesData[i];
                  if (candle.low < min) min = candle.low;
                  if (candle.high > max) max = candle.high;
                }
              }
              
              if (min !== Infinity && max !== -Infinity) {
                // Inverse y coordinate (0 at top, height at bottom)
                const relativeY = 1 - (y / canvas.height);
                priceValue = min + (max - min) * relativeY;
              }
            }
          }
          
          if (priceValue === undefined) {
            console.warn("No suitable method found to convert y coordinate to price value");
            priceValue = chart.height() - y; // Invert y-coordinate for price
          }
        }
        
        if (timeValue === null || timeValue === undefined || priceValue === null || priceValue === undefined) {
          console.warn("Invalid coordinates. timeValue:", timeValue, "priceValue:", priceValue);
          return;
        }
        
        console.log("Converted coordinates:", { x, y, timeValue, priceValue });
        
        // Start drawing
        setDrawingState({
          isDrawing: true,
          startPoint: { 
            x, 
            y, 
            index: timeValue, 
            price: priceValue 
          },
          endPoint: null
        });
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw start point
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#5d9cf5';
        ctx.fill();
      } catch (err) {
        console.error("Error in handleMouseDown:", err);
      }
    }
    
    function handleMouseMove(e) {
      if (!drawingMode || !drawingState.isDrawing || !drawingState.startPoint) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      try {
        // Convert to logical coordinates
        const timeScale = chart.timeScale();
        const priceScale = chart.priceScale('right');
        
        // Check if we have the methods we need
        if (!timeScale || !priceScale) {
          console.error("Missing timeScale or priceScale in mousemove");
          return;
        }
        
        // Use appropriate conversion method
        let timeValue;
        let priceValue;
        
        // For timeScale, we need the logical index
        if (typeof timeScale.coordinateToLogical === 'function') {
          timeValue = timeScale.coordinateToLogical(x);
        } else if (typeof timeScale.coordinateToTime === 'function') {
          // If we don't have coordinateToLogical, try coordinateToTime
          // and convert the result to an index using our data
          const timePoint = timeScale.coordinateToTime(x);
          
          // Find the index from the time data
          if (candlestickSeries && timePoint) {
            const seriesData = candlestickSeries.data();
            if (seriesData && Array.isArray(seriesData)) {
              // Find the closest index (since we're using sequential indices)
              const visibleRange = timeScale.getVisibleLogicalRange();
              if (visibleRange) {
                // Get the visible range and find the closest index
                const fromIndex = Math.max(0, Math.floor(visibleRange.from));
                const toIndex = Math.min(seriesData.length - 1, Math.ceil(visibleRange.to));
                
                // Approximate index based on x position within visible range
                const rangeWidth = toIndex - fromIndex;
                const containerWidth = canvas.width;
                const relativePosition = x / containerWidth;
                timeValue = fromIndex + (rangeWidth * relativePosition);
              } else {
                // Fallback to just using the x coordinate as a relative position
                timeValue = x / canvas.width * seriesData.length;
              }
            }
          }
        } else {
          // Last resort fallback
          console.warn("No suitable method found to convert x coordinate to time value");
          timeValue = x;
        }
        
        // For priceScale, we need the price
        if (typeof priceScale.coordinateToPrice === 'function') {
          priceValue = priceScale.coordinateToPrice(y);
        } else {
          // Fallback: try to approximate the price from visible range
          const seriesData = candlestickSeries?.data();
          if (seriesData && seriesData.length > 0) {
            // Try to get visible price range
            const visibleLogicalRange = timeScale.getVisibleLogicalRange();
            if (visibleLogicalRange) {
              const fromIndex = Math.max(0, Math.floor(visibleLogicalRange.from));
              const toIndex = Math.min(seriesData.length - 1, Math.ceil(visibleLogicalRange.to));
              
              // Find min and max prices in visible range
              let min = Infinity;
              let max = -Infinity;
              
              for (let i = fromIndex; i <= toIndex; i++) {
                if (i >= 0 && i < seriesData.length) {
                  const candle = seriesData[i];
                  if (candle.low < min) min = candle.low;
                  if (candle.high > max) max = candle.high;
                }
              }
              
              if (min !== Infinity && max !== -Infinity) {
                // Inverse y coordinate (0 at top, height at bottom)
                const relativeY = 1 - (y / canvas.height);
                priceValue = min + (max - min) * relativeY;
              }
            }
          }
          
          if (priceValue === undefined) {
            console.warn("No suitable method found to convert y coordinate to price value");
            priceValue = chart.height() - y; // Invert y-coordinate for price
          }
        }
        
        if (timeValue === null || timeValue === undefined || priceValue === null || priceValue === undefined) {
          console.warn("Invalid coordinates during mousemove. timeValue:", timeValue, "priceValue:", priceValue);
          return;
        }
      
        // Update end point
        const newEndPoint = { 
          x, 
          y, 
          index: timeValue, 
          price: priceValue 
        };
        
        // Clear canvas and redraw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(drawingState.startPoint.x, drawingState.startPoint.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#5d9cf5';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw horizontal reference line
        ctx.beginPath();
        ctx.moveTo(drawingState.startPoint.x, drawingState.startPoint.y);
        ctx.lineTo(x, drawingState.startPoint.y);
        ctx.strokeStyle = 'rgba(93, 156, 245, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw angle arc
        const arcRadius = 30;
        
        // Calculate angle between line and horizontal
        const dx = x - drawingState.startPoint.x;
        const dy = drawingState.startPoint.y - y; // Invert dy because canvas Y increases downward
        
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * 180 / Math.PI).toFixed(2);
        
        // Draw angle arc
        ctx.beginPath();
        ctx.moveTo(drawingState.startPoint.x, drawingState.startPoint.y);
        ctx.arc(
          drawingState.startPoint.x, 
          drawingState.startPoint.y, 
          arcRadius, 
          0, 
          angleRad, 
          angleRad < 0
        );
        ctx.stroke();
        
        // Draw angle text
        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'white';
        
        // Draw text background
        const textX = drawingState.startPoint.x + arcRadius/2 * Math.cos(angleRad/2);
        const textY = drawingState.startPoint.y - arcRadius/2 * Math.sin(angleRad/2);
        ctx.fillStyle = 'rgba(19, 23, 34, 0.7)';
        const textWidth = ctx.measureText(`${angleDeg}°`).width + 6;
        ctx.fillRect(textX - textWidth/2, textY - 10, textWidth, 20);
        
        // Draw text
        ctx.fillStyle = '#26a69a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${angleDeg}°`, textX, textY);
        
        // Draw markers
        ctx.beginPath();
        ctx.arc(drawingState.startPoint.x, drawingState.startPoint.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#5d9cf5';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#5d9cf5';
        ctx.fill();
        
        // Update angle state
        setCurrentAngle(angleDeg);
        
        setDrawingState({
          ...drawingState,
          endPoint: newEndPoint
        });
      } catch (err) {
        console.error("Error in handleMouseMove:", err);
      }
    }
    
    function handleMouseUp(e) {
      if (!drawingMode || !drawingState.isDrawing || !drawingState.startPoint || !drawingState.endPoint) return;
      
      console.log("Angle drawing: mouseup");
      
      try {
        // Calculate final angle
        const dx = drawingState.endPoint.x - drawingState.startPoint.x;
        const dy = drawingState.startPoint.y - drawingState.endPoint.y;
        
        // Check for very small movements (could be unintentional clicks)
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
          console.log("Movement too small, ignoring angle drawing");
          // Reset drawing state
          setDrawingState({
            isDrawing: false,
            startPoint: null,
            endPoint: null
          });
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
        }
        
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * 180 / Math.PI).toFixed(2);
        
        console.log("Calculated angle:", angleDeg, "degrees");
        
        // Create permanent angle object
        const newAngle = {
          startPoint: {
            index: drawingState.startPoint.index,
            price: drawingState.startPoint.price
          },
          endPoint: {
            index: drawingState.endPoint.index,
            price: drawingState.endPoint.price
          },
          angle: angleDeg
        };
        
        // Add to saved angles
        setDrawnAngles(prev => [...prev, newAngle]);
        
        // Set current angle for display
        setCurrentAngle(angleDeg);
        
        // Draw permanent angle
        console.log("Drawing permanent angle");
        drawAngle(newAngle);
        
        // Reset drawing state
        setDrawingState({
          isDrawing: false,
          startPoint: null,
          endPoint: null
        });
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } catch (err) {
        console.error("Error in handleMouseUp:", err);
        
        // Reset drawing state on error
        setDrawingState({
          isDrawing: false,
          startPoint: null,
          endPoint: null
        });
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    // Store handlers on canvas for later cleanup
    canvas._mouseDownHandler = handleMouseDown;
    canvas._mouseMoveHandler = handleMouseMove;
    canvas._mouseUpHandler = handleMouseUp;
    
    // Attach event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // Add touch support
    function handleTouchStart(e) {
      e.preventDefault();
      if (!e.touches || e.touches.length === 0) return;
      
      const touch = e.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    }
    
    function handleTouchMove(e) {
      e.preventDefault();
      if (!e.touches || e.touches.length === 0) return;
      
      const touch = e.touches[0];
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    }
    
    function handleTouchEnd(e) {
      e.preventDefault();
      handleMouseUp();
    }
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    console.log("Angle drawing tools set up");
    
    // Return cleanup function
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  };
  
  // Set up drawing when drawing mode changes
  useEffect(() => {
    if (drawingMode && chart && drawingCanvasRef.current) {
      console.log("Drawing mode enabled, setting up angle drawing");
      
      // Make sure canvas dimensions match chart
      if (chartContainerRef.current) {
        const containerRect = chartContainerRef.current.getBoundingClientRect();
        drawingCanvasRef.current.width = containerRect.width;
        drawingCanvasRef.current.height = containerRect.height;
      }
      
      // Setup drawing
      setupAngleDrawing();
    }
  }, [drawingMode, chart]);
  
  // Toggle drawing mode
  const toggleDrawingMode = () => {
    const newDrawingMode = !drawingMode;
    console.log(`${newDrawingMode ? "Enabling" : "Disabling"} angle drawing mode`);
    
    // If enabling drawing mode, make sure canvas is ready
    if (newDrawingMode && drawingCanvasRef.current) {
      if (chartContainerRef.current) {
        const containerRect = chartContainerRef.current.getBoundingClientRect();
        drawingCanvasRef.current.width = containerRect.width;
        drawingCanvasRef.current.height = containerRect.height;
      }
      
      // Add initial visualization
      const ctx = drawingCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
      
      if (newDrawingMode) {
        ctx.fillStyle = 'rgba(93, 156, 245, 0.15)';
        ctx.fillRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Click and drag to measure an angle from horizontal', drawingCanvasRef.current.width / 2, 30);
        
        // Fade out the instruction after 2 seconds
        setTimeout(() => {
          if (drawingCanvasRef.current && drawingMode) {
            const ctx = drawingCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
          }
        }, 2000);
      }
    } else if (!newDrawingMode && drawingCanvasRef.current) {
      // If disabling, clear canvas
      const ctx = drawingCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    }
    
    setDrawingMode(newDrawingMode);
    
    // Reset drawing state
    setDrawingState({
      isDrawing: false,
      startPoint: null,
      endPoint: null
    });
  };

  // Clear all drawn angles
  const clearAllAngles = () => {
    setDrawnAngles([]);
    setCurrentAngle(null);
    
    if (drawingLayerRef.current) {
      while (drawingLayerRef.current.firstChild) {
        drawingLayerRef.current.removeChild(drawingLayerRef.current.firstChild);
      }
    }
    
    if (drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    }
  };
  
  // Handle price-to-bar ratio change
  const handleRatioChange = (e) => {
    try {
    const newRatio = parseFloat(e.target.value);
    if (isNaN(newRatio) || newRatio <= 0) return;
    
      console.log(`Changing price-to-bar ratio to: ${newRatio}`);
    setPriceToBarRatio(newRatio);
      originalRatioRef.current = newRatio;
      
      // If chart exists and ratio is locked, apply the new ratio immediately
      if (chart && ratioLocked) {
        // Use our enhanced function with forceApply=true
        safeApplyPriceToBarRatio(chart, newRatio, true);
      }
    } catch (err) {
      console.error("Error in handleRatioChange:", err);
    }
  };
  
  // Enhanced toggle for ratio locking with immediate application and better debugging
  const toggleRatioLock = () => {
    const newLockedState = !ratioLocked;
    console.log(`${newLockedState ? "Locking" : "Unlocking"} price-to-bar ratio`);
    
    // Update the state
    setRatioLocked(newLockedState);
    
    // Reset cache when toggling lock state
    scaleValuesCacheRef.current.lastTimeRange = null;
    scaleValuesCacheRef.current.lastPriceRange = null;
    
    // If we're locking, store current ratio and apply immediately
    if (newLockedState && chart) {
      originalRatioRef.current = priceToBarRatio;
      console.log("Applying price-to-bar ratio lock with ratio:", priceToBarRatio);
      // Force apply the ratio
      safeApplyPriceToBarRatio(chart, priceToBarRatio, true);
      
      // Show visual indicator
      const indicator = document.createElement('div');
      indicator.style.position = 'absolute';
      indicator.style.left = '50%';
      indicator.style.top = '50%';
      indicator.style.transform = 'translate(-50%, -50%)';
      indicator.style.backgroundColor = 'rgba(93, 156, 245, 0.8)';
      indicator.style.color = 'white';
      indicator.style.padding = '10px 20px';
      indicator.style.borderRadius = '5px';
      indicator.style.fontSize = '14px';
      indicator.style.zIndex = '1000';
      indicator.textContent = `🔒 Ratio Locked: ${priceToBarRatio.toFixed(5)}`;
      
      document.body.appendChild(indicator);
      
      // Remove after 1.5 seconds with fade out
      setTimeout(() => {
        indicator.style.transition = 'opacity 0.5s';
        indicator.style.opacity = '0';
        setTimeout(() => document.body.removeChild(indicator), 500);
      }, 1500);
    } else {
      console.log("Price-to-bar ratio unlocked - zoom axes independently");
      
      // Show unlock indicator
      if (chart) {
        const indicator = document.createElement('div');
        indicator.style.position = 'absolute';
        indicator.style.left = '50%';
        indicator.style.top = '50%';
        indicator.style.transform = 'translate(-50%, -50%)';
        indicator.style.backgroundColor = 'rgba(239, 83, 80, 0.8)';
        indicator.style.color = 'white';
        indicator.style.padding = '10px 20px';
        indicator.style.borderRadius = '5px';
        indicator.style.fontSize = '14px';
        indicator.style.zIndex = '1000';
        indicator.textContent = '🔓 Ratio Unlocked - Free Zoom Mode';
        
        document.body.appendChild(indicator);
        
        // Remove after 1.5 seconds with fade out
        setTimeout(() => {
          indicator.style.transition = 'opacity 0.5s';
          indicator.style.opacity = '0';
          setTimeout(() => document.body.removeChild(indicator), 500);
        }, 1500);
      }
    }
  };
  
  // Add a debug function to analyze chart state
  const debugChartState = () => {
    try {
      console.log("=== CHART DEBUG INFORMATION ===");
      
      // Check chart instance
      if (!chart) {
        console.error("Chart instance not available");
        return;
      }
      
      console.log("Chart instance:", chart);
      
      // Check candlestick series
      if (!candlestickSeries) {
        console.error("Candlestick series not available");
        return;
      }
      
      // Check data
      const seriesData = candlestickSeries.data();
      console.log(`Series data available: ${seriesData ? 'Yes' : 'No'}`);
      console.log(`Data length: ${seriesData ? seriesData.length : 0}`);
      
      if (seriesData && seriesData.length > 0) {
        console.log("First data point:", seriesData[0]);
        console.log("Last data point:", seriesData[seriesData.length - 1]);
        
        // Check if data is using sequential indices
        const hasSequentialIndices = seriesData.every((item, index) => item.time === index);
        console.log(`Using sequential indices: ${hasSequentialIndices ? 'Yes' : 'No'}`);
      }
      
      // Check scales
    const timeScale = chart.timeScale();
    const priceScale = chart.priceScale('right');
    
      console.log("Time scale available:", !!timeScale);
      console.log("Price scale available:", !!priceScale);
      
      if (timeScale) {
        const visibleRange = timeScale.getVisibleLogicalRange();
        console.log("Visible time range:", visibleRange);
        
        if (visibleRange) {
          // Calculate visible bars
          const barsRange = visibleRange.to - visibleRange.from;
          console.log("Visible bars range:", barsRange);
          
          // Calculate what the price range should be with current ratio
          const targetPriceRange = barsRange * priceToBarRatio;
          console.log("Target price range with current ratio:", targetPriceRange);
        }
      }
      
      if (priceScale) {
        try {
          const hasVisibleRange = typeof priceScale.getVisibleLogicalRange === 'function';
          console.log(`Price scale has getVisibleLogicalRange: ${hasVisibleRange ? 'Yes' : 'No'}`);
          
          if (hasVisibleRange) {
            const priceRange = priceScale.getVisibleLogicalRange();
            console.log("Current visible price range:", priceRange);
            
            if (priceRange && timeScale) {
              const visibleTimeRange = timeScale.getVisibleLogicalRange();
              if (visibleTimeRange) {
                const barsRange = visibleTimeRange.to - visibleTimeRange.from;
                const currentPriceRange = priceRange.to - priceRange.from;
                const actualRatio = currentPriceRange / barsRange;
                
                console.log("Price to Bar Ratio Analysis:");
                console.log(`- Target ratio (set): ${priceToBarRatio.toFixed(5)}`);
                console.log(`- Actual ratio (current): ${actualRatio.toFixed(5)}`);
                console.log(`- Difference: ${((actualRatio - priceToBarRatio) / priceToBarRatio * 100).toFixed(2)}%`);
                console.log(`- Ratio locked: ${ratioLocked ? 'Yes' : 'No'}`);
              }
            }
          }
        } catch (err) {
          console.error("Error checking price scale methods:", err);
        }
      }
      
      // Check DOM elements
      console.log("Chart container:", chartContainerRef.current);
      console.log("Drawing canvas:", drawingCanvasRef.current);
      console.log("Drawing layer:", drawingLayerRef.current);
      
      // Check drawing state
      console.log("Drawing mode:", drawingMode);
      console.log("Drawing state:", drawingState);
      console.log("Drawn angles:", drawnAngles.length);
      
      // Check ratio lock
      console.log("Price-to-bar ratio:", priceToBarRatio);
      console.log("Ratio locked:", ratioLocked);
      console.log("Original ratio (when locked):", originalRatioRef.current);
      console.log("Cached values:", scaleValuesCacheRef.current);
      
      console.log("=== END DEBUG INFORMATION ===");
      
      // Show indicator with ratio information
      if (chart) {
        const container = chartContainerRef.current.parentElement;
        
        // Create a temporary debug info overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.bottom = '10px';
        overlay.style.left = '10px';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.color = '#fff';
        overlay.style.padding = '10px';
        overlay.style.borderRadius = '4px';
        overlay.style.fontSize = '12px';
        overlay.style.fontFamily = 'monospace';
        overlay.style.zIndex = '1000';
        overlay.style.maxWidth = '400px';
        overlay.style.pointerEvents = 'none';
        
        try {
          // Get current data for overlay
          const visibleTimeRange = timeScale.getVisibleLogicalRange();
          const visiblePriceRange = priceScale.getVisibleLogicalRange();
          
          if (visibleTimeRange && visiblePriceRange) {
            const barsRange = visibleTimeRange.to - visibleTimeRange.from;
            const currentPriceRange = visiblePriceRange.to - visiblePriceRange.from;
            const actualRatio = currentPriceRange / barsRange;
            
            overlay.innerHTML = `
              <div style="margin-bottom:5px;font-weight:bold;color:#5d9cf5">Price-to-Bar Ratio Debug Info:</div>
              <div>Target Ratio: <span style="color:#26a69a">${priceToBarRatio.toFixed(5)}</span></div>
              <div>Actual Ratio: <span style="color:#ef5350">${actualRatio.toFixed(5)}</span></div>
              <div>Difference: ${((actualRatio - priceToBarRatio) / priceToBarRatio * 100).toFixed(2)}%</div>
              <div>Bars Range: ${barsRange.toFixed(2)}</div>
              <div>Price Range: ${currentPriceRange.toFixed(2)}</div>
              <div>Lock Status: <span style="${ratioLocked ? 'color:#26a69a' : 'color:#ef5350'}">${ratioLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}</span></div>
            `;
          } else {
            overlay.textContent = "Could not get complete range information";
          }
        } catch (err) {
          overlay.textContent = `Error getting range info: ${err.message}`;
        }
        
        container.appendChild(overlay);
        
        // Remove after 5 seconds
        setTimeout(() => {
          if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 5000);
      }
    } catch (err) {
      console.error("Error in debugChartState:", err);
    }
  };
  
  return (
    <ChartContainer>
      <ToolbarContainer>
        {title && <ChartTitle>{title}</ChartTitle>}
        
        <Label>Price/Bar Ratio:</Label>
        <ScaleInput
          type="number"
          step="0.0001"
          min="0.0001"
          value={priceToBarRatio}
          onChange={handleRatioChange}
          disabled={ratioLocked}
        />
        
        <Button 
          active={ratioLocked} 
          onClick={toggleRatioLock}
          title={ratioLocked ? "Unlock price-to-bar ratio" : "Lock price-to-bar ratio"}
        >
          {ratioLocked ? '🔒' : '🔓'} Lock Ratio
        </Button>
        
        <Button 
          active={drawingMode} 
          onClick={toggleDrawingMode}
          title="Draw and measure angles"
        >
          📐 Measure Angle
        </Button>
        
        <Button onClick={clearAllAngles}>
          🗑️ Clear Angles
        </Button>
        
        <Button 
          onClick={debugChartState}
          title="Print chart debug info to console"
          style={{ marginLeft: 'auto' }}
        >
          🔍 Debug
        </Button>
        
        <InfoPanel>
          {currentAngle !== null && (
            <>
              <Label>Angle:</Label>
              <span>{currentAngle}°</span>
            </>
          )}
        </InfoPanel>
      </ToolbarContainer>
      
      <div style={{ position: 'relative', width: width, height: height - 40 }}>
        {chartError ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#131722',
            color: '#ef5350',
            fontSize: '16px',
            padding: '20px',
            textAlign: 'center',
            borderRadius: '4px'
          }}>
            <div>
              <div style={{ marginBottom: '10px', fontSize: '24px' }}>⚠️</div>
              <div>{chartError}</div>
            </div>
          </div>
        ) : (
          <>
            <div ref={chartContainerRef} style={{ width: width, height: height - 40 }} />
            <DrawingLayerSVG ref={drawingLayerRef} width={width} height={height - 40} />
            <DrawingCanvas 
              ref={drawingCanvasRef} 
              width={width} 
              height={height - 40} 
              active={drawingMode} 
              data-testid="drawing-canvas"
            />
            <AngleDisplay visible={currentAngle !== null}>
              <strong>Angle from horizontal:</strong> {currentAngle}°
            </AngleDisplay>
          </>
        )}
      </div>
    </ChartContainer>
  );
};

export default TradingViewLightweightChart; 