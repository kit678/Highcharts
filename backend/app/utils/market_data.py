"""
Market Data Utilities

This module provides functions for fetching market data from Yahoo Finance.
"""

import yfinance as yf
import pandas as pd
import logging
import time
import random
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define browser-like headers to avoid being detected as a bot
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0"
]

def get_current_price(ticker: str) -> Optional[float]:
    """
    Get the current price for a ticker symbol using Yahoo Finance Ticker object.
    
    Args:
        ticker: The ticker symbol
        
    Returns:
        float: The current price, or None if the ticker is not found
    """
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            # Create a Ticker object with custom headers
            stock = yf.Ticker(ticker)
            
            # Get the last day of data
            data = stock.history(period="1d")
            
            # Check if we got any data
            if data.empty:
                logger.warning(f"No data returned for ticker {ticker}")
                
                if attempt < max_retries - 1:
                    logger.info(f"Retrying ({attempt+1}/{max_retries})...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                    continue
                    
                return None
            
            # Return the latest close price
            price = data['Close'].iloc[-1]
            logger.info(f"Successfully retrieved price for {ticker}: ${price}")
            return price
            
        except Exception as e:
            logger.error(f"Attempt {attempt+1}/{max_retries}: Error fetching price for {ticker}: {str(e)}")
            
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                logger.error(f"All retries failed for {ticker}")
                return None

def get_prices_for_tickers(tickers: List[str]) -> Dict[str, Optional[float]]:
    """
    Get prices for multiple tickers.
    
    Args:
        tickers: List of ticker symbols
        
    Returns:
        dict: Dictionary mapping ticker symbols to prices
    """
    prices = {}
    
    for ticker in tickers:
        # Add a small delay between requests to avoid rate limits
        time.sleep(1.5)
        price = get_current_price(ticker)
        prices[ticker] = price
    
    return prices

def get_daily_prices(ticker: str, days: int = 30) -> Optional[pd.DataFrame]:
    """
    Get daily prices for a ticker for the specified number of days.
    
    Args:
        ticker: The ticker symbol
        days: Number of days of data to retrieve
        
    Returns:
        DataFrame: DataFrame with daily prices, or None if data retrieval fails
    """
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            # Create a Ticker object
            stock = yf.Ticker(ticker)
            
            # Get historical data
            period = f"{days}d" if days <= 60 else "max"
            data = stock.history(period=period)
            
            # Check if we got any data
            if data.empty:
                logger.warning(f"No historical data returned for ticker {ticker}")
                
                if attempt < max_retries - 1:
                    logger.info(f"Retrying ({attempt+1}/{max_retries})...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                    continue
                    
                return None
            
            # Return only the needed rows if we got more than requested
            if len(data) > days:
                data = data.iloc[-days:]
                
            return data
            
        except Exception as e:
            logger.error(f"Attempt {attempt+1}/{max_retries}: Error fetching daily prices for {ticker}: {str(e)}")
            
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                logger.error(f"All retries failed for {ticker}")
                return None

def get_historical_data(
    ticker: str, 
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    period: str = "1y",
    interval: str = "1d"  # Add interval parameter
) -> pd.DataFrame:
    """
    Fetch historical market data from Yahoo Finance.
    
    Args:
        ticker: The stock ticker symbol
        start_date: Start date for data retrieval
        end_date: End date for data retrieval
        period: Time period for data (e.g. '1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max')
        interval: Data interval (e.g. '1m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo')
    
    Returns:
        DataFrame containing historical price data
    
    Raises:
        ValueError: If the ticker doesn't exist or data cannot be retrieved
    """
    logger.info(f"Fetching historical data for {ticker} with interval={interval}, period={period}")
    
    if not ticker:
        raise ValueError("Ticker symbol is required")
    
    # Add retry logic
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Configure a session with browser-like headers
            session = requests.Session()
            session.headers.update({
                'User-Agent': random.choice(USER_AGENTS),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            })
            
            # Add a delay to avoid rate limits (increase delay with each retry)
            time.sleep(1 * (retry_count + 1))
            
            if start_date and end_date:
                # Format dates as strings
                start_str = start_date.strftime('%Y-%m-%d')
                end_str = end_date.strftime('%Y-%m-%d')
                
                # Fetch the historical data WITH interval parameter
                hist_data = yf.download(
                    ticker, 
                    start=start_str, 
                    end=end_str,
                    interval=interval,  # Use interval parameter
                    progress=False,
                    session=session
                )
            else:
                # Use the period parameter WITH interval
                hist_data = yf.download(
                    ticker, 
                    period=period,
                    interval=interval,  # Use interval parameter
                    progress=False,
                    session=session
                )
            
            # Verify we actually got data
            if hist_data is None or hist_data.empty:
                retry_count += 1
                logger.warning(f"Attempt {retry_count}/{max_retries}: No data for {ticker} (interval={interval}, period={period})")
                if retry_count >= max_retries:
                    raise ValueError(f"No historical data available for {ticker} with interval={interval} and period={period}")
                continue
                
            # Verify the data has the expected columns
            required_columns = ["Open", "High", "Low", "Close"]
            missing_columns = [col for col in required_columns if col not in hist_data.columns]
            if missing_columns:
                retry_count += 1
                logger.warning(f"Attempt {retry_count}/{max_retries}: Missing columns {missing_columns}")
                if retry_count >= max_retries:
                    raise ValueError(f"Data missing required columns: {', '.join(missing_columns)}")
                continue
            
            # Log success and return the data
            logger.info(f"Successfully retrieved {len(hist_data)} data points for {ticker}")
            return hist_data
            
        except Exception as e:
            retry_count += 1
            logger.warning(f"Attempt {retry_count}/{max_retries}: Error fetching data: {str(e)}")
            
            if retry_count >= max_retries:
                logger.error(f"All {max_retries} attempts failed for {ticker}")
                # Don't fall back to demo data - raise the error
                raise ValueError(f"Failed to fetch data for {ticker} after {max_retries} attempts: {str(e)}") from e
            
            # Add exponential backoff delay before retry
            time.sleep(2 ** retry_count)
    
    # This should never be reached due to the exception in the loop
    raise ValueError(f"Unexpected error fetching data for {ticker}")

def is_market_open() -> bool:
    """
    Check if the US stock market is currently open.
    
    Returns:
        bool: True if the market is open, False otherwise
    """
    # Get the current date and time in Eastern Time (US market time)
    now = datetime.now()
    
    # Check if it's a weekday (0 is Monday, 6 is Sunday)
    if now.weekday() >= 5:  # Saturday or Sunday
        return False
    
    # Market hours: 9:30 AM to 4:00 PM Eastern Time
    # This is a simplification; doesn't account for holidays
    current_hour = now.hour
    current_minute = now.minute
    current_time = current_hour + current_minute / 60.0
    
    # Market is open from 9:30 AM to 4:00 PM Eastern Time
    return 9.5 <= current_time <= 16.0 