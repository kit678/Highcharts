// This file creates a Next.js API route to fetch Yahoo Finance data
// We'll use node-fetch to make requests from our server-side API

import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { ticker, interval, range } = req.query;
  
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker symbol is required' });
  }
  
  // Default to 1-day interval and 1-month range if not specified
  const dataInterval = interval || '1d';
  const dataRange = range || '1mo';
  
  try {
    // Use Yahoo Finance API v8 (unofficial)
    // Note: This is not an official API and could change without notice
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${dataInterval}&range=${dataRange}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.chart.error) {
      throw new Error(data.chart.error.description);
    }
    
    // Return the raw data without transformation - our service will handle that
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch data' });
  }
} 