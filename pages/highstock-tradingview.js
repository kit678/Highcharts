import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import Layout from '../components/Layout';
import HighstockTradingViewChart from '../components/HighstockTradingViewChart';
import axios from 'axios';

/**
 * TradingView-like Chart Demo Page using Highstock
 * 
 * This page demonstrates the implementation of a TradingView-like chart using Highstock
 * with manual drawing tools and price-to-bar ratio locking for maintaining drawing angles.
 */

// Define chart interval options
const INTERVAL_OPTIONS = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '2h', label: '2 Hours' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1wk', label: '1 Week' },
  { value: '1mo', label: '1 Month' }
];

// Define chart date range options
const RANGE_OPTIONS = [
  { value: '1d', label: '1 Day' },
  { value: '5d', label: '5 Days' },
  { value: '1mo', label: '1 Month' },
  { value: '3mo', label: '3 Months' },
  { value: '6mo', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: '2y', label: '2 Years' },
  { value: '5y', label: '5 Years' },
  { value: 'max', label: 'Max' }
];

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 2rem;
`;

// Demo data for fallback when API fails
const generateDemoData = (count = 100, interval = '1d') => {
  const result = [];
  const today = new Date();
  let basePrice = 150;
  
  // Determine time increment based on interval
  let timeIncrement;
  switch (interval) {
    case '1m': timeIncrement = 60 * 1000; break;
    case '5m': timeIncrement = 5 * 60 * 1000; break;
    case '15m': timeIncrement = 15 * 60 * 1000; break;
    case '30m': timeIncrement = 30 * 60 * 1000; break;
    case '1h': timeIncrement = 60 * 60 * 1000; break;
    case '2h': timeIncrement = 2 * 60 * 60 * 1000; break;
    case '4h': timeIncrement = 4 * 60 * 60 * 1000; break;
    case '1wk': timeIncrement = 7 * 24 * 60 * 60 * 1000; break;
    case '1mo': timeIncrement = 30 * 24 * 60 * 60 * 1000; break;
    default: timeIncrement = 24 * 60 * 60 * 1000; // 1d is default
  }
  
  for (let i = 0; i < count; i++) {
    const timestamp = today.getTime() - (count - i) * timeIncrement;
    
    // Generate price movements appropriate for the interval
    // More volatility for longer timeframes
    const volatility = interval.includes('m') ? 0.01 : (interval === '1d' ? 0.02 : 0.03);
    const change = (Math.random() - 0.5) * basePrice * volatility;
    const open = basePrice;
    const close = basePrice + change;
    basePrice = close; // Use previous close as next open
    
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
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
  
  console.log(`Generated demo data (${interval}): first point at ${new Date(result[0][0]).toISOString()}`);
  return result;
};

// Function to fetch stock data from API
const fetchStockData = async (ticker, interval, range) => {
  try {
    console.log(`Fetching data for ${ticker} with interval ${interval} and range ${range}`);
    
    // Try to use the backend API 
    const url = `/api/history/${ticker}?interval=${interval}&range=${range}`;
    console.log(`API Request URL: ${url}`);
    
    const response = await axios.get(url);
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`Retrieved ${response.data.length} data points for ${ticker} with interval ${interval}`);
      return response.data;
    }
    
    throw new Error('Invalid data format received from API');
  } catch (error) {
    // Don't fall back to demo data - propagate the error
    console.error(`Error fetching data from API: ${error.message}`);
    throw error; // Throw the error instead of falling back to demo data
  }
};

const HighstockTradingViewPage = () => {
  // Mark when we're on the server for proper rendering
  const isServer = typeof window === 'undefined';
  
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for ticker input and selection
  const [ticker, setTicker] = useState('AAPL');
  const [interval, setInterval] = useState('1d');
  // Always use 'max' range
  const [range] = useState('max');
  const [chartTitle, setChartTitle] = useState('');

  // Get the label for the selected interval and range
  const getIntervalLabel = (value) => {
    const option = INTERVAL_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Fetch data when the component mounts or when ticker/interval changes
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
        setChartTitle(`${ticker} - ${getIntervalLabel(interval)} (All Data)`);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(`Failed to load data: ${err.message}`);
        
        // Use demo data as fallback
        console.log("Using demo data as fallback");
        const demoData = generateDemoData(100, interval);
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
        {!isServer && (
          <>
            <link rel="stylesheet" type="text/css" href="https://code.highcharts.com/css/stocktools/gui.css" />
            <link rel="stylesheet" type="text/css" href="https://code.highcharts.com/css/annotations/popup.css" />
          </>
        )}
      </Head>
      
      <PageContainer>
        <Title>TradingView-like Chart with Highstock</Title>
        <Description>
          Advanced charting with drawing tools, technical indicators, and granular price-to-bar ratio locking (e.g., 0.00369).
          The drawn lines maintain their angles when zooming or panning. Custom pivot point detection and backtesting included.
        </Description>
        
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
        
        {!isServer && chartData && chartData.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">{chartTitle || `${ticker} Stock Chart`}</h2>
                <p className="text-sm text-gray-500">{ticker} historical OHLC data (Maximum available range)</p>
              </div>
              
              <HighstockTradingViewChart 
                data={chartData} 
                title={chartTitle || `${ticker} Stock Price`}
                initialPriceToBarRatio={1}
              />
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
                  The ratio is unlocked by default, allowing independent price and time scaling. You can lock it 
                  using the lock button above the chart for consistent angle measurements.
                </p>
              </div>
            </div>
          </>
        )}
      </PageContainer>
    </Layout>
  );
};

export default HighstockTradingViewPage; 