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