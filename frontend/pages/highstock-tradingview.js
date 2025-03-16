import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import HighstockTradingViewChart from '../components/HighstockTradingViewChart';
import { fetchStockData, INTERVAL_OPTIONS, RANGE_OPTIONS } from '../services/yahooFinanceService';

/**
 * TradingView-like Chart Demo Page using Highstock
 * 
 * This page demonstrates the implementation of a TradingView-like chart using Highstock
 * with manual drawing tools and price-to-bar ratio locking for maintaining drawing angles.
 */

// Demo data for fallback when API fails
const generateDemoData = (count = 100) => {
  const result = [];
  const today = new Date();
  let basePrice = 150;
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - count + i);
    const timestamp = date.getTime();
    
    // Generate random price movements
    const change = (Math.random() - 0.5) * 3;
    const open = basePrice;
    const close = basePrice + change;
    basePrice = close; // Use previous close as next open
    
    const high = Math.max(open, close) + Math.random() * 1;
    const low = Math.min(open, close) - Math.random() * 1;
    const volume = Math.floor(Math.random() * 1000000) + 500000;
    
    result.push([
      timestamp, // Date in milliseconds
      open,      // Open
      high,      // High
      low,       // Low
      close,     // Close
      volume     // Volume
    ]);
  }
  
  console.log("Generated demo data (first point):", result[0]);
  return result;
};

const HighstockTradingViewPage = () => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for ticker input and selection
  const [ticker, setTicker] = useState('AAPL');
  const [interval, setInterval] = useState('1d');
  const [range, setRange] = useState('3mo');
  const [chartTitle, setChartTitle] = useState('');

  // Get the label for the selected interval and range
  const getIntervalLabel = (value) => {
    const option = INTERVAL_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value;
  };
  
  const getRangeLabel = (value) => {
    const option = RANGE_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Fetch data when the component mounts or when ticker/interval/range changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching data for ${ticker} with interval ${interval} and range ${range}`);
        const data = await fetchStockData(ticker, interval, range);
        
        // Debug the returned data
        console.log(`Received data for ${ticker}:`, {
          length: data.length,
          firstPoint: data[0],
          lastPoint: data[data.length - 1],
          isArray: Array.isArray(data[0]),
          hasVolume: Array.isArray(data[0]) && data[0].length >= 6
        });
        
        if (data.length === 0) {
          throw new Error("No data received from API");
        }
        
        setChartData(data);
        setChartTitle(`${ticker} - ${getIntervalLabel(interval)} (${getRangeLabel(range)})`);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(`Failed to load data: ${err.message}`);
        
        // Use demo data as fallback
        console.log("Using demo data as fallback");
        const demoData = generateDemoData(100);
        console.log("Generated demo data:", {
          length: demoData.length,
          firstPoint: demoData[0],
          lastPoint: demoData[demoData.length - 1]
        });
        setChartData(demoData);
        setChartTitle(`${ticker} (Demo Data)`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [ticker, interval, range]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // The useEffect will trigger a data fetch when these state values change
  };

  return (
    <Layout>
      <Head>
        <title>TradingView-like Chart with Highstock | GannSq9</title>
        <meta name="description" content="Advanced charting with TradingView-like features, manual drawing, and price-to-bar ratio locking using Highstock" />
      </Head>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">TradingView-like Chart with Highstock</h1>
          <p className="text-gray-600">
            Advanced charting with drawing tools and granular price-to-bar ratio locking (e.g., 0.00369).
            The drawn lines maintain their angles when zooming or panning.
          </p>
        </div>
        
        {/* Ticker Selection Form */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 p-4">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
            <div className="flex-grow min-w-[200px]">
              <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-1">
                Ticker Symbol
              </label>
              <input 
                type="text" 
                id="ticker" 
                value={ticker} 
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., AAPL"
              />
            </div>
            
            <div className="w-full sm:w-auto">
              <label htmlFor="interval" className="block text-sm font-medium text-gray-700 mb-1">
                Interval
              </label>
              <select 
                id="interval" 
                value={interval} 
                onChange={(e) => setInterval(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {INTERVAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full sm:w-auto">
              <label htmlFor="range" className="block text-sm font-medium text-gray-700 mb-1">
                Range
              </label>
              <select 
                id="range" 
                value={range} 
                onChange={(e) => setRange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full sm:w-auto">
              <button 
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Update Chart'}
              </button>
            </div>
          </form>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-4 text-gray-600">Loading chart data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : null}
        
        {chartData && chartData.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">{chartTitle || `${ticker} Stock Chart`}</h2>
                <p className="text-sm text-gray-500">{ticker} historical OHLC data</p>
              </div>
              
              <HighstockTradingViewChart 
                data={chartData} 
                title={chartTitle || `${ticker} Stock Price`}
                initialPriceToBarRatio={0.5}
              />
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">How to Use the Chart</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Use the drawing tools from the toolbar on the left to draw lines, shapes, etc.</li>
                      <li>The price-to-bar ratio is initially set to 0.00369. You can change this value to experiment.</li>
                      <li>When you draw a line, the angle will be calculated and displayed.</li>
                      <li>Try zooming in/out or panning while the ratio is locked - notice how the angle is preserved.</li>
                      <li>Toggle the lock to disable/enable the price-to-bar ratio locking feature.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Understanding Price-to-Bar Ratio</h2>
              </div>
              <div className="p-4">
                <p className="mb-4">
                  The price-to-bar ratio (c) defines how many price units correspond to one bar (time unit). 
                  This ratio is crucial for maintaining consistent angle measurements in technical analysis.
                </p>
                <p className="mb-4">
                  When drawing trend lines, the angle they form is determined by the relationship between price and time.
                  By locking this ratio, the geometry of drawn shapes is preserved even when zooming or panning.
                </p>
                <p>
                  In TradingView, this is equivalent to using their "lock scale" feature that maintains
                  the visual relationship between price and time movements.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default HighstockTradingViewPage; 