"""
TradingView Integration Utility

This module provides functions to integrate with TradingView through their Pine Script API.
It helps generate Pine Script code to draw horizontal lines at calculated Gann levels.
"""

import logging
from typing import Dict, List, Any, Optional
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_pine_script(
    ticker: str,
    up_levels: List[float],
    down_levels: List[float],
    current_price: float
) -> str:
    """
    Generate Pine Script code to draw horizontal lines at Gann levels.
    
    Args:
        ticker: The ticker symbol
        up_levels: List of up levels
        down_levels: List of down levels
        current_price: The current price
        
    Returns:
        str: Pine Script code
    """
    # Basic Pine Script header
    script = f"""
// Gann Square of 9 Levels for {ticker}
// Generated on {os.environ.get('DATE', 'today')}
// Current price: {current_price}

//@version=4
study("Gann Square of 9 Levels for {ticker}", overlay=true)

// Current price line
price_line = hline({current_price}, "Current Price", color=color.blue, linestyle=hline.style_dashed, linewidth=2)
"""
    
    # Add up levels
    for i, level in enumerate(up_levels):
        if level is not None:
            script += f"""
// Up level {i+1}
up_level_{i+1} = hline({level}, "Up Level {i+1}", color=color.lime, linestyle=hline.style_solid, linewidth=1)
"""
    
    # Add down levels
    for i, level in enumerate(down_levels):
        if level is not None:
            script += f"""
// Down level {i+1}
down_level_{i+1} = hline({level}, "Down Level {i+1}", color=color.red, linestyle=hline.style_solid, linewidth=1)
"""
    
    # Add alerts for price crossing levels
    script += """
// Create alerts
"""
    
    for i, level in enumerate(up_levels):
        if level is not None:
            script += f"""
alertcondition(crossover(close, {level}), title="Price crossed Up Level {i+1}", message="Price crossed Up Level {i+1} at {{close}}")
"""
    
    for i, level in enumerate(down_levels):
        if level is not None:
            script += f"""
alertcondition(crossunder(close, {level}), title="Price crossed Down Level {i+1}", message="Price crossed Down Level {i+1} at {{close}}")
"""
    
    return script


def save_pine_script_to_file(ticker: str, script: str) -> str:
    """
    Save the generated Pine Script to a file.
    
    Args:
        ticker: The ticker symbol
        script: The Pine Script code
        
    Returns:
        str: The path to the saved file
    """
    try:
        # Create a directory for scripts if it doesn't exist
        os.makedirs("pine_scripts", exist_ok=True)
        
        # Define the file path
        file_path = f"pine_scripts/{ticker}_gann_levels.pine"
        
        # Write the script to the file
        with open(file_path, "w") as f:
            f.write(script)
        
        logger.info(f"Pine Script saved to {file_path}")
        return file_path
    
    except Exception as e:
        logger.error(f"Error saving Pine Script to file: {str(e)}")
        return ""


def generate_tradingview_url(ticker: str) -> str:
    """
    Generate a TradingView URL for the given ticker.
    
    Args:
        ticker: The ticker symbol
        
    Returns:
        str: The TradingView URL
    """
    # TradingView URL format
    return f"https://www.tradingview.com/chart/?symbol={ticker}"


def generate_pine_script_for_ticker(
    ticker: str,
    up_levels: List[float],
    down_levels: List[float],
    current_price: float
) -> Dict[str, Any]:
    """
    Generate Pine Script for a ticker and save it to a file.
    
    Args:
        ticker: The ticker symbol
        up_levels: List of up levels
        down_levels: List of down levels
        current_price: The current price
        
    Returns:
        dict: Dictionary containing the script, file path, and TradingView URL
    """
    try:
        # Generate the Pine Script
        script = generate_pine_script(ticker, up_levels, down_levels, current_price)
        
        # Save the script to a file
        file_path = save_pine_script_to_file(ticker, script)
        
        # Generate the TradingView URL
        tv_url = generate_tradingview_url(ticker)
        
        return {
            "symbol": ticker,
            "script": script,
            "file_path": file_path,
            "tradingview_url": tv_url
        }
    
    except Exception as e:
        logger.error(f"Error generating Pine Script for {ticker}: {str(e)}")
        return {
            "symbol": ticker,
            "error": str(e)
        } 