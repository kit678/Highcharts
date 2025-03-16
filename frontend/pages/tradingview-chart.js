import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import Layout from '../components/Layout';
import TradingViewChart from '../components/TradingViewChart';
import axios from 'axios';
import HighstockTradingViewChart from '../components/HighstockTradingViewChart';

// Import the CSS file for the Highcharts Stock Tools module
import '../styles/highstock-styles.css';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #333;
`;

const Description = styled.p`
  margin-bottom: 2rem;
  color: #555;
  line-height: 1.5;
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 600px;
  margin-bottom: 2rem;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 14px;
  margin-bottom: 5px;
  color: #555;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 120px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 120px;
  background-color: white;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #5d9cf5;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  align-self: flex-end;

  &:hover {
    background-color: #4a8be0;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const FeaturesSection = styled.div`
  margin-top: 2rem;
`;

const FeatureTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
`;

const FeatureList = styled.ul`
  margin-left: 1.5rem;
  line-height: 1.6;
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
  background-color: #fed7d7;
`;

// Map of Yahoo Finance intervals and ranges
const INTERVALS = [
  { label: "1 Minute", value: "1m" },
  { label: "2 Minutes", value: "2m" },
  { label: "5 Minutes", value: "5m" },
  { label: "15 Minutes", value: "15m" },
  { label: "30 Minutes", value: "30m" },
  { label: "60 Minutes", value: "60m" },
  { label: "90 Minutes", value: "90m" },
  { label: "1 Hour", value: "1h" },
  { label: "1 Day", value: "1d" },
  { label: "5 Days", value: "5d" },
  { label: "1 Week", value: "1wk" },
  { label: "1 Month", value: "1mo" },
  { label: "3 Months", value: "3mo" }
];

const RANGES = [
  { label: "1 Day", value: "1d" },
  { label: "5 Days", value: "5d" },
  { label: "1 Month", value: "1mo" },
  { label: "3 Months", value: "3mo" },
  { label: "6 Months", value: "6mo" },
  { label: "1 Year", value: "1y" },
  { label: "2 Years", value: "2y" },
  { label: "5 Years", value: "5y" },
  { label: "10 Years", value: "10y" },
  { label: "Year to Date", value: "ytd" },
  { label: "Max", value: "max" }
];

const TradingViewChartPage = () => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch sample OHLC data when the component mounts
  useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
      try {
        // Using Highcharts' demo API for sample data
        const response = await fetch('https://demo-live-data.highcharts.com/aapl-ohlcv.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setChartData(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data. Please try again later.');
      setIsLoading(false);
    }
  };

    fetchData();
  }, []);

  return (
    <Layout>
      <Head>
        <title>TradingView-like Chart with Highstock | GannSq9</title>
        <meta name="description" content="Advanced charting with TradingView-like features, manual drawing, and price-to-bar ratio locking using Highstock" />
        <link rel="stylesheet" type="text/css" href="https://code.highcharts.com/css/stocktools/gui.css" />
        <link rel="stylesheet" type="text/css" href="https://code.highcharts.com/css/annotations/popup.css" />
      </Head>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">TradingView-like Chart with Highstock</h1>
          <p className="text-gray-600">
            Advanced charting with drawing tools and granular price-to-bar ratio locking (e.g., 0.00369).
            The drawn lines maintain their angles when zooming or panning.
          </p>
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">AAPL Stock Chart</h2>
                <p className="text-sm text-gray-500">Apple Inc. historical OHLC data</p>
              </div>
              
              <HighstockTradingViewChart 
                data={chartData} 
                title="AAPL Stock Price"
                initialPriceToBarRatio={0.00369}
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

export default TradingViewChartPage; 