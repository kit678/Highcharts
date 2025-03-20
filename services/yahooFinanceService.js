/**
 * Yahoo Finance API Service
 * 
 * This service handles fetching stock data from Yahoo Finance.
 */

/**
 * Fetches OHLC stock data from Yahoo Finance API
 * 
 * @param {string} ticker - The stock ticker symbol (e.g., 'AAPL', 'MSFT')
 * @param {string} interval - The time interval (e.g., '1d', '1h', '5m')
 * @param {string} range - The time range (e.g., '1mo', '6mo', '1y')
 * @returns {Promise<Array>} - Array of OHLC data points
 */
export const fetchStockData = async (ticker, interval = '1d', range = '1mo') => {
  try {
    const response = await fetch(`/api/yahoo-finance?ticker=${ticker}&interval=${interval}&range=${range}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data returned from API');
    }
    
    const result = data.chart.result[0];
    const { timestamp, indicators } = result;
    const quote = indicators.quote[0];
    
    // Check if we have the required OHLC data
    if (!timestamp || !quote || !quote.open || !quote.high || !quote.low || !quote.close) {
      throw new Error('Incomplete data returned from API');
    }
    
    // Map the data to Highcharts format including volume data
    const ohlcData = timestamp.map((time, i) => {
      // Skip undefined values
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
    
    return ohlcData;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
};

/**
 * Interval options for Yahoo Finance
 */
export const INTERVAL_OPTIONS = [
  { label: "1 Minute", value: "1m" },
  { label: "2 Minutes", value: "2m" },
  { label: "5 Minutes", value: "5m" },
  { label: "15 Minutes", value: "15m" },
  { label: "30 Minutes", value: "30m" },
  { label: "60 Minutes", value: "60m" },
  { label: "90 Minutes", value: "90m" },
  { label: "1 Day", value: "1d" },
  { label: "5 Days", value: "5d" },
  { label: "1 Week", value: "1wk" },
  { label: "1 Month", value: "1mo" },
  { label: "3 Months", value: "3mo" }
];

/**
 * Range options for Yahoo Finance
 */
export const RANGE_OPTIONS = [
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

/**
 * Fetch historical data for a given symbol
 * 
 * @param {string} symbol - Stock symbol (e.g., 'AAPL', 'MSFT')
 * @param {string} interval - Data interval ('1d', '1wk', '1mo')
 * @param {string} range - Historical data range ('1mo', '3mo', '6mo', '1y', '5y', 'max')
 * @returns {Promise<Array>} - Array of candlestick data
 */
export const fetchHistoricalData = async (symbol, interval = '1d', range = '1y') => {
  try {
    console.log(`Fetching data for ${symbol} with interval ${interval} and range ${range}`);
    
    // This would be a real API endpoint in a production app
    const response = await fetch(`/api/yahoofinance/history?symbol=${symbol}&interval=${interval}&range=${range}`);
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate the response data
    if (!Array.isArray(data)) {
      throw new Error(`Invalid data format received from API: expected array, got ${typeof data}`);
    }
    
    if (data.length === 0) {
      throw new Error(`No data available for ${symbol} with interval ${interval} and range ${range}`);
    }
    
    console.log(`Successfully fetched ${data.length} data points for ${symbol}`);
    return data;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    // Instead of falling back to sample data, throw the error so the caller can handle it
    throw new Error(`Failed to fetch data for ${symbol}: ${error.message}`);
  }
};

/**
 * Search for stocks by query string
 * 
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of search results
 */
export const searchSymbols = async (query) => {
  try {
    // Use Alpha Vantage symbol search instead of Yahoo Finance
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=demo`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to search: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.bestMatches && data.bestMatches.length > 0) {
      return data.bestMatches.map(match => ({
        symbol: match["1. symbol"],
        name: match["2. name"],
        type: match["3. type"],
        region: match["4. region"],
        currency: match["8. currency"]
      }));
    }
    
    // If no results or error, return some common stocks for demo
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity', region: 'United States' }
    ];
  } catch (error) {
    console.error('Error searching symbols:', error);
    // Return some default symbols on error
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'United States' }
    ];
  }
};

/**
 * Generate sample data for demo/testing purposes
 */
const generateSampleData = (length, symbol = 'DEMO') => {
  const today = new Date();
  const basePrice = symbol === 'AAPL' ? 180 : 
                   symbol === 'MSFT' ? 320 : 
                   symbol === 'GOOGL' ? 140 : 100;
  
  return Array.from({ length }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (length - i));
    
    // Random price movement
    const change = (Math.random() - 0.5) * 5;
    const open = basePrice + i * 0.5 + (Math.random() - 0.5) * 5;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    
    return {
      date: formatDate(date),
      open,
      high,
      low, 
      close,
      volume: Math.floor(Math.random() * 10000000) + 1000000
    };
  });
};

/**
 * Format date as YYYY-MM-DD
 */
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

export default {
  fetchStockData,
  fetchHistoricalData,
  searchSymbols
}; 