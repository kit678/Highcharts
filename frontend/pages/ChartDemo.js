import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import TradingViewLightweightChart from '../components/TradingViewLightweightChart';
import { fetchHistoricalData, searchSymbols } from '../services/yahooFinanceService';
import ChartLayout from '../components/ChartLayout';

const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0;
  flex: 1;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #1e222d;
  border-bottom: 1px solid #2a2e39;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #d1d4dc;
  margin: 0;
`;

const SearchContainer = styled.div`
  display: flex;
  position: relative;
  width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  background-color: #2a2e39;
  color: #d1d4dc;
  border: 1px solid #363c4e;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #5d9cf5;
  }
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #2a2e39;
  border: 1px solid #363c4e;
  border-radius: 4px;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
`;

const SearchResultItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #363c4e;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #363c4e;
  }
  
  .symbol {
    font-weight: 600;
    margin-right: 8px;
  }
  
  .name {
    color: #787b86;
    font-size: 12px;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  margin-bottom: 0;
  gap: 10px;
  padding: 1rem 1.5rem;
  background-color: #1e222d;
  border-bottom: 1px solid #2a2e39;
`;

const Select = styled.select`
  background-color: #2a2e39;
  color: #d1d4dc;
  border: 1px solid #363c4e;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #5d9cf5;
  }
`;

const Button = styled.button`
  background-color: #2962ff;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #1e4bd8;
  }
  
  &:disabled {
    background-color: #363c4e;
    cursor: not-allowed;
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  background-color: #131722;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(93, 156, 245, 0.2);
    border-radius: 50%;
    border-top-color: #5d9cf5;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  padding: 1rem 1.5rem;
  background-color: rgba(239, 83, 80, 0.1);
  border-bottom: 1px solid #ef5350;
  color: #ef5350;
  margin-bottom: 0;
`;

/**
 * ChartDemo Component
 * 
 * A demo page showcasing the TradingViewLightweightChart with Yahoo Finance data.
 */
