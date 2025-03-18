import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import Layout from '../components/Layout';
import HighstockTradingViewChart from '../components/HighstockTradingViewChart';
import axios from 'axios';

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
  
  return result;
};

/**
 * Backtesting Demo Page
 * 
 * This page demonstrates the backtesting capabilities with pivot point detection
 * and angle-based trading strategies
 */
const BacktestPage = () => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState('AAPL');
  
  // Load demo data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to fetch from API first
        const response = await axios.get(`/api/history/${symbol}?interval=1d&range=1y`);
        
        if (response.data && Array.isArray(response.data)) {
          setChartData(response.data);
        } else {
          throw new Error('Invalid data format received from API');
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(`Using demo data: ${err.message}`);
        
        // Use demo data as fallback
        const demoData = generateDemoData(250);
        setChartData(demoData);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [symbol]);
  
  // Handle symbol change
  const handleSymbolChange = (e) => {
    setSymbol(e.target.value.toUpperCase());
  };
  
  return (
    <Layout>
      <Head>
        <title>Backtesting with Technical Indicators | GannSq9</title>
        <meta name="description" content="Test trading strategies based on pivot points, angles, and trendlines" />
        <link rel="stylesheet" type="text/css" href="https://code.highcharts.com/css/stocktools/gui.css" />
        <link rel="stylesheet" type="text/css" href="https://code.highcharts.com/css/annotations/popup.css" />
      </Head>
      
      <PageContainer>
        <Title>Backtesting with Technical Indicators</Title>
        <Description>
          Test trading strategies based on pivot points, angles, and trendlines. 
          Draw angles between pivot points or use the automatic pivot point detection.
        </Description>
        
        {/* Symbol input */}
        <div className="mb-6">
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
            Stock Symbol
          </label>
          <div className="flex items-center">
            <input
              id="symbol"
              type="text"
              value={symbol}
              onChange={handleSymbolChange}
              className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mr-4"
              placeholder="e.g., AAPL"
            />
            <button
              onClick={() => {}}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Load Data
            </button>
          </div>
        </div>
        
        {/* Loading indicator */}
        {isLoading ? (
          <div className="flex justify-center items-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-4 text-gray-600">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Error message if any */}
            {error && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Note:</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}
            
            {/* Chart component */}
            {chartData && chartData.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">{symbol} Backtesting Chart</h2>
                  <p className="text-sm text-gray-500">Use the controls below the chart to run backtests</p>
                </div>
                
                <HighstockTradingViewChart 
                  data={chartData} 
                  title={`${symbol} - Backtesting`}
                  initialPriceToBarRatio={0.00369}
                />
              </div>
            )}
            
            {/* Strategy explanation */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Angle-Based Trading Strategies</h2>
              </div>
              <div className="p-4">
                <p className="mb-4">
                  <strong>Pivot Angle Pattern:</strong> This strategy identifies pivot points and measures 
                  the angle between them. When the angle falls within a specific range, it can signal a potential 
                  trading opportunity. The price-to-bar ratio ensures that angles are calculated consistently.
                </p>
                <p className="mb-4">
                  <strong>Candle-Angle Intersection:</strong> This strategy draws trendlines at specific angles 
                  from pivot points and triggers trades when price candles intersect these lines.
                </p>
                <p>
                  <strong>Trendline Break:</strong> This exit strategy closes positions when the price action 
                  breaks a trendline drawn from the entry point.
                </p>
              </div>
            </div>
          </>
        )}
      </PageContainer>
    </Layout>
  );
};

export default BacktestPage; 