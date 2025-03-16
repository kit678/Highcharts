// HighstockTradingViewChart.js
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';

// Dynamic imports for Highcharts modules on client side only
const initHighcharts = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Import Highcharts with proper ES module handling
    const Highcharts = await import('highcharts/highstock');
    const highchartsInstance = Highcharts.default || Highcharts;

    // Basic stock module implementation if modules fail to load
    const registerBasicStockTools = (H) => {
      H.StockTools = H.StockTools || {};
      
      // Basic drawing tool bindings
      H.Annotation = H.Annotation || {};
      H.Annotation.Types = H.Annotation.Types || {};
      
      // Add minimal drawing tools
      if (!H.navigationBindings) {
        H.navigationBindings = {
          bindings: {
            line: {
              className: 'highcharts-draw-line',
              start: function(e) {
                console.log('Drawing line started', e);
              },
              steps: ['start', 'end']
            }
          }
        };
      }
      
      // Only apply if we need to
      if (!H.StockToolsGui) {
        H.StockToolsGui = function(chart) {
          this.chart = chart;
          this.guiEnabled = true;
          
          // Create a basic toolbar
          const toolbar = document.createElement('div');
          toolbar.className = 'highcharts-stocktools-wrapper';
          toolbar.style.position = 'absolute';
          toolbar.style.top = '10px';
          toolbar.style.right = '10px';
          toolbar.style.zIndex = '100';
          toolbar.style.backgroundColor = 'white';
          toolbar.style.padding = '5px';
          toolbar.style.border = '1px solid #ccc';
          toolbar.style.borderRadius = '4px';
          
          // Add some basic buttons
          toolbar.innerHTML = `
            <div class="highcharts-stocktools-toolbar">
              <span class="highcharts-menu-item" title="Draw Line">
                <span class="highcharts-menu-item-btn">Line</span>
              </span>
              <span class="highcharts-menu-item" title="Draw Shape">
                <span class="highcharts-menu-item-btn">Shape</span>
              </span>
            </div>
          `;
          
          // Add it to the chart container
          chart.container.appendChild(toolbar);
          
          return this;
        };
      }
    };
    
    // Apply our basic module
    registerBasicStockTools(highchartsInstance);

    // Try to load the real modules
    try {
      await import('highcharts/modules/stock-tools').then(module => {
        const mod = module.default || module;
        mod(highchartsInstance);
        console.log('Stock tools module loaded successfully');
      });
    } catch (error) {
      console.warn('Optional stock-tools module not available:', error.message);
    }

    try {
      await import('highcharts/modules/annotations-advanced').then(module => {
        const mod = module.default || module;
        mod(highchartsInstance);
        console.log('Annotations module loaded successfully');
      });
    } catch (error) {
      console.warn('Optional annotations-advanced module not available:', error.message);
    }

    // Add default options for stock tools and accessibility
    highchartsInstance.setOptions({
      accessibility: {
        enabled: false // Disable accessibility warnings for now
      },
      stockTools: {
        gui: {
          enabled: true,
          visible: true, // Force visibility
          buttons: ['simpleShapes', 'lines', 'crookedLines', 'measure', 'advanced'],
          definitions: {
            line: {
              symbol: 'line.svg'
            }
          }
        }
      },
      tooltip: {
        enabled: true, // We'll use custom formatters instead of disabling
        outside: false,
        shadow: false,
        borderWidth: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        style: {
          padding: '8px'
        }
      }
    });

    return highchartsInstance;
  } catch (error) {
    console.error('Error initializing Highcharts:', error);
    return null;
  }
};