const ChartDemo = () => {
  const [data, setData] = useState([]);
  const [interval, setInterval] = useState('1d');
  const [range, setRange] = useState('1y');
  const [symbol, setSymbol] = useState('AAPL');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data when symbol, interval, or range changes
  useEffect(() => {
    const fetchChartData = async () => {
      // Clear any previous errors and set loading state
      setError(null);
      setIsLoading(true);
      setData([]); // Clear existing data while loading
      
      let primaryApiError = null;
      
      try {
        console.log(`Fetching data for ${symbol} with interval ${interval} and range ${range}`);
        
        // First try the backend API
        const backendUrl = `/api/history/${symbol}?interval=${interval}&range=${range}`;
        console.log(`Calling backend API: ${backendUrl}`);
        
        const response = await fetch(backendUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API returned status: ${response.status}. ${errorText || ''}`);
        }
        
        const responseData = await response.json();
        
        // Validate the response
        if (!Array.isArray(responseData)) {
          throw new Error(`Invalid data format received from API: expected array, got ${typeof responseData}`);
        }
        
        if (responseData.length === 0) {
          throw new Error(`No data available for ${symbol} with interval ${interval} and range ${range}`);
        }
        
        console.log(`Received ${responseData.length} data points from backend API`);
        
        // Process and normalize the data
        const processedData = responseData.map(item => ({
          date: new Date(item.date || item.time || item.timestamp).getTime(),
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
          volume: Number(item.volume || 0)
        }));
        
        // Sort by date and remove duplicates
        const uniqueData = Array.from(
          new Map(processedData.sort((a, b) => a.date - b.date).map(item => [item.date, item]))
          .values()
        );
        
        if (uniqueData.length > 0) {
          console.log(`Successfully processed ${uniqueData.length} unique data points`);
          setData(uniqueData);
          setLastUpdated(new Date().toLocaleString());
          setIsLoading(false);
        } else {
          throw new Error(`No valid data points found after processing for ${symbol}`);
        }
      } catch (err) {
        console.error("Backend API failed:", err.message);
        primaryApiError = err;
        
        // Try the frontend API as a fallback
        try {
          console.log("Falling back to frontend API");
          
          const yahooUrl = `/api/yahoofinance/history?symbol=${symbol}&interval=${interval}&range=${range}`;
          console.log(`Calling Yahoo Finance API: ${yahooUrl}`);
          
          const response = await fetch(yahooUrl);
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Yahoo API returned status: ${response.status}. ${errorText || ''}`);
          }
          
          const responseData = await response.json();
          
          // Validate the response
          if (!Array.isArray(responseData)) {
            throw new Error(`Invalid data format received from Yahoo API: expected array, got ${typeof responseData}`);
          }
          
          if (responseData.length === 0) {
            throw new Error(`No data available from Yahoo for ${symbol} with interval ${interval} and range ${range}`);
          }
          
          console.log(`Received ${responseData.length} data points from Yahoo API`);
          
          // Process and normalize the data
          const processedData = responseData.map(item => ({
            date: new Date(item.date || item.time || item.timestamp).getTime(),
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
            volume: Number(item.volume || 0)
          }));
          
          // Sort by date and remove duplicates
          const uniqueData = Array.from(
            new Map(processedData.sort((a, b) => a.date - b.date).map(item => [item.date, item]))
            .values()
          );
          
          if (uniqueData.length > 0) {
            console.log(`Successfully processed ${uniqueData.length} unique data points from Yahoo`);
            setData(uniqueData);
            setLastUpdated(new Date().toLocaleString());
            setIsLoading(false);
          } else {
            throw new Error(`No valid data points found after processing Yahoo data for ${symbol}`);
          }
        } catch (fallbackErr) {
          // Both APIs failed, combine the error messages for a complete picture
          const errorMessage = `Primary API error: ${primaryApiError.message}. Fallback API error: ${fallbackErr.message}`;
          console.error("All data fetching attempts failed:", errorMessage);
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    fetchChartData();
  }, [symbol, interval, range]);

  const handleSymbolChange = (e) => {
    setSymbol(e.target.value.toUpperCase());
  };

  const handleIntervalChange = (e) => {
    setInterval(e.target.value);
  };

  const handleRangeChange = (e) => {
    setRange(e.target.value);
  };

  return (
    <ChartLayout title={`${symbol} Chart - GannSq9`}>
      <PageContent>
        <Header>
          <Title>TradingView Lightweight Charts Demo</Title>
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Search for a symbol (e.g., AAPL, MSFT)"
              value={symbol}
              onChange={handleSymbolChange}
            />
          </SearchContainer>
        </Header>

        <ControlsContainer>
          <Select value={interval} onChange={handleIntervalChange}>
            <option value="1d">Daily</option>
            <option value="1wk">Weekly</option>
            <option value="1mo">Monthly</option>
          </Select>
          
          <Select value={range} onChange={handleRangeChange}>
            <option value="1mo">1 Month</option>
            <option value="3mo">3 Months</option>
            <option value="6mo">6 Months</option>
            <option value="1y">1 Year</option>
            <option value="5y">5 Years</option>
            <option value="max">Max</option>
          </Select>
          
          <Button
            onClick={() => {
              setData([]);
              setIsLoading(true);
              setError(null);
              // Re-trigger the effect by changing the lastUpdated timestamp
              setLastUpdated(null);
              setTimeout(() => {
                // Force a re-fetch
                const newTimestamp = Date.now();
                setLastUpdated(new Date(newTimestamp).toLocaleString());
              }, 100);
            }}
            disabled={isLoading}
          >
            Refresh Data
          </Button>
        </ControlsContainer>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {isLoading ? (
          <LoadingIndicator>
            <div className="spinner" />
          </LoadingIndicator>
        ) : data.length > 0 ? (
          <TradingViewLightweightChart
            data={data}
            width={1000}
            height={600}
            title={`${symbol} - ${interval} - ${range}`}
          />
        ) : (
          <div className="flex justify-center items-center h-96 bg-yellow-50 rounded border border-yellow-200">
            <div className="text-amber-600">No data available. Try a different symbol or time range.</div>
          </div>
        )}
      </PageContent>
    </ChartLayout>
  );
};

export default ChartDemo; 