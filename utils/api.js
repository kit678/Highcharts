import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock API responses for when the backend is not available
const mockResponses = {
  tickers: {
    tickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA']
  },
  sun: {
    date: new Date().toISOString(),
    position: {
      azimuth: 180 + Math.random() * 60 - 30,
      altitude: 45 + Math.random() * 20 - 10,
    },
    declination: 23.5 * Math.sin((new Date().getMonth() + 10) / 12 * Math.PI * 2)
  },
  levels: {
    levels: [
      { price: 180.5, type: 'support', strength: 'strong' },
      { price: 175.25, type: 'support', strength: 'medium' },
      { price: 185.75, type: 'resistance', strength: 'medium' },
      { price: 190.0, type: 'resistance', strength: 'strong' },
    ]
  },
  breaches: {
    breaches: []
  }
};

// Add error handler to fall back to mock data
api.interceptors.response.use(
  response => response,
  error => {
    console.warn('API call failed, using mock data:', error.config.url);
    
    // Extract the endpoint from the URL
    const url = error.config.url;
    
    if (url.includes('/api/tickers')) {
      return Promise.resolve({ data: mockResponses.tickers });
    }
    
    if (url.includes('/api/sun')) {
      return Promise.resolve({ data: mockResponses.sun });
    }
    
    if (url.includes('/api/levels')) {
      return Promise.resolve({ data: mockResponses.levels });
    }
    
    if (url.includes('/api/breaches')) {
      return Promise.resolve({ data: mockResponses.breaches });
    }
    
    if (url.includes('/api/tradingview')) {
      return Promise.resolve({ data: { script: '// TradingView script' } });
    }
    
    // If no mock response is defined, reject with the original error
    return Promise.reject(error);
  }
);

/**
 * Fetch historical stock data with various interval options
 * This is used by the API route /api/history/[symbol]
 * 
 * @param {string} symbol - The stock ticker symbol (e.g., 'AAPL', 'MSFT')
 * @param {string} interval - The time interval (e.g., '1d', '1h', '5m')
 * @param {string} range - The time range (e.g., '1mo', '6mo', '1y')
 * @returns {Promise<Array>} - Array of OHLC data points
 */
export const fetchData = async (symbol, interval = '1d', range = '1y') => {
  try {
    console.log(`Fetching historical data for ${symbol} with interval: ${interval}, range: ${range}`);
    
    // Check for valid interval
    const validIntervals = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1wk', '1mo'];
    if (!validIntervals.includes(interval)) {
      console.warn(`Invalid interval: ${interval}, defaulting to '1d'`);
      interval = '1d';
    }
    
    // Make a request to Yahoo Finance API
    const yahooApiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await axios.get(yahooApiUrl, {
      params: {
        interval: interval,
        range: range,
        includePrePost: true
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    // Check if we got valid data
    if (!response.data || !response.data.chart || !response.data.chart.result || response.data.chart.result.length === 0) {
      throw new Error('No data returned from Yahoo Finance API');
    }
    
    const result = response.data.chart.result[0];
    const { timestamp, indicators } = result;
    const quote = indicators.quote[0];
    
    // Check if we have the required OHLC data
    if (!timestamp || !quote || !quote.open || !quote.high || !quote.low || !quote.close) {
      throw new Error('Incomplete data returned from API');
    }
    
    // Map the data to Highcharts format including volume data
    const ohlcData = timestamp.map((time, i) => {
      // Skip null/undefined values
      if (!quote.open[i] || !quote.high[i] || !quote.low[i] || !quote.close[i]) {
        return null;
      }
      
      return [
        time * 1000, // Convert timestamp to milliseconds
        parseFloat(quote.open[i]),
        parseFloat(quote.high[i]),
        parseFloat(quote.low[i]),
        parseFloat(quote.close[i]),
        // Include volume data if available
        quote.volume && quote.volume[i] ? parseInt(quote.volume[i], 10) : 0
      ];
    }).filter(point => point !== null); // Remove any null entries
    
    console.log(`Successfully fetched ${ohlcData.length} data points for ${symbol} with interval ${interval}`);
    return ohlcData;
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    // Generate demo data as a fallback
    const demoPoints = generateDemoData(100, interval);
    console.log(`Returning ${demoPoints.length} demo data points as fallback`);
    return demoPoints;
  }
};

/**
 * Generate demo data for fallback when API fails
 * Adjusts time intervals based on the requested interval
 */
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
  
  // Generate data points with appropriate time interval
  for (let i = 0; i < count; i++) {
    const timestamp = today.getTime() - (count - i) * timeIncrement;
    
    // Generate price movement
    const volatility = interval.includes('m') ? 0.01 : (interval === '1d' ? 0.02 : 0.03);
    const change = (Math.random() - 0.5) * basePrice * volatility;
    const open = basePrice;
    const close = basePrice + change;
    basePrice = close; // Use previous close as next open
    
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 500000;
    
    result.push([
      timestamp,  // Date in milliseconds
      open,      // Open
      high,      // High
      low,       // Low
      close,     // Close
      volume     // Volume
    ]);
  }
  
  return result;
};

// Sun position
export const getSunPosition = async () => {
  try {
    const response = await api.get('/api/sun');
    return response.data;
  } catch (error) {
    console.error('Error fetching sun position:', error);
    throw error;
  }
};

// Tickers
export const getAllTickers = async () => {
  try {
    const response = await api.get('/api/tickers');
    return response.data.tickers;
  } catch (error) {
    console.error('Error fetching tickers:', error);
    throw error;
  }
};

export const addTicker = async (ticker) => {
  try {
    const response = await api.post('/api/tickers', { ticker });
    return response.data;
  } catch (error) {
    console.error('Error adding ticker:', error);
    throw error;
  }
};

export const removeTicker = async (ticker) => {
  try {
    const response = await api.delete(`/api/tickers/${ticker}`);
    return response.data;
  } catch (error) {
    console.error('Error removing ticker:', error);
    throw error;
  }
};

// Gann Levels
export const getLevelsForTicker = async (ticker, recalculate = false) => {
  try {
    const response = await api.get(`/api/levels/${ticker}`, {
      params: { recalculate },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching levels for ${ticker}:`, error);
    throw error;
  }
};

export const getLevelsForAllTickers = async (recalculate = false) => {
  try {
    const response = await api.get('/api/levels', {
      params: { recalculate },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching levels for all tickers:', error);
    throw error;
  }
};

// Price Breaches
export const checkTickerBreaches = async (ticker) => {
  try {
    const response = await api.get(`/api/breaches/${ticker}`);
    return response.data;
  } catch (error) {
    console.error(`Error checking breaches for ${ticker}:`, error);
    throw error;
  }
};

export const checkAllTickerBreaches = async () => {
  try {
    const response = await api.get('/api/breaches');
    return response.data;
  } catch (error) {
    console.error('Error checking breaches for all tickers:', error);
    throw error;
  }
};

// TradingView
export const getTradingViewScript = async (ticker) => {
  try {
    const response = await api.get(`/api/tradingview/${ticker}`);
    return response.data;
  } catch (error) {
    console.error(`Error generating TradingView script for ${ticker}:`, error);
    throw error;
  }
};

export default api; 