// Add a fallback chart creation function
const createBasicChart = (container, data) => {
  if (!container || !data || data.length === 0) return null;
  
  try {
    // Standard import of Highcharts (non-async for fallback)
    const Highcharts = require('highcharts/highstock');
    
    // Process data to ensure it's in the right format
    const ohlcData = Array.isArray(data[0]) ? 
      data : 
      data.map(point => [
        point.timestamp || point.date || point.x,
        point.open,
        point.high,
        point.low,
        point.close
      ]);
    
    // Create a basic chart with minimal options
    return Highcharts.stockChart(container, {
      chart: {
        animation: false,
        height: 600,
        events: {
          // Add basic hover handling
          mousemove: function(e) {
            const point = this.series[0].searchPoint(e, true);
            if (point) {
              // Create a simple tooltip if the point exists
              const date = new Date(point.x);
              const price = point.y || point.close;
              
              // Create a simple display element
              let display = document.getElementById('ohlc-display');
              if (!display) {
                display = document.createElement('div');
                display.id = 'ohlc-display';
                display.className = 'ohlc-display';
                container.appendChild(display);
              }
              
              display.innerHTML = `${date.toLocaleDateString()} - Price: ${price ? price.toFixed(2) : 'n/a'}`;
            }
          }
        }
      },
      series: [{
        type: 'candlestick',
        data: ohlcData,
        name: 'Price',
        dataGrouping: {
          enabled: false
        }
      }],
      tooltip: {
        enabled: false // We use the custom OHLC display
      },
      rangeSelector: {
        enabled: false
      },
      navigator: {
        enabled: false
      },
      scrollbar: {
        enabled: false
      },
      credits: {
        enabled: false
      }
    });
  } catch (error) {
    console.error('Error creating basic chart:', error);
    return null;
  }
};

/**
 * A TradingView-like chart component using Highstock with drawing tools and price-to-bar ratio locking
 * 
 * This component renders a financial chart with:
 * - Manual drawing tools (via Stock Tools module)
 * - Ability to lock price-to-bar ratio (aspect ratio) to maintain angle consistency
 * - OHLC/Candlestick data visualization
 */
