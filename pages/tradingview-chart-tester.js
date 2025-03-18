import React, { useState, useEffect, useRef } from 'react';
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

const ControlPanel = styled.div`
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 200px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0051b3;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const AngleDisplay = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #e6f7ff;
  border-radius: 4px;
  border-left: 4px solid #1890ff;
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
 * TradingView Chart Tester Page
 * 
 * This page demonstrates the TradingView-like chart capabilities with:
 * - Granular price-to-bar ratio locking
 * - Manual drawing tools
 * - Angle preservation when drawing lines
 */
const TradingViewChartTesterPage = () => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState('AAPL');
  const [timeRange, setTimeRange] = useState('1y');
  const [interval, setInterval] = useState('1d');
  const [priceToBarRatio, setPriceToBarRatio] = useState(0.00369);
  const [lastDrawnLineAngle, setLastDrawnLineAngle] = useState(null);
  
  // Load data on component mount or when parameters change
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to fetch from API first
        const response = await axios.get(`/api/history/${symbol}?interval=${interval}&range=${timeRange}`);
        
        if (response.data && Array.isArray(response.data)) {
          setChartData(response.data);
        } else {
          throw new Error('Invalid data format received from API');
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(`Using demo data: ${err.message}`);
        
        // Use demo data as fallback
        const demoData = generateDemoData(timeRange === '1y' ? 250 : 100);
        setChartData(demoData);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [symbol, timeRange, interval]);

  // Handle symbol change
  const handleSymbolChange = (e) => {
    setSymbol(e.target.value.toUpperCase());
  };

  // Handle price-to-bar ratio change
  const handleRatioChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setPriceToBarRatio(value);
    }
  };

  const handleDrawingComplete = (lineInfo) => {
    if (lineInfo && lineInfo.angle !== undefined) {
      setLastDrawnLineAngle(lineInfo.angle);
    }
  };

  return (
    <Layout>
      <Head>
        <title>TradingView Chart Tester | Gann Square</title>
        <meta name="description" content="Test TradingView-like charting capabilities with granular price-to-bar ratio and drawing tools" />
      </Head>

      <PageContainer>
        <Title>TradingView Chart Tester</Title>
        <Description>
          Test TradingView-like charting with granular price-to-bar ratio locking and drawing tools. 
          The price-to-bar ratio determines how many price units correspond to one time unit (bar),
          which affects the angle of trend lines.
        </Description>

        <ControlPanel>
          <ControlRow>
            <InputGroup>
              <Label htmlFor="symbol">Symbol</Label>
              <Input 
                id="symbol" 
                type="text" 
                value={symbol} 
                onChange={handleSymbolChange} 
                placeholder="AAPL"
              />
            </InputGroup>

            <InputGroup>
              <Label htmlFor="timeRange">Time Range</Label>
              <Select 
                id="timeRange" 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="1d">1 Day</option>
                <option value="5d">5 Days</option>
                <option value="1mo">1 Month</option>
                <option value="3mo">3 Months</option>
                <option value="6mo">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
                <option value="5y">5 Years</option>
              </Select>
            </InputGroup>

            <InputGroup>
              <Label htmlFor="interval">Interval</Label>
              <Select 
                id="interval" 
                value={interval} 
                onChange={(e) => setInterval(e.target.value)}
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
                <option value="1wk">1 Week</option>
                <option value="1mo">1 Month</option>
              </Select>
            </InputGroup>

            <InputGroup>
              <Label htmlFor="priceToBarRatio">Price-to-Bar Ratio</Label>
              <Input 
                id="priceToBarRatio" 
                type="number" 
                value={priceToBarRatio} 
                onChange={handleRatioChange} 
                step="0.00001"
                min="0.00001"
                placeholder="0.00369"
              />
            </InputGroup>

            <Button 
              onClick={() => window.location.reload()}
              disabled={isLoading}
            >
              Reload Data
            </Button>
          </ControlRow>

          {lastDrawnLineAngle !== null && (
            <AngleDisplay>
              <strong>Last Drawn Line Angle:</strong> {lastDrawnLineAngle.toFixed(2)}°
            </AngleDisplay>
          )}
        </ControlPanel>

        {error && (
          <div style={{ marginBottom: '1rem', color: '#f5222d' }}>
            <p>Note: {error}</p>
          </div>
        )}

        {isLoading ? (
          <div>Loading chart data...</div>
        ) : (
          <HighstockTradingViewChart 
            data={chartData} 
            title={`${symbol} Chart`}
            initialPriceToBarRatio={priceToBarRatio}
            onDrawingComplete={handleDrawingComplete}
          />
        )}
      </PageContainer>
    </Layout>
  );
};

export default TradingViewChartTesterPage; 