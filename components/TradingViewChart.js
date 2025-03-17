import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import styled from 'styled-components';
import { CandlestickSeries } from 'lightweight-charts';

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

/**
 * TradingViewChart Component
 * 
 * A TradingView-like chart with price-to-bar ratio locking and manual drawing capabilities.
 * 
 * @param {Object} props 
 * @param {Array} props.data - Candlestick data in format [{date, open, high, low, close, volume}, ...]
 * @param {number} props.width - Width of the chart
 * @param {number} props.height - Height of the chart
 * @param {string} props.title - Chart title
 */
const TradingViewChart = ({ data = [], width = 800, height = 500, title = '' }) => {
  // Main chart state
  const svgRef = useRef(null);
  const chartRef = useRef(null);
  const drawingLayerRef = useRef(null);
  const dataRef = useRef([]);
  
  // UI state
  const [priceToBarRatio, setPriceToBarRatio] = useState(0.00369);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnLines, setDrawnLines] = useState([]);
  const [currentAngle, setCurrentAngle] = useState(null);
  const [snapToWick, setSnapToWick] = useState(true);
  
  // Scale references to maintain across renders
  const scalesRef = useRef({
    x: null,
    y: null,
    currentPriceRange: null,
    currentTimeRange: null,
  });
  
  // Drawing tool state
  const [drawingState, setDrawingState] = useState({
    isDrawing: false,
    startPoint: null,
    endPoint: null,
  });
  
  // Sample data if none provided
  useEffect(() => {
    if (data.length === 0) {
      // Generate sample data for testing
      const sampleData = generateSampleData(100);
      dataRef.current = sampleData;
    } else {
      dataRef.current = data.map(d => ({
        ...d,
        date: new Date(d.date) // Ensure dates are Date objects
      })).sort((a, b) => a.date - b.date);
    }
    
    // Initialize or update chart whenever data changes
    initializeChart();
  }, [data, width, height]);
  
  // Format time ticks based on interval
  const formatTimeAxis = (xAxis, timeScale, interval) => {
    let tickFormat;
    
    // Determine appropriate time format based on interval
    if (interval && interval.includes('m') || interval === '1h') {
      // For minute/hour intervals, show hours and minutes
      tickFormat = d3.timeFormat('%H:%M');
    } else if (interval === '1d' || interval === '5d') {
      // For day intervals, show month and day
      tickFormat = d3.timeFormat('%b %d');
    } else if (interval === '1wk' || interval === '1mo') {
      // For week/month intervals, show month and year
      tickFormat = d3.timeFormat('%b %Y');
    } else {
      // Default format
      tickFormat = d3.timeFormat('%b %d, %Y');
    }
    
    // Apply the custom format
    xAxis.call(d3.axisBottom(timeScale).tickFormat(tickFormat));
  };
  
  // Initialize chart
  const initializeChart = () => {
    if (dataRef.current.length === 0 || !svgRef.current) return;
    
    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Clear any existing SVG
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Setup SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background-color", "#131722");
    
    // Main chart group
    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .attr("class", "main-chart");
    
    chartRef.current = chart;
    
    // Drawing layer (separate layer for user-drawn objects)
    const drawingLayer = chart.append("g")
      .attr("class", "drawing-layer");
      
    drawingLayerRef.current = drawingLayer;
    
    const parsedData = dataRef.current;
    
    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date))
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([
        d3.min(parsedData, d => d.low) * 0.99,
        d3.max(parsedData, d => d.high) * 1.01
      ])
      .range([innerHeight, 0]);
    
    // Store scales in ref for later use
    scalesRef.current = {
      x: xScale,
      y: yScale,
      currentPriceRange: yScale.domain(),
      currentTimeRange: xScale.domain(),
    };
    
    // Calculate initial price-to-bar ratio
    adjustScalesForRatio(priceToBarRatio, innerWidth, innerHeight);
    
    // Draw chart axes
    const xAxis = chart.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .attr("class", "x-axis");
    
    // Format time axis based on data interval
    // Determine interval by checking time difference between consecutive points
    let interval = '';
    if (parsedData.length > 1) {
      const timeDiff = parsedData[1].date - parsedData[0].date;
      if (timeDiff < 60 * 60 * 1000) { // Less than an hour
        interval = timeDiff < 5 * 60 * 1000 ? '1m' : '5m';
      } else if (timeDiff < 24 * 60 * 60 * 1000) { // Less than a day
        interval = '1h';
      } else if (timeDiff < 7 * 24 * 60 * 60 * 1000) { // Less than a week
        interval = '1d';
      } else if (timeDiff < 30 * 24 * 60 * 60 * 1000) { // Less than a month
        interval = '1wk';
      } else {
        interval = '1mo';
      }
    }
    
    formatTimeAxis(xAxis, xScale, interval);
    
    const yAxis = chart.append("g")
      .attr("class", "y-axis")
      .call(d3.axisRight(yScale)
        .tickFormat(d => d.toFixed(2))
        .tickSize(-innerWidth));
    
    // Style the axes
    svg.selectAll(".domain")
      .attr("stroke", "#363c4e");
    
    svg.selectAll(".tick line")
      .attr("stroke", "#363c4e")
      .attr("stroke-dasharray", "2,2");
    
    svg.selectAll(".tick text")
      .attr("fill", "#787b86");
    
    // Create candlesticks
    const candlestickSeries = chart.addSeries(CandlestickSeries, { 
      upColor: '#26a69a', 
      downColor: '#ef5350', 
      borderVisible: false, 
      wickUpColor: '#26a69a', 
      wickDownColor: '#ef5350' 
    });
    
    candlestickSeries.setData(parsedData);
    
    // Add overlay for high/low points to make them easier to snap to
    chart.selectAll(".snap-point-high")
      .data(parsedData)
      .enter()
      .append("circle")
      .attr("class", "snap-point snap-point-high")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.high))
      .attr("r", 4)
      .attr("fill", "transparent")
      .attr("stroke", "transparent")
      .attr("data-date", d => d.date.toISOString())
      .attr("data-price", d => d.high)
      .attr("data-type", "high");
    
    chart.selectAll(".snap-point-low")
      .data(parsedData)
      .enter()
      .append("circle")
      .attr("class", "snap-point snap-point-low")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.low))
      .attr("r", 4)
      .attr("fill", "transparent")
      .attr("stroke", "transparent")
      .attr("data-date", d => d.date.toISOString())
      .attr("data-price", d => d.low)
      .attr("data-type", "low");
    
    // Set up zoom behavior with locked price-to-bar ratio
    const zoom = d3.zoom()
      .scaleExtent([0.5, 20]) // Min/max zoom level
      .translateExtent([[0, 0], [innerWidth, innerHeight]])
      .on("zoom", zoomed);
    
    svg.call(zoom);
    
    function zoomed(event) {
      // Extract transform info
      const transform = event.transform;
      
      // Get new scales based on transform
      const newXScale = transform.rescaleX(xScale);
      const newYScale = transform.rescaleY(yScale);
      
      // Get new domains
      const newXDomain = newXScale.domain();
      const newYDomain = newYScale.domain();
      
      // Store new ranges
      scalesRef.current.currentTimeRange = newXDomain;
      
      // When price-to-bar ratio is locked, we need to adjust the y domain
      // based on the new x domain and the ratio
      
      // Calculate time range in milliseconds
      const timeRangeMs = newXDomain[1].getTime() - newXDomain[0].getTime();
      
      // Calculate time range in bars (using a day as a "bar" for simplicity)
      const timeRangeBars = timeRangeMs / (24 * 60 * 60 * 1000);
      
      // Calculate what the price range should be based on the ratio
      const targetPriceRange = timeRangeBars * priceToBarRatio;
      
      // Calculate midpoint of current price range
      const priceMidpoint = (newYDomain[0] + newYDomain[1]) / 2;
      
      // Calculate new price range
      const lockedYDomain = [
        priceMidpoint - (targetPriceRange / 2),
        priceMidpoint + (targetPriceRange / 2)
      ];
      
      // Update the scale with the locked ratio domain
      newYScale.domain(lockedYDomain);
      
      // Store the new price range
      scalesRef.current.currentPriceRange = lockedYDomain;
      
      // Update the axis
      formatTimeAxis(xAxis, newXScale, interval);
      yAxis.call(d3.axisRight(newYScale).tickFormat(d => d.toFixed(2)).tickSize(-innerWidth));
      
      // Update candlesticks
      candlestickSeries.setData(parsedData);
      
      // Update snap points
      chart.selectAll(".snap-point-high")
        .attr("cx", d => newXScale(d.date))
        .attr("cy", d => newYScale(d.high));
      
      chart.selectAll(".snap-point-low")
        .attr("cx", d => newXScale(d.date))
        .attr("cy", d => newYScale(d.low));
      
      // Update the scales in the ref for other functions
      scalesRef.current.x = newXScale;
      scalesRef.current.y = newYScale;
      
      // Redraw any lines that have been drawn
      updateDrawnLines();
    }
  };
  
  // Find the nearest wick point for snapping
  const findNearestWickPoint = (mouseX, mouseY, margin) => {
    if (!chartRef.current || !snapToWick) return null;
    
    const adjustedX = mouseX - margin.left;
    const adjustedY = mouseY - margin.top;
    
    // Snap distance threshold in pixels
    const snapThreshold = 15;
    
    let closestPoint = null;
    let minDistance = Infinity;
    
    // Check high points
    chartRef.current.selectAll(".snap-point-high").each(function() {
      const point = d3.select(this);
      const cx = +point.attr("cx");
      const cy = +point.attr("cy");
      
      const distance = Math.sqrt(Math.pow(cx - adjustedX, 2) + Math.pow(cy - adjustedY, 2));
      
      if (distance < snapThreshold && distance < minDistance) {
        minDistance = distance;
        closestPoint = {
          date: new Date(point.attr("data-date")),
          price: +point.attr("data-price"),
          type: point.attr("data-type")
        };
      }
    });
    
    // Check low points
    chartRef.current.selectAll(".snap-point-low").each(function() {
      const point = d3.select(this);
      const cx = +point.attr("cx");
      const cy = +point.attr("cy");
      
      const distance = Math.sqrt(Math.pow(cx - adjustedX, 2) + Math.pow(cy - adjustedY, 2));
      
      if (distance < snapThreshold && distance < minDistance) {
        minDistance = distance;
        closestPoint = {
          date: new Date(point.attr("data-date")),
          price: +point.attr("data-price"),
          type: point.attr("data-type")
        };
      }
    });
    
    return closestPoint;
  };
  
  // Update drawn lines when the scales change
  const updateDrawnLines = () => {
    if (!drawingLayerRef.current) return;
    
    drawingLayerRef.current.selectAll(".drawn-line-group").remove();
    
    drawnLines.forEach((line, index) => {
      const { startPoint, endPoint } = line;
      
      const lineGroup = drawingLayerRef.current.append("g")
        .attr("class", "drawn-line-group")
        .attr("data-index", index);
      
      // Draw the line
      lineGroup.append("line")
        .attr("class", "drawn-line")
        .attr("x1", scalesRef.current.x(startPoint.date))
        .attr("y1", scalesRef.current.y(startPoint.price))
        .attr("x2", scalesRef.current.x(endPoint.date))
        .attr("y2", scalesRef.current.y(endPoint.price))
        .attr("stroke", "#5d9cf5")
        .attr("stroke-width", 1.5)
        .on("mouseover", function() {
          d3.select(this).attr("stroke-width", 2.5);
          
          // Show labels on hover
          lineGroup.selectAll(".point-label")
            .style("display", "block");
          
          // Highlight angle
          lineGroup.select(".angle-label")
            .attr("font-weight", "bold")
            .attr("font-size", "12px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("stroke-width", 1.5);
          
          // Hide labels on mouseout
          lineGroup.selectAll(".point-label")
            .style("display", "none");
          
          // Reset angle style
          lineGroup.select(".angle-label")
            .attr("font-weight", "normal")
            .attr("font-size", "10px");
        });
      
      // Add start point marker
      lineGroup.append("circle")
        .attr("class", "point-marker")
        .attr("cx", scalesRef.current.x(startPoint.date))
        .attr("cy", scalesRef.current.y(startPoint.price))
        .attr("r", 3)
        .attr("fill", "#5d9cf5");
      
      // Add end point marker  
      lineGroup.append("circle")
        .attr("class", "point-marker")
        .attr("cx", scalesRef.current.x(endPoint.date))
        .attr("cy", scalesRef.current.y(endPoint.price))
        .attr("r", 3)
        .attr("fill", "#5d9cf5");
      
      // Add start point label
      lineGroup.append("text")
        .attr("class", "point-label")
        .attr("x", scalesRef.current.x(startPoint.date) + 5)
        .attr("y", scalesRef.current.y(startPoint.price) - 5)
        .attr("fill", "#d1d4dc")
        .attr("font-size", "10px")
        .style("display", "none")
        .text(`${startPoint.date.toLocaleDateString()} (${startPoint.price.toFixed(2)})`);
      
      // Add end point label
      lineGroup.append("text")
        .attr("class", "point-label")
        .attr("x", scalesRef.current.x(endPoint.date) + 5)
        .attr("y", scalesRef.current.y(endPoint.price) - 5)
        .attr("fill", "#d1d4dc")
        .attr("font-size", "10px")
        .style("display", "none")
        .text(`${endPoint.date.toLocaleDateString()} (${endPoint.price.toFixed(2)})`);
      
      // Add angle label in the middle of the line
      const midX = (scalesRef.current.x(startPoint.date) + scalesRef.current.x(endPoint.date)) / 2;
      const midY = (scalesRef.current.y(startPoint.price) + scalesRef.current.y(endPoint.price)) / 2;
      
      // Calculate background padding
      const padding = 2;
      const angleTextWidth = line.angle.toString().length * 6 + 20; // Rough estimate of text width
      
      // Add a background for the angle label for better visibility
      lineGroup.append("rect")
        .attr("class", "angle-label-bg")
        .attr("x", midX - angleTextWidth / 2)
        .attr("y", midY - 20)
        .attr("width", angleTextWidth)
        .attr("height", 16)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", "#131722")
        .attr("fill-opacity", 0.7);
      
      lineGroup.append("text")
        .attr("class", "angle-label")
        .attr("x", midX)
        .attr("y", midY - 10)
        .attr("fill", "#5d9cf5")
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .attr("pointer-events", "none")
        .text(`${line.angle}°`);
    });
  };
  
  // Calculate line angle in degrees
  const calculateAngle = (startPoint, endPoint) => {
    // Calculate in data space (not pixel space)
    // We need to convert dates to numbers for calculation
    const x1 = startPoint.date.getTime();
    const y1 = startPoint.price;
    const x2 = endPoint.date.getTime();
    const y2 = endPoint.price;
    
    // Handle the case where points are the same
    if (x1 === x2 && y1 === y2) return "0.00";
    
    // Calculate the angle in radians
    const angleRad = Math.atan2(y2 - y1, x2 - x1);
    
    // Convert to degrees
    let angleDeg = angleRad * (180 / Math.PI);
    
    // Ensure angle is between 0 and 360
    if (angleDeg < 0) {
      angleDeg += 360;
    }
    
    return angleDeg.toFixed(2);
  };
  
  // Adjust scales to maintain price-to-bar ratio
  const adjustScalesForRatio = (ratio, chartWidth, chartHeight) => {
    if (!scalesRef.current.x || !scalesRef.current.y) return;
    
    // Get current domains
    const xDomain = scalesRef.current.currentTimeRange || scalesRef.current.x.domain();
    const yDomain = scalesRef.current.currentPriceRange || scalesRef.current.y.domain();
    
    // Calculate current price range
    const priceRange = yDomain[1] - yDomain[0];
    
    // Calculate time range in milliseconds
    const timeRangeMs = xDomain[1].getTime() - xDomain[0].getTime();
    
    // Calculate time range in bars (using a day as a "bar" for simplicity)
    const timeRangeBars = timeRangeMs / (24 * 60 * 60 * 1000);
    
    // Calculate what the price range should be based on the ratio
    const targetPriceRange = timeRangeBars * ratio;
    
    // Calculate scaling factor
    const scaleFactor = targetPriceRange / priceRange;
    
    // Calculate midpoint of current price range
    const priceMidpoint = (yDomain[0] + yDomain[1]) / 2;
    
    // Calculate new price range
    const newPriceRange = [
      priceMidpoint - (targetPriceRange / 2),
      priceMidpoint + (targetPriceRange / 2)
    ];
    
    // Update the scale
    scalesRef.current.y.domain(newPriceRange);
    scalesRef.current.currentPriceRange = newPriceRange;
    
    // Update the UI
    if (chartRef.current) {
      chartRef.current.select(".y-axis")
        .call(d3.axisRight(scalesRef.current.y)
          .tickFormat(d => d.toFixed(2))
          .tickSize(-chartWidth));
      
      // Update styling
      d3.select(svgRef.current).selectAll(".tick line")
        .attr("stroke", "#363c4e")
        .attr("stroke-dasharray", "2,2");
      
      d3.select(svgRef.current).selectAll(".tick text")
        .attr("fill", "#787b86");
      
      // Update candlesticks
      updateCandlesticks();
      
      // Update snap points
      updateSnapPoints();
      
      // Update drawn lines
      updateDrawnLines();
    }
  };
  
  // Update snap points positions
  const updateSnapPoints = () => {
    if (!chartRef.current) return;
    
    chartRef.current.selectAll(".snap-point-high")
      .attr("cx", d => scalesRef.current.x(d.date))
      .attr("cy", d => scalesRef.current.y(d.high));
    
    chartRef.current.selectAll(".snap-point-low")
      .attr("cx", d => scalesRef.current.x(d.date))
      .attr("cy", d => scalesRef.current.y(d.low));
  };
  
  // Update candlesticks with new scales
  const updateCandlesticks = () => {
    if (!chartRef.current) return;
    
    chartRef.current.selectAll(".candlestick").each(function(d) {
      const g = d3.select(this);
      const isUp = d.close >= d.open;
      const candleWidth = Math.max(1, (width - 100) / dataRef.current.length - 1);
      
      g.select("line")
        .attr("x1", scalesRef.current.x(d.date))
        .attr("x2", scalesRef.current.x(d.date))
        .attr("y1", scalesRef.current.y(d.high))
        .attr("y2", scalesRef.current.y(d.low));
      
      g.select("rect")
        .attr("x", scalesRef.current.x(d.date) - candleWidth / 2)
        .attr("y", scalesRef.current.y(Math.max(d.open, d.close)))
        .attr("height", Math.max(1, Math.abs(scalesRef.current.y(d.open) - scalesRef.current.y(d.close))));
    });
  };
  
  // Handle ratio input change
  const handleRatioChange = (e) => {
    const newRatio = parseFloat(e.target.value);
    if (isNaN(newRatio) || newRatio <= 0) return;
    
    setPriceToBarRatio(newRatio);
    adjustScalesForRatio(newRatio, width - 100, height - 50);
  };
  
  // Toggle drawing mode
  const toggleDrawingMode = () => {
    setDrawingMode(!drawingMode);
    setDrawingState({
      isDrawing: false,
      startPoint: null,
      endPoint: null
    });
  };
  
  // Toggle snap to wick feature
  const toggleSnapToWick = () => {
    setSnapToWick(!snapToWick);
  };
  
  // Setup mouse event handlers for drawing
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    
    const handleMouseDown = (event) => {
      if (!drawingMode) return;
      
      // Get mouse position in SVG coordinates
      const [mouseX, mouseY] = d3.pointer(event);
      
      // Try to snap to wick points if enabled
      const snapPoint = findNearestWickPoint(mouseX, mouseY, margin);
      
      if (snapPoint) {
        // Use the snap point
        setDrawingState({
          isDrawing: true,
          startPoint: { date: snapPoint.date, price: snapPoint.price },
          endPoint: { date: snapPoint.date, price: snapPoint.price }
        });
        
        // Add visual indication of snapping
        if (drawingLayerRef.current) {
          drawingLayerRef.current.append("circle")
            .attr("class", "snap-indicator")
            .attr("cx", scalesRef.current.x(snapPoint.date))
            .attr("cy", scalesRef.current.y(snapPoint.price))
            .attr("r", 5)
            .attr("fill", "none")
            .attr("stroke", "#5d9cf5")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "2,2");
        }
      } else {
        // Convert to data coordinates (no snapping)
        const date = scalesRef.current.x.invert(mouseX - margin.left);
        const price = scalesRef.current.y.invert(mouseY - margin.top);
        
        setDrawingState({
          isDrawing: true,
          startPoint: { date, price },
          endPoint: { date, price }
        });
      }
    };
    
    const handleMouseMove = (event) => {
      if (!drawingMode || !drawingState.isDrawing) return;
      
      // Get mouse position
      const [mouseX, mouseY] = d3.pointer(event);
      
      // Try to snap to wick points if enabled
      const snapPoint = findNearestWickPoint(mouseX, mouseY, margin);
      
      // Remove previous snap indicator if any
      if (drawingLayerRef.current) {
        drawingLayerRef.current.selectAll(".snap-indicator").remove();
      }
      
      if (snapPoint) {
        // Use the snap point
        setDrawingState(prev => ({
          ...prev,
          endPoint: { date: snapPoint.date, price: snapPoint.price }
        }));
        
        // Add visual indication of snapping
        if (drawingLayerRef.current) {
          drawingLayerRef.current.append("circle")
            .attr("class", "snap-indicator")
            .attr("cx", scalesRef.current.x(snapPoint.date))
            .attr("cy", scalesRef.current.y(snapPoint.price))
            .attr("r", 5)
            .attr("fill", "none")
            .attr("stroke", "#5d9cf5")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "2,2");
        }
      } else {
        // Convert to data coordinates (no snapping)
        const date = scalesRef.current.x.invert(mouseX - margin.left);
        const price = scalesRef.current.y.invert(mouseY - margin.top);
        
        setDrawingState(prev => ({
          ...prev,
          endPoint: { date, price }
        }));
      }
      
      // Update temp line
      if (drawingLayerRef.current) {
        drawingLayerRef.current.selectAll(".temp-line-group").remove();
        
        const tempLineGroup = drawingLayerRef.current.append("g")
          .attr("class", "temp-line-group");
        
        const startPoint = drawingState.startPoint;
        const endPoint = snapPoint || { date: scalesRef.current.x.invert(mouseX - margin.left), price: scalesRef.current.y.invert(mouseY - margin.top) };
        
        // Draw temporary line
        tempLineGroup.append("line")
          .attr("class", "temp-line")
          .attr("x1", scalesRef.current.x(startPoint.date))
          .attr("y1", scalesRef.current.y(startPoint.price))
          .attr("x2", scalesRef.current.x(endPoint.date))
          .attr("y2", scalesRef.current.y(endPoint.price))
          .attr("stroke", "#5d9cf5")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "4,4");
        
        // Calculate and display angle
        if (startPoint && endPoint) {
          const angle = calculateAngle(startPoint, endPoint);
          setCurrentAngle(angle);
          
          // Add a background for the angle label for better visibility
          const midX = (scalesRef.current.x(startPoint.date) + scalesRef.current.x(endPoint.date)) / 2;
          const midY = (scalesRef.current.y(startPoint.price) + scalesRef.current.y(endPoint.price)) / 2;
          const angleTextWidth = angle.toString().length * 6 + 20; // Rough estimate of text width
          
          tempLineGroup.append("rect")
            .attr("class", "temp-angle-label-bg")
            .attr("x", midX - angleTextWidth / 2)
            .attr("y", midY - 20)
            .attr("width", angleTextWidth)
            .attr("height", 16)
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("fill", "#131722")
            .attr("fill-opacity", 0.7);
          
          tempLineGroup.append("text")
            .attr("class", "temp-angle-label")
            .attr("x", midX)
            .attr("y", midY - 10)
            .attr("fill", "#5d9cf5")
            .attr("font-size", "10px")
            .attr("text-anchor", "middle")
            .attr("pointer-events", "none")
            .text(`${angle}°`);
        }
      }
    };
    
    const handleMouseUp = () => {
      if (!drawingMode || !drawingState.isDrawing) return;
      
      // Remove temporary line and snap indicators
      if (drawingLayerRef.current) {
        drawingLayerRef.current.selectAll(".temp-line-group").remove();
        drawingLayerRef.current.selectAll(".snap-indicator").remove();
      }
      
      // Only add if we have valid start and end points and they're not the same point
      if (drawingState.startPoint && drawingState.endPoint &&
          (drawingState.startPoint.date.getTime() !== drawingState.endPoint.date.getTime() ||
           drawingState.startPoint.price !== drawingState.endPoint.price)) {
        
        // Add the permanent line
        const angle = calculateAngle(drawingState.startPoint, drawingState.endPoint);
        const newLine = {
          startPoint: drawingState.startPoint,
          endPoint: drawingState.endPoint,
          angle
        };
        
        setDrawnLines(prev => [...prev, newLine]);
        
        // Set current angle for display
        setCurrentAngle(angle);
        
        // Create a new line group
        const lineGroup = drawingLayerRef.current.append("g")
          .attr("class", "drawn-line-group")
          .attr("data-index", drawnLines.length); // Index will be the current length
        
        // Draw the permanent line
        lineGroup.append("line")
          .attr("class", "drawn-line")
          .attr("x1", scalesRef.current.x(drawingState.startPoint.date))
          .attr("y1", scalesRef.current.y(drawingState.startPoint.price))
          .attr("x2", scalesRef.current.x(drawingState.endPoint.date))
          .attr("y2", scalesRef.current.y(drawingState.endPoint.price))
          .attr("stroke", "#5d9cf5")
          .attr("stroke-width", 1.5)
          .on("mouseover", function() {
            d3.select(this).attr("stroke-width", 2.5);
            
            // Show labels on hover
            lineGroup.selectAll(".point-label")
              .style("display", "block");
          })
          .on("mouseout", function() {
            d3.select(this).attr("stroke-width", 1.5);
            
            // Hide labels on mouseout
            lineGroup.selectAll(".point-label")
              .style("display", "none");
          });
        
        // Add start point marker
        lineGroup.append("circle")
          .attr("class", "point-marker")
          .attr("cx", scalesRef.current.x(drawingState.startPoint.date))
          .attr("cy", scalesRef.current.y(drawingState.startPoint.price))
          .attr("r", 3)
          .attr("fill", "#5d9cf5");
        
        // Add end point marker  
        lineGroup.append("circle")
          .attr("class", "point-marker")
          .attr("cx", scalesRef.current.x(drawingState.endPoint.date))
          .attr("cy", scalesRef.current.y(drawingState.endPoint.price))
          .attr("r", 3)
          .attr("fill", "#5d9cf5");
        
        // Add start point label
        lineGroup.append("text")
          .attr("class", "point-label")
          .attr("x", scalesRef.current.x(drawingState.startPoint.date) + 5)
          .attr("y", scalesRef.current.y(drawingState.startPoint.price) - 5)
          .attr("fill", "#d1d4dc")
          .attr("font-size", "10px")
          .style("display", "none")
          .text(`${drawingState.startPoint.date.toLocaleDateString()} (${drawingState.startPoint.price.toFixed(2)})`);
        
        // Add end point label
        lineGroup.append("text")
          .attr("class", "point-label")
          .attr("x", scalesRef.current.x(drawingState.endPoint.date) + 5)
          .attr("y", scalesRef.current.y(drawingState.endPoint.price) - 5)
          .attr("fill", "#d1d4dc")
          .attr("font-size", "10px")
          .style("display", "none")
          .text(`${drawingState.endPoint.date.toLocaleDateString()} (${drawingState.endPoint.price.toFixed(2)})`);
        
        // Add angle label in the middle of the line
        const midX = (scalesRef.current.x(drawingState.startPoint.date) + scalesRef.current.x(drawingState.endPoint.date)) / 2;
        const midY = (scalesRef.current.y(drawingState.startPoint.price) + scalesRef.current.y(drawingState.endPoint.price)) / 2;
        
        lineGroup.append("text")
          .attr("class", "angle-label")
          .attr("x", midX)
          .attr("y", midY - 10)
          .attr("fill", "#5d9cf5")
          .attr("font-size", "10px")
          .attr("text-anchor", "middle")
          .attr("pointer-events", "none")
          .text(`${angle}°`);
      }
      
      // Reset drawing state
      setDrawingState({
        isDrawing: false,
        startPoint: null,
        endPoint: null
      });
    };
    
    // Add event listeners
    svg.on("mousedown", handleMouseDown);
    svg.on("mousemove", handleMouseMove);
    svg.on("mouseup", handleMouseUp);
    svg.on("mouseleave", handleMouseUp);
    
    // Cleanup
    return () => {
      svg.on("mousedown", null);
      svg.on("mousemove", null);
      svg.on("mouseup", null);
      svg.on("mouseleave", null);
    };
  }, [drawingMode, drawingState]);
  
  // Helper function to generate sample data
  const generateSampleData = (length) => {
    const baseDate = new Date("2023-01-01");
    const basePrice = 100;
    let currentPrice = basePrice;
    
    return Array.from({ length }, (_, i) => {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      
      // Random walk
      const change = (Math.random() - 0.5) * 3;
      currentPrice += change;
      
      const open = currentPrice;
      const close = open + (Math.random() - 0.5) * 2;
      const high = Math.max(open, close) + Math.random() * 1;
      const low = Math.min(open, close) - Math.random() * 1;
      const volume = Math.floor(Math.random() * 1000);
      
      return {
        date,
        open,
        high,
        low,
        close,
        volume
      };
    });
  };
  
  return (
    <ChartContainer>
      <ToolbarContainer>
        <Label>Price/Bar Ratio:</Label>
        <ScaleInput
          type="number"
          step="0.00001"
          min="0.00001"
          value={priceToBarRatio}
          onChange={handleRatioChange}
        />
        <Button 
          active={drawingMode} 
          onClick={toggleDrawingMode}
        >
          ✏️ Draw
        </Button>
        <Button 
          onClick={() => {
            setDrawnLines([]);
            setCurrentAngle(null);
            if (drawingLayerRef.current) {
              drawingLayerRef.current.selectAll(".drawn-line-group").remove();
              drawingLayerRef.current.selectAll(".temp-line-group").remove();
            }
          }}
        >
          🗑️ Clear Lines
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
      <svg ref={svgRef} width={width} height={height} />
    </ChartContainer>
  );
};

export default TradingViewChart; 