const HighstockTradingViewChart = ({ 
  data = [], 
  title = 'Price Chart',
  initialPriceToBarRatio = 0.00369, // Default ratio as per requirements
}) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [priceToBarRatio, setPriceToBarRatio] = useState(initialPriceToBarRatio);
  const [priceToBarRatioText, setPriceToBarRatioText] = useState(initialPriceToBarRatio.toString());
  const [isRatioLocked, setIsRatioLocked] = useState(true);
  const [chartOptions, setChartOptions] = useState(null);
  const [drawnLineInfo, setDrawnLineInfo] = useState(null);
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

  // Function to calculate angle between two points
  const calculateAngle = (x1, y1, x2, y2) => {
    try {
      // Calculate angle in radians, then convert to degrees
      const angleRad = Math.atan2(y2 - y1, x2 - x1);
      const angleDeg = angleRad * (180 / Math.PI);
      
      // Adjust to get angle from horizontal
      let angle = 90 - angleDeg;
      
      // Normalize to 0-360 range
      if (angle < 0) angle += 360;
      if (angle >= 360) angle -= 360;
      
      // Round to one decimal place
      return parseFloat(angle.toFixed(1));
    } catch (error) {
      console.error('Error calculating angle:', error);
      return 0;
    }
  };

  // Generate chart options when data or ratio changes
  useEffect(() => {
    if (!highcharts || !data || data.length === 0) {
      console.log("Cannot generate chart options:", {
        hasHighcharts: !!highcharts,
        hasData: !!data,
        dataLength: data?.length
      });
      return;
    }

    console.log("Generating chart options with data:", {
      dataLength: data.length,
      firstPoint: data[0],
      lastPoint: data[data.length - 1],
      isArray: Array.isArray(data[0])
    });

    // Process the data to OHLC format if needed
    const ohlcData = Array.isArray(data[0]) ? data : data.map(point => [
      point.timestamp || point.date || point.x,
      point.open,
      point.high,
      point.low,
      point.close
    ]);

    console.log("Processed OHLC data:", {
      length: ohlcData.length,
      firstPoint: ohlcData[0],
      lastPoint: ohlcData[ohlcData.length - 1],
      isValid: ohlcData.every(point => 
        point.length >= 5 && 
        !isNaN(point[1]) && 
        !isNaN(point[2]) && 
        !isNaN(point[3]) && 
        !isNaN(point[4])
      )
    });

    // Create volume data array if available
    const volumeData = Array.isArray(data[0]) && data[0].length >= 6 ? 
      data.map(point => [
        point[0], // timestamp
        point[5]  // volume
      ]) : [];

    console.log("Volume data:", {
      hasVolume: volumeData.length > 0,
      length: volumeData.length,
      firstPoint: volumeData[0]
    });

    // Calculate min, max values of price for Y-axis scaling
    const priceValues = ohlcData.flatMap(point => [point[1], point[2], point[3], point[4]]);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);
    const priceRange = maxPrice - minPrice;

    console.log("Price range:", {
      min: minPrice,
      max: maxPrice,
      range: priceRange
    });

    // Date range for X-axis
    const startDate = ohlcData[0][0];
    const endDate = ohlcData[ohlcData.length - 1][0];
    const timeRange = endDate - startDate;

    console.log("Time range:", {
      start: new Date(startDate).toISOString(),
      end: new Date(endDate).toISOString(),
      range: timeRange
    });

    // Calculate the appropriate Y-axis max/min based on the price-to-bar ratio
    const barCount = ohlcData.length;
    
    // FIXED: Use proper ratio calculation without the timeRange factor
    const adjustedPriceRange = priceToBarRatio * barCount;
    
    // Add padding to ensure values are visible
    const paddingFactor = 0.1; // 10% padding
    const paddingAmount = priceRange * paddingFactor;
    
    const centerPrice = (maxPrice + minPrice) / 2;
    const yAxisMin = Math.max(minPrice - paddingAmount, centerPrice - adjustedPriceRange / 2);
    const yAxisMax = Math.min(maxPrice + paddingAmount, centerPrice + adjustedPriceRange / 2);

    console.log("Y-axis configuration:", {
      barCount,
      adjustedPriceRange,
      centerPrice,
      yAxisMin,
      yAxisMax
    });

    const options = {
      chart: {
        height: 600,
        animation: false,
        panning: {
          enabled: true,
          type: 'xy'
        },
        panKey: 'shift',
        zoomType: 'xy',
        events: {
          load: function() {
            try {
              console.log('Chart loaded successfully');
              
              // Force stock tools visibility after a short delay
              setTimeout(() => {
                try {
                  const guiContainer = document.querySelector('.highcharts-stocktools-wrapper');
                  if (guiContainer) {
                    guiContainer.style.display = 'block';
                    guiContainer.style.visibility = 'visible';
                    guiContainer.style.opacity = '1';
                    guiContainer.style.zIndex = '100';
                    
                    const toolbar = guiContainer.querySelector('.highcharts-stocktools-toolbar');
                    if (toolbar) {
                      toolbar.style.display = 'block';
                      toolbar.style.visibility = 'visible';
                      toolbar.style.opacity = '1';
                    }
                  }
                } catch (error) {
                  console.error('Error setting stock tools visibility:', error);
                }
              }, 100);
            } catch (error) {
              console.error('Error in chart load event:', error);
            }
          },
          redraw: function() {
            // Update OHLC display on redraw
            const point = this.hoverPoints && this.hoverPoints[0];
            if (point) {
              updateOHLCDisplay(point);
            }
          }
        }
      },
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
        }]
      },
      navigator: {
        enabled: true
      },
      scrollbar: {
        enabled: true
      },
      title: {
        text: title
      },
      stockTools: {
        gui: {
          enabled: true,
          visible: true,
          buttons: ['simpleShapes', 'lines', 'crookedLines'],
          definitions: {
            line: {
              symbol: 'line.svg'
            }
          }
        }
      },
      plotOptions: {
        candlestick: {
          color: '#ef5350',
          upColor: '#26a69a',
          lineColor: '#ef5350',
          upLineColor: '#26a69a',
          states: {
            hover: {
              brightness: 0.1
            }
          }
        }
      },
      tooltip: {
        enabled: true,
        followPointer: true,
        followTouchMove: true,
        formatter: function() {
          if (!this.points) return false;
          
          const point = this.points[0];
          if (!point || !point.point) return false;
          
          // Update the OHLC display
          updateOHLCDisplay(point.point);
          
          // Return false to prevent showing the tooltip
          return false;
        }
      },
      xAxis: {
        ordinal: false,     // Disable ordinal axis to allow panning to empty areas
        minRange: 24 * 3600 * 1000, // Minimum range of 1 day to prevent excessive zoom
        overscroll: 0.5,    // Allow overscroll beyond data points
        events: {
          afterSetExtremes: function(e) {
            if (!isRatioLocked) return;
            
            try {
              const xAxis = this;
              const yAxis = this.chart.yAxis[0];
              
              // Current ranges after zoom/pan
              const currentXRange = xAxis.max - xAxis.min;
              
              // Calculate how many bars are visible in the current view
              const timePerBar = (endDate - startDate) / barCount;
              const barsInView = Math.round(currentXRange / timePerBar);
              
              // Calculate the appropriate Y-axis range based on the price-to-bar ratio
              const newYRange = priceToBarRatio * barsInView;
              
              // Get current center point of view
              const centerY = (yAxis.max + yAxis.min) / 2;
              
              console.log("Adjusting Y-axis to maintain ratio:", {
                barsInView,
                priceToBarRatio,
                newYRange,
                centerY
              });
              
              // Only set extremes if values are valid
              if (!isNaN(newYRange) && newYRange > 0 && 
                  isFinite(centerY - newYRange / 2) && isFinite(centerY + newYRange / 2)) {
                yAxis.setExtremes(
                  centerY - newYRange / 2,
                  centerY + newYRange / 2,
                  true  // Redraw
                );
              }
            } catch (error) {
              console.error('Error in afterSetExtremes:', error);
            }
          }
        }
      },
      yAxis: [{
        // Price axis
        min: yAxisMin,
        max: yAxisMax,
        startOnTick: false,
        endOnTick: false,
        minPadding: 0.1,
        maxPadding: 0.1,
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'Price'
        },
        height: '60%',
        lineWidth: 2,
        resize: {
          enabled: true
        }
      }, {
        // Volume axis
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'Volume'
        },
        top: '65%',
        height: '35%',
        offset: 0,
        lineWidth: 2
      }],
      series: [
        {
          type: 'candlestick',
          name: 'Price',
          id: 'price_chart',
          data: ohlcData,
          dataGrouping: {
            enabled: false // Disable data grouping to show all candlesticks
          }
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

    console.log("Generated chart options:", {
      hasData: !!options.series?.[0]?.data,
      dataLength: options.series?.[0]?.data?.length,
      hasVolume: !!options.series?.[1],
      yAxisConfig: options.yAxis?.[0],
      hasAngleBinding: !!options.navigation?.bindings?.angleToolBinding
    });

    setChartOptions(options);
  }, [data, priceToBarRatio, isRatioLocked, title, highcharts]);

  // Create or update chart when options change
  useEffect(() => {
    let chart = null;

    const initChart = async () => {
      if (!chartRef.current || !data || data.length === 0) return;

      try {
        const highchartsInstance = await initHighcharts();
        
        if (!highchartsInstance) {
          console.warn('Falling back to basic chart...');
          chart = createBasicChart(chartRef.current, data);
          return;
        }

        // Add CSS for the stock tools toolbar
        const style = document.createElement('style');
        style.textContent = `
          .highcharts-stocktools-wrapper {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 100 !important;
            position: absolute;
            top: 0;
            right: 10px;
          }
          .highcharts-menu {
            background-color: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .highcharts-menu-item {
            padding: 8px 12px;
            color: #333;
          }
          .highcharts-menu-item:hover {
            background-color: #f2f2f2;
          }
        `;
        document.head.appendChild(style);

        // Process data (ensure it's in the correct format)
        const ohlcData = Array.isArray(data[0]) ? 
          data : 
          data.map(point => [
            point.timestamp || point.date || point.x,
            point.open,
            point.high,
            point.low,
            point.close,
            point.volume || 0
          ]);

        // Create OHLC display element if it doesn't exist
        let ohlcDisplay = document.getElementById('ohlc-display');
        if (!ohlcDisplay) {
          ohlcDisplay = document.createElement('div');
          ohlcDisplay.id = 'ohlc-display';
          ohlcDisplay.className = 'ohlc-display';
          ohlcDisplay.innerHTML = '<span>Hover over candle</span>';
          chartRef.current.appendChild(ohlcDisplay);
        }

        // Create chart with full features
        chart = highchartsInstance.stockChart(chartRef.current, {
          chart: {
            height: 600,
            animation: false,
            panning: {
              enabled: true,
              type: 'xy'
            },
            events: {
              // Load event to ensure stock tools are visible
              load: function() {
                // Add a slight delay to ensure DOM is ready
                setTimeout(() => {
                  try {
                    // Try to find the toolbar
                    const toolbar = document.querySelector('.highcharts-stocktools-wrapper');
                    
                    if (toolbar) {
                      // Make toolbar visible if it exists but is hidden
                      toolbar.style.display = 'block';
                      toolbar.style.visibility = 'visible';
                      toolbar.style.opacity = '1';
                      toolbar.style.zIndex = '100';
                      console.log('Stock tools toolbar found and made visible');
                    } else {
                      // If toolbar is missing, try to create it manually
                      console.log('Stock tools toolbar not found, creating manually...');
                      
                      // Force enable stock tools
                      if (this.stockTools) {
                        this.stockTools.destroy();
                      }
                      
                      // Recreate the stock tools
                      this.update({
                        stockTools: {
                          gui: {
                            enabled: true,
                            buttons: ['simpleShapes', 'lines', 'crookedLines', 'measure']
                          }
                        }
                      });
                      
                      // Add CSS to force visibility after manual creation
                      const style = document.createElement('style');
                      style.textContent = `
                        .highcharts-stocktools-wrapper {
                          display: block !important;
                          visibility: visible !important;
                          opacity: 1 !important;
                          z-index: 999 !important;
                          position: absolute !important;
                          top: 10px !important;
                          right: 10px !important;
                        }
                      `;
                      document.head.appendChild(style);
                    }
                  } catch (error) {
                    console.error('Error ensuring stock tools visibility:', error);
                  }
                }, 500); // Longer delay for better chances
              },
              // Handle pointer movements to update OHLC display
              mousemove: function(e) {
                const point = this.series[0].searchPoint(e, true);
                if (point) {
                  updateOHLCDisplay(point);
                }
              },
              // Manually handle redraw to ensure toolbar stays visible
              redraw: function() {
                setTimeout(() => {
                  const toolbar = document.querySelector('.highcharts-stocktools-wrapper');
                  if (toolbar) {
                    toolbar.style.display = 'block';
                    toolbar.style.visibility = 'visible';
                    toolbar.style.opacity = '1';
                    toolbar.style.zIndex = '100';
                  }
                }, 100);
              }
            }
          },
          // Configure tooltip to display custom info
          tooltip: {
            enabled: false // Disable default tooltip, we use custom OHLC display
          },
          series: [{
            type: 'candlestick',
            name: 'Price',
            data: ohlcData,
            dataGrouping: {
              enabled: false // Ensures candles are not grouped at any zoom level
            },
            point: {
              events: {
                mouseOver: function() {
                  updateOHLCDisplay(this);
                }
              }
            }
          }],
          // Stock tools configuration for drawing
          stockTools: {
            gui: {
              enabled: true,
              buttons: ['simpleShapes', 'lines', 'crookedLines', 'measure'],
              definitions: {
                line: {
                  symbol: 'line.svg'
                }
              }
            }
          },
          // Navigation bindings for handling drawn annotations
          navigation: {
            bindingsClassName: 'tools-container',
            events: {
              selectButton: function(event) {
                console.log('Tool selected:', event.button);
              },
              deselectButton: function(event) {
                console.log('Tool deselected:', event.button);
              },
              // Capture drawn lines to calculate angles
              afterUpdate: function(event) {
                if (event.annotation && event.annotation.shapes) {
                  try {
                    const shape = event.annotation.shapes[0];
                    if (shape && shape.points) {
                      const start = shape.points[0];
                      const end = shape.points[1];
                      if (start && end) {
                        const angle = calculateAngle(
                          start.plotX, 
                          start.plotY, 
                          end.plotX, 
                          end.plotY
                        );
                        
                        setDrawnLineInfo({
                          start: { x: start.x, y: start.y },
                          end: { x: end.x, y: end.y },
                          angle: angle
                        });
                      }
                    }
                  } catch (error) {
                    console.error('Error calculating line angle:', error);
                  }
                }
              }
            }
          },
          // Remove range selector for cleaner UI
          rangeSelector: {
            enabled: false
          },
          navigator: {
            enabled: false
          },
          scrollbar: {
            enabled: false
          },
          // Y-axis setup to respect price-to-bar ratio
          yAxis: {
            startOnTick: false,
            endOnTick: false,
            events: {
              afterSetExtremes: function(e) {
                if (isRatioLocked && chart) {
                  try {
                    // If ratio is locked, maintain the price-to-bar ratio when zooming
                    const xAxis = chart.xAxis[0];
                    if (!xAxis) return;
                    
                    const xRange = xAxis.max - xAxis.min;
                    
                    // Get time series data with safety checks
                    const series = chart.series[0];
                    if (!series || !series.xData || series.xData.length < 2) {
                      console.warn('Not enough data points to calculate time per bar');
                      return;
                    }
                    
                    // Calculate average bar time length for stability
                    let totalTimeDiff = 0;
                    let validIntervals = 0;
                    
                    for (let i = 1; i < Math.min(10, series.xData.length); i++) {
                      const diff = series.xData[i] - series.xData[i-1];
                      if (diff > 0) {
                        totalTimeDiff += diff;
                        validIntervals++;
                      }
                    }
                    
                    const barTimeLength = validIntervals > 0 
                      ? totalTimeDiff / validIntervals 
                      : (series.xData[1] - series.xData[0]);
                    
                    // Protection against zero or negative values
                    if (barTimeLength <= 0) {
                      console.warn('Invalid bar time length, cannot maintain aspect ratio');
                      return;
                    }
                    
                    const barsInView = xRange / barTimeLength;
                    
                    // Apply ratio to determine price range
                    const priceRange = priceToBarRatio * barsInView;
                    const currentCenter = (e.min + e.max) / 2;
                    
                    // Update y-axis to maintain ratio
                    this.setExtremes(
                      currentCenter - priceRange / 2,
                      currentCenter + priceRange / 2,
                      true,  // redraw
                      false  // animation
                    );
                  } catch (error) {
                    console.error('Error maintaining aspect ratio:', error);
                  }
                }
              }
            }
          }
        });
        
        // Store chart instance for later use
        chartInstanceRef.current = chart;
      } catch (error) {
        console.error('Error creating chart:', error);
        // Attempt fallback if main initialization fails
        try {
          chart = createBasicChart(chartRef.current, data);
        } catch (fallbackError) {
          console.error('Fallback chart creation also failed:', fallbackError);
        }
      }
    };

    initChart();

    return () => {
      if (chart && chart.destroy) {
        try {
          chart.destroy();
        } catch (error) {
          console.warn('Error destroying chart:', error);
        }
      }
    };
  }, [data, priceToBarRatio, isRatioLocked]);

  // Replace the existing handleRatioChange with a new text-focused handler
  const handleRatioTextChange = (e) => {
    // Allow any text input without immediate validation
    setPriceToBarRatioText(e.target.value);
  };

  // Handle the blur event to apply the valid numeric value
  const handleRatioBlur = () => {
    const newValue = parseFloat(priceToBarRatioText);
    if (!isNaN(newValue) && newValue > 0) {
      setPriceToBarRatio(newValue);
    } else {
      // Reset text to match the current actual value
      setPriceToBarRatioText(priceToBarRatio.toString());
    }
  };

  // Optional: Add a handler for Enter key to apply the value immediately
  const handleRatioKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRatioBlur();
      e.target.blur(); // Remove focus from the input
    }
  };

  // Function to toggle the ratio lock
  const toggleRatioLock = () => {
    const newState = !isRatioLocked;
    setIsRatioLocked(newState);
    
    console.log(`Price-to-bar ratio lock ${newState ? 'enabled' : 'disabled'}`);
    
    // If we're turning on locking, immediately apply the ratio constraint
    if (newState && chartInstanceRef.current) {
      try {
        const chart = chartInstanceRef.current;
        const xAxis = chart.xAxis[0];
        const yAxis = chart.yAxis[0];
        
        // Guard clauses to prevent errors
        if (!xAxis || !yAxis) {
          console.warn('Missing axis, cannot apply ratio lock');
          return;
        }
        
        // Get current extremes
        const xMin = xAxis.min;
        const xMax = xAxis.max;
        const xRange = xMax - xMin;
        
        // Calculate time per bar - with safeguards
        const timeSeries = chart.series[0]?.xData;
        if (!timeSeries || timeSeries.length < 2) {
          console.warn('Not enough data points to calculate time per bar');
          return;
        }
        
        // Use average time difference for better stability
        let totalTimeDiff = 0;
        let validIntervals = 0;
        
        for (let i = 1; i < Math.min(10, timeSeries.length); i++) {
          const diff = timeSeries[i] - timeSeries[i-1];
          if (diff > 0) {
            totalTimeDiff += diff;
            validIntervals++;
          }
        }
        
        // Calculate average time per bar
        const barTimeLength = validIntervals > 0 
          ? totalTimeDiff / validIntervals 
          : (timeSeries[1] - timeSeries[0]);
        
        // Protection against zero or negative values
        if (barTimeLength <= 0) {
          console.warn('Invalid bar time length, cannot apply ratio lock');
          return;
        }
        
        const barsInView = xRange / barTimeLength;
        
        // Calculate required Y axis range to maintain the ratio
        const yRange = priceToBarRatio * barsInView;
        
        // Calculate center of current view
        const yCenter = (yAxis.max + yAxis.min) / 2;
        
        console.log("Applying price-to-bar ratio lock:", {
          ratio: priceToBarRatio,
          barsInView,
          barTimeLength,
          xRange,
          requiredYRange: yRange,
          currentYCenter: yCenter
        });
        
        // Set new extremes to maintain the ratio
        yAxis.setExtremes(
          yCenter - yRange / 2,
          yCenter + yRange / 2,
          true,  // Redraw
          true   // Animation
        );
      } catch (error) {
        console.error("Error applying price-to-bar ratio lock:", error);
      }
    }
  };

  // Helper function to update OHLC display
  const updateOHLCDisplay = (point) => {
    try {
      if (!point) return;
      
      const formatNumber = (num, decimals = 2) => {
        if (typeof num !== 'number' || isNaN(num)) return '-';
        return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };
      
      // Handle both array format and object format points
      let date, open, high, low, close, volume;
      
      if (Array.isArray(point)) {
        // If point is an array [timestamp, open, high, low, close, volume]
        [date, open, high, low, close, volume] = point;
      } else if (point.options) {
        // If point is a Highcharts point object with options
        date = point.x;
        open = point.open || point.options.open;
        high = point.high || point.options.high;
        low = point.low || point.options.low;
        close = point.close || point.options.close;
        volume = point.options.volume;
      } else {
        // Direct properties
        date = point.x;
        open = point.open;
        high = point.high;
        low = point.low;
        close = point.close;
        volume = point.volume;
      }
      
      // Format the date
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString();
      const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Create HTML content
      const ohlcHtml = `
        <span style="font-weight:bold">${formattedDate} ${time}</span> &nbsp; | &nbsp;
        <span style="color:#333">O:</span> <span style="font-weight:bold">${formatNumber(open)}</span> &nbsp;
        <span style="color:#333">H:</span> <span style="font-weight:bold">${formatNumber(high)}</span> &nbsp;
        <span style="color:#333">L:</span> <span style="font-weight:bold">${formatNumber(low)}</span> &nbsp;
        <span style="color:#333">C:</span> <span style="font-weight:bold">${formatNumber(close)}</span>
        ${volume ? `&nbsp; <span style="color:#3060cf">V:</span> <span style="font-weight:bold">${formatNumber(volume, 0)}</span>` : ''}
      `;
      
      // Update the display element
      const ohlcDisplay = document.getElementById('ohlc-display');
      if (ohlcDisplay) {
        ohlcDisplay.innerHTML = ohlcHtml;
        ohlcDisplay.style.display = 'block';
      }
    } catch (error) {
      console.error('Error updating OHLC display:', error);
    }
  };

  // If we're on the server or Highcharts isn't loaded, show a loading state
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
            <small>Try values between 0.001 and 0.1 for best results</small>
          </div>
        </div>
        
        <div className="ohlc-display-container">
          <div className="ohlc-display" id="ohlc-display">
            <span>Hover over candle</span>
          </div>
        </div>
        
        {drawnLineInfo && (
          <div className="drawn-line-info">
            <h4>Line Info</h4>
            <p>
              Start: ({drawnLineInfo.start.x.toFixed(2)}, {drawnLineInfo.start.y.toFixed(2)})
              <br />
              End: ({drawnLineInfo.end.x.toFixed(2)}, {drawnLineInfo.end.y.toFixed(2)})
              <br />
              Angle: {drawnLineInfo.angle}°
            </p>
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
        
        /* OHLC display styling */
        .ohlc-display {
          background-color: rgba(255, 255, 255, 0.8);
          padding: 8px 12px;
          border-radius: 4px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
          font-size: 14px;
          z-index: 10;
          position: relative;
        }
        
        .drawn-line-info {
          margin-left: 20px;
          padding: 10px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .drawn-line-info h4 {
          margin: 0 0 5px 0;
          font-size: 16px;
        }
        
        .drawn-line-info p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .highcharts-stock-chart-wrapper {
          position: relative;
          width: 100%;
          height: 600px;
        }
        
        .chart-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
      `}</style>
      {/* Global styles to ensure stock tools are visible */}
      <style jsx global>{`
        /* Force the stock tools wrapper to be visible */
        .highcharts-stocktools-wrapper {
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
          z-index: 99 !important;
          position: absolute !important;
          top: 10px !important;
          right: 10px !important;
          width: auto !important;
          height: auto !important;
          background-color: white !important;
          border: 1px solid #ddd !important;
          border-radius: 4px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          padding: 5px !important;
        }
        
        /* Make toolbar items clearly visible */
        .highcharts-menu-item {
          margin: 3px !important;
          padding: 5px !important;
          cursor: pointer !important;
          border-radius: 3px !important;
          display: inline-block !important;
        }
        
        .highcharts-menu-item:hover {
          background-color: #f0f0f0 !important;
        }
        
        /* Ensure toolbar elements are shown */
        .highcharts-stocktools-toolbar {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Make sure the icons in the toolbar are visible */
        .highcharts-menu-item-btn {
          width: 30px !important;
          height: 30px !important;
          display: block !important;
          margin: 0 auto !important;
        }
        
        /* Fix annotations and drawn lines */
        .highcharts-annotation {
          z-index: 2 !important;
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

// Export as dynamic component with SSR disabled to prevent loading Highcharts on server
export default dynamic(() => Promise.resolve(HighstockTradingViewChart), {
  ssr: false
}); 
