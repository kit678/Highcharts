import { fetchData } from '../../../utils/api';

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
 * Get historical stock data
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  const { symbol, interval = '1d', range = '1y' } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  try {
    const data = await fetchData(symbol, interval, range);
    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    res.status(500).json({ error: error.message });
  }
} 