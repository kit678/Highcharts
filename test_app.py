"""
Test script for the GannSq9 application.

This script tests the core functionality of getting Gann levels for a ticker.
"""

import requests
import json
import time
import sys

# Configuration
API_BASE_URL = "http://localhost:8000/api"  # Update if your server runs on a different port
TEST_TICKER = "AAPL"  # Change to any ticker you want to test

def test_get_sun_position():
    """Test getting the current sun position."""
    print("\n1. Testing sun position endpoint...")
    
    response = requests.get(f"{API_BASE_URL}/sun")
    
    if response.status_code == 200:
        sun_data = response.json()
        print(f"✅ Success! Current sun position:")
        print(f"  - Angle: {sun_data['angle']:.4f}°")
        print(f"  - Zodiac Sign: {sun_data['zodiac_sign']}")
        print(f"  - Date: {sun_data['date']}")
        return True
    else:
        print(f"❌ Failed to get sun position. Status code: {response.status_code}")
        print(f"Error: {response.text}")
        return False

def test_get_ticker_levels(ticker):
    """Test getting Gann levels for a specific ticker."""
    print(f"\n2. Testing levels endpoint for {ticker}...")
    
    response = requests.get(f"{API_BASE_URL}/levels/{ticker}")
    
    if response.status_code == 200:
        levels_data = response.json()
        print(f"✅ Success! Gann levels for {ticker}:")
        print(f"  - Current Price: ${levels_data['price']:.2f}")
        print(f"  - Sun Angle: {levels_data['sun_angle']:.4f}°")
        print(f"  - Up Levels: {[f'${level:.2f}' if level is not None else 'None' for level in levels_data['up_levels']]}")
        print(f"  - Down Levels: {[f'${level:.2f}' if level is not None else 'None' for level in levels_data['down_levels']]}")
        print(f"  - Timestamp: {levels_data['timestamp']}")
        return levels_data
    else:
        print(f"❌ Failed to get levels for {ticker}. Status code: {response.status_code}")
        print(f"Error: {response.text}")
        return None

def main():
    """Main test function."""
    print("=== GannSq9 API Test ===")
    
    # Make sure the API is running
    try:
        health_check = requests.get(f"{API_BASE_URL.replace('/api', '')}/health")
        if health_check.status_code != 200:
            print("❌ API server is not running or not responding!")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to the API server. Make sure it's running!")
        return
    
    # Test sun position endpoint
    sun_success = test_get_sun_position()
    
    if not sun_success:
        print("⚠️ Sun position test failed, but continuing...")
    
    # Test ticker levels endpoint
    ticker = TEST_TICKER
    if len(sys.argv) > 1:
        ticker = sys.argv[1].upper()
    
    levels_data = test_get_ticker_levels(ticker)
    
    if levels_data:
        print("\n=== Test Summary ===")
        print("✅ All tests completed successfully!")
    else:
        print("\n=== Test Summary ===")
        print("⚠️ Some tests failed. See above for details.")

if __name__ == "__main__":
    main() 